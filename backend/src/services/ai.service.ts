import pdf from 'pdf-parse';

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
 * AI features have been disabled — return an empty summary result.
 * This keeps the function available for callers but prevents external API calls.
 */
export const generateStudySummary = async (_text: string): Promise<AISummaryResult> => {
    return {
        abstract: '',
        methodology: '',
        keyFindings: '',
    };
};
