import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';

// Initialize the API using your key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// We use the fast and cheap flash model, perfect for text processing
const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
        // Enforce JSON output for easy database insertion
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
        const result = await model.generateContent(prompt);
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
        throw new Error('Failed to generate summary from AI.');
    }
};
