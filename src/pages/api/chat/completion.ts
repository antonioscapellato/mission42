// pages/api/chat.ts

import { generateText, tool } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createOllama } from 'ollama-ai-provider';
import { z } from 'zod';

// Ollama setup
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages must be an array' });
    }

    const systemPrompt = `
You are Mission42, an AI agent specialized in helping users set up and manage satellite constellations.
You can assist with constellation design, orbital parameters, and provide expert guidance on satellite deployment and management.
`.trim();

    const prompt = `${systemPrompt}\n\n${messages.map((msg: any) =>
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;

    const model = ollama(process.env.OLLAMA_MODEL_NAME || "llama2");

    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 512,
      tools: {
        weather: tool({
          description: 'Get the weather in a location',
          parameters: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => ({
            location,
            temperature: 72 + Math.floor(Math.random() * 21) - 10,
          }),
        }),
      },
    });

    return res.status(200).json({
      id: Date.now().toString(),
      role: 'assistant',
      content: text,
      createdAt: Date.now(),
    });

  } catch (error) {
    console.error('❌ Chat handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
