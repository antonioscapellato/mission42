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
You are Mission42, an AI assistant specialized in satellite constellation design and management.
Your goal is to assist the user in planning a constellation by collecting three pieces of information: the number of satellites, the number of orbital planes, and a valid altitude for each plane in Low Earth Orbit (LEO). Then, you will make an API call to generate the constellation.

Follow these steps:

Greet the user and explain your role: Introduce yourself as an aerospace engineering teacher and explain that you'll help design a satellite constellation to cover the globe. Mention that there are limits: up to 60 satellites, up to 10 orbital planes, and altitudes between 160 km and 2000 km.,

Collect information:
Number of Satellites: Ask the user how many satellites they want in their constellation. Mention the limit is 60 satellites. Suggest a range (e.g., 10 to 60) for global coverage. Ensure the input is a positive integer and does not exceed 60.,
Number of Orbital Planes: Explain that orbital planes are like "rings" around Earth at different angles, and multiple planes help ensure global coverage. Ask how many planes they want, mentioning the limit is 10 planes. Suggest 5 to 10 for good coverage. Ensure the input is a positive integer, less than or equal to the number of satellites, and does not exceed 10.,
Altitude per Plane: Explain that satellites in LEO must orbit between 160 km and 2000 km above Earth. Ask for an altitude for each orbital plane (one altitude per plane). The user must provide exactly as many altitudes as there are planes (e.g., if they chose 5 planes, they need 5 altitudes). If the user provides one value, apply it to all planes. Validate that each altitude is between 160 km and 2000 km.,
,

Validate inputs:
Number of satellites must be a positive integer and ≤ 60.,
Number of orbital planes must be a positive integer, ≤ 10, and ≤ the number of satellites.,
Altitudes must be numbers between 160 and 2000 km. The number of altitudes provided must match the number of planes. If the user provides one altitude, replicate it for all planes.,
,

Confirm with the user:
Summarize the constellation: "You want a constellation with X satellites across Y orbital planes, at altitudes [Z1, Z2, ..., Zn] km. Does that sound right?",
Ask: "Would you like to generate this constellation now?"
`.trim();

    const prompt = `${systemPrompt}\n\n${messages.map((msg: any) =>
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;

    const model = ollama(process.env.OLLAMA_MODEL_NAME || "llama2");

    const { text } = await generateText({
      model,
      prompt,
      maxSteps: 2,
      maxTokens: 512,
      tools: {
        createConstellation: tool({
          description: 'Create a new satellite constellation. Only use this tool when the user explicitly requests to create a constellation.',
          parameters: z.object({
            numSatellites: z.number()
              .describe('Total number of satellites in the constellation (1-60)'),
            numPlanes: z.number()
              .describe('Number of orbital planes (1-10)'),
            altitudesPerPlane: z.number()
              .describe('Altitude per Plane in km (160-2000)'),
          }),
          execute: async ({ numSatellites, numPlanes, altitudesPerPlane }) => {
            console.log('🛰️ Constellation creation requested with parameters:');

            console.log('  - Number of satellites:', numSatellites);
            console.log('  - Number of planes:', numPlanes);
            console.log('  - Altitudes per Plane:', altitudesPerPlane);
            
            console.log('📡 Sending request to TravellingSpaceman API...');
            const response = await fetch('https://www.travellingspaceman.com/api/constellation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                numSatellites: numSatellites < 1 ? 1 : Number(numSatellites),
                numPlanes: numPlanes < 1 ? 1 : Number(numPlanes),
                altitudesPerPlane: 500
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
            
            return `Successfully created constellation with ${numSatellites} satellites across ${numPlanes} planes at altitude ${altitudesPerPlane} km`;
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
