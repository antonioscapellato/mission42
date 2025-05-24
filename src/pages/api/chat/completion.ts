// AI SDK
import { generateText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';

// Ollama
import { createOllama } from 'ollama-ai-provider';
const ollama = createOllama({
    // optional settings, e.g.
    baseURL: 'http://localhost:11434/api',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Received chat completion request:', req.method);
  
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    console.log('Processing messages:', messages.length, 'messages received');
    
    // Convert messages array into a prompt string
    const prompt = messages.map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    console.log('Generated prompt:', prompt.substring(0, 100) + '...');

    console.log('Generating response with Ollama...');

    const { text } = await generateText({
      model: ollama('llama3.2:latest'),
      prompt: prompt,
      maxTokens: 512,
    });

    console.log('Response: ', text);

    console.log('Response generated successfully!');

    return res.status(200).json({ 
      id: Date.now().toString(),
      role: 'assistant',
      content: text
    });
  } catch (error) {
    console.error('❌ Error processing chat completion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}