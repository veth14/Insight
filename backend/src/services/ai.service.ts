import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';

// Initialize the API using your key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Allow selecting model via env var; fall back to a common default if provided
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const createModel = (modelName?: string) => genAI.getGenerativeModel({
    model: modelName || DEFAULT_GEMINI_MODEL,
    generationConfig: {
        responseMimeType: 'application/json',
    }
});

interface AISummaryResult {
    abstract: string;
    methodology: string;
    keyFindings: string;
}

/**
 * Parses a PDF buffer and extracts text content
 */
export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF document.');
    }
};

/**
 * Sends extracted text to Gemini for summarization
 */
export const generateStudySummary = async (text: string): Promise<AISummaryResult> => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
    }

    // We constrain the input size to what's strictly necessary (e.g. first 40,000 characters) 
    // to avoid excessive wait times, but you can increase this later.
    const constrainedText = text.substring(0, 40000);

    const prompt = `
    You are an expert academic assistant. Read the following academic text and extract its core components.
    Return a strictly formatted JSON object with exactly these three keys:
    1. "abstract": A concise summary of the entire paper (1-2 paragraphs).
    2. "methodology": A brief description of the methods, materials, or approach used.
    3. "keyFindings": A bulleted list formulated as a single string (separated by newlines or list dashes) highlighting the main results or conclusions.

    Text to analyze:
    """
    ${constrainedText}
    """
    `;

    try {
        const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
        const modelInstance = createModel(modelName);
        const result = await modelInstance.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the enforced JSON output
        const parsed = JSON.parse(responseText) as AISummaryResult;
        return {
            abstract: parsed.abstract || 'No abstract generated.',
            methodology: parsed.methodology || 'No methodology generated.',
            keyFindings: parsed.keyFindings || 'No findings generated.'
        };
    } catch (error) {
        console.error('Gemini summarization error:', error);

        // If the error indicates the configured model is not available for this API version,
        // attempt to list available models (if the client supports it) and provide actionable logs.
        try {
            if (typeof (genAI as any).listModels === 'function') {
                const list = await (genAI as any).listModels();
                const available = (list?.models || list || []).map((m: any) => m.name || m.id || m.model || JSON.stringify(m));
                console.error('[Gemini] Available models:', available.slice(0, 20));
            }
        } catch (listErr) {
            console.error('[Gemini] Could not list available models:', listErr);
        }

        // Provide a clearer error message for operators
        const msg = (error as any)?.message || String(error);
        if (/not found|is not found|Not Found/i.test(msg)) {
            throw new Error(`Failed to generate AI summary: configured model "${process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}" was not found for this API/version. Check GEMINI_MODEL and GEMINI_API_KEY, or call the provider's ListModels to find a supported model. Original error: ${msg}`);
        }

        throw new Error('Failed to generate summary from AI. ' + msg);
    }
};
