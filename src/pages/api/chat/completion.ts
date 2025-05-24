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
      maxSteps: 1,
      maxTokens: 512,
      tools: {
        createConstellation: tool({
          description: 'Create a satellite constellation with specified parameters',
          parameters: z.object({
            numSatellites: z.number().describe('Total number of satellites in the constellation'),
            numPlanes: z.number().describe('Number of orbital planes'),
            altitudesPerPlane: z.union([
              z.number().describe('Single altitude in kilometers for all planes'),
              z.array(z.number()).describe('Array of altitudes in kilometers for each plane')
            ]),
          }),
          execute: async ({ numSatellites, numPlanes, altitudesPerPlane }) => {
            console.log('🛰️ Constellation creation requested with parameters:');
            console.log('  - Number of satellites:', numSatellites);
            console.log('  - Number of planes:', numPlanes);
            
            // Convert single altitude to array if needed
            const altitudes = Array.isArray(altitudesPerPlane) 
              ? altitudesPerPlane 
              : Array(numPlanes).fill(altitudesPerPlane);
            
            console.log('  - Altitudes per plane:', altitudes);
            
            console.log('📡 Sending request to TravellingSpaceman API...');
            const response = await fetch('https://www.travellingspaceman.com/api/constellation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                numSatellites,
                numPlanes,
                altitudesPerPlane: altitudes,
              }),
            });

            if (!response.ok) {
              console.error('❌ API request failed:', response.status, response.statusText);
              throw new Error(`Failed to create constellation: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✨ Constellation successfully created:');
            console.log('  - Response status:', response.status);
            console.log('  - Response data:', JSON.stringify(result, null, 2));
            
            return `Successfully created constellation with ${numSatellites} satellites across ${numPlanes} planes at altitudes ${altitudes.join(', ')} km`;
          },
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
