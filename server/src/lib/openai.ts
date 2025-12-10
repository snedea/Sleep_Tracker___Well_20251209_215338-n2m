import OpenAI from 'openai';

// Initialize OpenAI client
// The API key is loaded from environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// Helper type for chat messages
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Helper function to generate AI response
export async function generateCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const { model = 'gpt-4o-mini', maxTokens = 500, temperature = 0.7 } = options || {};

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}
