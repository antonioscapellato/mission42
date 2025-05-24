// pages/api/chat.ts

import { generateText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createOllama } from 'ollama-ai-provider';

// Ollama setup
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Function to parse constellation parameters from LLM response
function parseConstellationParams(text: string) {
  // Extract: "X satellites across Y orbital planes at altitude Z km"
  const match = text.match(/(\d+)\s+satellites?\s+across\s+(\d+)\s+orbital\s+planes?\s+at\s+altitude\s+(\d+(?:\.\d+)?)\s+km/i);
  
  if (!match) {
    return null;
  }

  const numSatellites = parseInt(match[1]);
  const numPlanes = parseInt(match[2]);
  const altitude = parseFloat(match[3]);
  
  // Validate altitude is a valid number
  if (isNaN(altitude)) {
    return null;
  }

  return {
    numSatellites,
    numPlanes,
    altitude
  };
}

// Function to call TravellingSpaceman API
async function createConstellation(numSatellites: number, numPlanes: number, altitude: number) {
  console.log('🛰️ Constellation creation requested with parameters:');
  console.log('  - Number of satellites:', numSatellites);
  console.log('  - Number of planes:', numPlanes);
  console.log('  - Altitude:', altitude, 'km');
  
  console.log('📡 Sending request to TravellingSpaceman API...');
  const response = await fetch('https://www.travellingspaceman.com/api/constellation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      numSatellites: numSatellites < 1 ? 1 : numSatellites,
      numPlanes: numPlanes < 1 ? 1 : numPlanes,
      altitudesPerPlane: altitude
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
  
  return result;
}

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
Your goal is to assist the user in planning a constellation by collecting three pieces of information: the number of satellites, the number of orbital planes, and one altitude that will apply to all planes in Low Earth Orbit (LEO). Then, you will make an API call to generate the constellation.


Follow these steps:

Greet the user and explain your role: Introduce yourself as an aerospace engineering teacher and explain that you'll help design a satellite constellation to cover the globe. Mention the limits: up to 60 satellites, up to 10 orbital planes, and altitude between 160 km and 2000 km.,

Collect information:
Number of Satellites: Ask the user how many satellites they want in their constellation. Mention the limit is 60 satellites. Suggest a range (e.g., 10 to 60) for global coverage. Ensure the input is a positive integer and does not exceed 60.,
Number of Orbital Planes: Explain that orbital planes are like "rings" around Earth at different angles, and multiple planes help ensure global coverage. Ask how many planes they want, mentioning the limit is 10 planes. Suggest 5 to 10 for good coverage. Ensure the input is a positive integer, less than or equal to the number of satellites, and does not exceed 10.,
Altitude: Explain that satellites in LEO must orbit between 160 km and 2000 km above Earth. Ask for one altitude that will be used for all orbital planes. Validate that the altitude is between 160 km and 2000 km.,
,

Validate inputs:
Number of satellites must be a positive integer and ≤ 60.,
Number of orbital planes must be a positive integer, ≤ 10, and ≤ the number of satellites.,
Altitude must be a number between 160 and 2000 km.,
,

Confirm with the user:
Summarize the constellation: "You want a constellation with X satellites across Y orbital planes at altitude Z km. Does that sound right?",
Ask: "Would you like to generate this constellation now?",
,

Signal readiness with a keyword:
If the user confirms (e.g., says "yes" or "generate"), respond with: "I have all the details to generate your constellation with X satellites across Y orbital planes at altitude Z km. Ready to proceed! TRIGGER_API_CALL"
Include the keyword TRIGGER_API_CALL exactly as written at the end of the response. This keyword signals the backend to make the API call:"
`.trim();

    const prompt = `${systemPrompt}\n\n${messages.map((msg: any) =>
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;

    const model = ollama(process.env.OLLAMA_MODEL_NAME || "llama2");

    // Generate LLM response without tools
    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 512,
    });

    // Check if the response contains the trigger keyword
    if (text.includes('TRIGGER_API_CALL')) {
      console.log('🚀 TRIGGER_API_CALL detected, attempting to parse parameters...');
      
      // Parse constellation parameters from the response
      const params = parseConstellationParams(text);
      
      if (!params) {
        console.error('❌ Failed to parse constellation parameters from response:', text);
        return res.status(200).json({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I apologize, but I couldn\'t parse the constellation details properly. Could you please provide the number of satellites, orbital planes, and altitudes again? Make sure the altitudes are between 160-2000 km.',
          createdAt: Date.now(),
        });
      }

      try {
        // Call the TravellingSpaceman API
        await createConstellation(params.numSatellites, params.numPlanes, params.altitude);
        
        // Return success message
        return res.status(200).json({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Perfect! I\'ve successfully created your constellation. Please review it in TSM (TravellingSpaceman).',
          createdAt: Date.now(),
        });
        
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        return res.status(200).json({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I encountered an error while creating the constellation. Please check your parameters and try again. Make sure you have:\n- 1-60 satellites\n- 1-10 orbital planes\n- Altitudes between 160-2000 km',
          createdAt: Date.now(),
        });
      }
    }

    // If no trigger keyword, return the normal LLM response
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
