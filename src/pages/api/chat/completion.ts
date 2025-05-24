// pages/api/chat.ts

import { generateText, tool } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createOllama } from 'ollama-ai-provider';
import { z } from 'zod';

// Ollama setup
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Function to check if conversation is ready for tool usage
function checkIfReadyForTool(messages: any[]): boolean {
  if (!messages || messages.length === 0) return false;
  
  // Get the last few messages to analyze conversation state
  const recentMessages = messages.slice(-6).map(msg => msg.content?.toLowerCase() || '');
  const conversationText = recentMessages.join(' ');
  
  // Look for confirmation keywords that indicate user wants to proceed
  const confirmationWords = [
    'yes', 'generate', 'proceed', 'create', 'go ahead', 
    'make it', 'do it', 'start', 'confirm', 'build'
  ];
  
  // Look for constellation parameters being discussed
  const hasNumbers = /\d+/.test(conversationText);
  const mentionsSatellites = /satellite|sats/i.test(conversationText);
  const mentionsPlanes = /plane|orbital/i.test(conversationText);
  const mentionsAltitude = /altitude|km|height/i.test(conversationText);
  
  // Only provide tool if:
  // 1. Parameters seem to be discussed
  // 2. User has given some form of confirmation
  const hasParameters = hasNumbers && (mentionsSatellites || mentionsPlanes || mentionsAltitude);
  const hasConfirmation = confirmationWords.some(word => conversationText.includes(word));
  
  console.log('🔍 Tool availability check:', {
    hasParameters,
    hasConfirmation,
    shouldProvideTool: hasParameters && hasConfirmation
  });
  
  return hasParameters && hasConfirmation;
}

// Function to parse constellation parameters from LLM response
function parseConstellationParams(text: string) {
  console.log('🔍 Attempting to parse LLM response:', text);
  
  // Primary regex: "X satellites across Y orbital planes at altitude Z km"
  const primaryMatch = text.match(/(\d+)\s+satellites?\s+across\s+(\d+)\s+orbital\s+planes?\s+at\s+altitude\s+(\d+(?:\.\d+)?)\s+km/i);
  
  if (primaryMatch) {
    console.log('✅ Primary regex matched:', primaryMatch);
    const numSatellites = parseInt(primaryMatch[1]);
    const numPlanes = parseInt(primaryMatch[2]);
    const altitude = parseFloat(primaryMatch[3]);
    
    if (!isNaN(altitude)) {
      return { numSatellites, numPlanes, altitude };
    }
  }
  
  // Fallback regex: Look for any pattern with numbers and keywords
  const fallbackMatch = text.match(/(\d+)\s*(?:satellites?|sats?).*?(\d+)\s*(?:planes?|orbital).*?(\d+(?:\.\d+)?)\s*(?:km|altitude)/i);
  
  if (fallbackMatch) {
    console.log('✅ Fallback regex matched:', fallbackMatch);
    const numSatellites = parseInt(fallbackMatch[1]);
    const numPlanes = parseInt(fallbackMatch[2]);
    const altitude = parseFloat(fallbackMatch[3]);
    
    if (!isNaN(altitude)) {
      return { numSatellites, numPlanes, altitude };
    }
  }
  
  console.log('❌ No regex patterns matched');
  return null;
}

// Function to call TravellingSpaceman API
async function callTravellingSpacemanAPI(numSatellites: number, numPlanes: number, altitudesPerPlane: number) {
  console.log('🛰️ Constellation creation requested with parameters:');
  console.log('  - Number of satellites:', numSatellites);
  console.log('  - Number of planes:', numPlanes);
  console.log('  - Altitudes per plane:', altitudesPerPlane, 'km');
  
  console.log('📡 Sending request to TravellingSpaceman API...');
  const response = await fetch('https://www.travellingspaceman.com/api/constellation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      numSatellites: numSatellites < 1 ? 1 : numSatellites,
      numPlanes: numPlanes < 1 ? 1 : numPlanes,
      altitudesPerPlane: altitudesPerPlane
    }),
  });

  if (!response.ok) {
    console.error('❌ API request failed:', response.status, response.statusText);
    throw new Error(`Failed to create constellation: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('✅ Constellation successfully created:');
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

IMPORTANT: You must follow these steps in order and ONLY use the createConstellation tool when you have ALL required information.

**STEP 1: INTRODUCTION**
Greet the user and explain your role as an aerospace engineering teacher. You'll help design a satellite constellation to cover the globe. Mention the limits:
- Up to 60 satellites
- Up to 10 orbital planes  
- Altitude between 160 km and 2000 km

**STEP 2: COLLECT INFORMATION (DO NOT USE TOOLS YET)**
You must collect these three pieces of information before proceeding:

1. Number of Satellites: Ask how many satellites they want (1-60). Suggest 10-60 for global coverage.

2. Number of Orbital Planes: Explain orbital planes are like "rings" around Earth at different angles that help ensure global coverage. Ask how many planes they want (1-10). Suggest 5-10 for good coverage. Must be ≤ number of satellites.

3. Altitude: Explain satellites in LEO must orbit between 160-2000 km above Earth. Ask for one altitude that will be used for all orbital planes.

**STEP 3: VALIDATION**
Ensure all inputs meet requirements:
- Satellites: 1-60
- Planes: 1-10 and ≤ satellites  
- Altitude: 160-2000 km

**STEP 4: CONFIRMATION**
Summarize: "You want a constellation with X satellites across Y orbital planes at altitude Z km. Does that sound right?"
Ask: "Would you like to generate this constellation now?"

**STEP 5: TOOL USAGE (ONLY WHEN CONFIRMED)**
ONLY when the user confirms (says "yes", "generate", "proceed", etc.), then:
1. Use the createConstellation tool with the collected parameters
2. Pass the parameters as NUMBERS (not strings): numSatellites: 10, numPlanes: 5, altitudesPerPlane: 550
3. Include the exact confirmation text in the confirmationText parameter

CRITICAL: When using the tool, make sure to pass numbers as actual numbers, not as strings!

DO NOT use the createConstellation tool until you have completed steps 1-4 and received user confirmation.
`.trim();

    const prompt = `${systemPrompt}\n\n${messages.map((msg: any) =>
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;

    const model = ollama(process.env.OLLAMA_MODEL_NAME || "llama2");

    // Check if we should provide tools based on conversation state
    const shouldProvideTool = checkIfReadyForTool(messages);

    const generateOptions: any = {
      model,
      prompt,
      maxTokens: 512,
      maxSteps: 2,
    };

    // Only add tools if the conversation indicates we're ready
    if (shouldProvideTool) {
      generateOptions.tools = {
        createConstellation: tool({
          description: 'Create a new satellite constellation. Only use when you have all parameters (satellites, planes, altitude) and user has confirmed. Pass all numeric parameters as actual numbers, not strings.',
          parameters: z.object({
            numSatellites: z.union([z.number(), z.string().transform(val => parseInt(val))])
              .describe('Total number of satellites in the constellation as a NUMBER (1-60)'),
            numPlanes: z.union([z.number(), z.string().transform(val => parseInt(val))])
              .describe('Number of orbital planes as a NUMBER (1-10)'),
            altitudesPerPlane: z.union([z.number(), z.string().transform(val => parseFloat(val))])
              .describe('Altitude in km for all planes as a NUMBER (160-2000)'),
            confirmationText: z.string()
              .describe('The exact user confirmation that triggered this tool call'),
          }),
          execute: async ({ numSatellites, numPlanes, altitudesPerPlane, confirmationText }) => {
            console.log('🤖 Tool called with parameters:');
            console.log('  - Number of satellites:', numSatellites, typeof numSatellites);
            console.log('  - Number of planes:', numPlanes, typeof numPlanes);
            console.log('  - Altitudes per plane:', altitudesPerPlane, typeof altitudesPerPlane);
            console.log('  - Confirmation text:', confirmationText);
            
            // Convert to numbers if strings were passed (fallback)
            const satellites = typeof numSatellites === 'string' ? parseInt(numSatellites) : numSatellites;
            const planes = typeof numPlanes === 'string' ? parseInt(numPlanes) : numPlanes;
            const altitude = typeof altitudesPerPlane === 'string' ? parseFloat(altitudesPerPlane) : altitudesPerPlane;
            
            // Validate parameters are within acceptable ranges
            if (satellites < 1 || satellites > 60) {
              return 'Error: Number of satellites must be between 1 and 60. Please provide valid parameters.';
            }
            
            if (planes < 1 || planes > 10 || planes > satellites) {
              return 'Error: Number of planes must be between 1 and 10, and not exceed the number of satellites. Please provide valid parameters.';
            }
            
            if (altitude < 160 || altitude > 2000) {
              return 'Error: Altitude must be between 160 and 2000 km. Please provide valid parameters.';
            }

            try {
              await callTravellingSpacemanAPI(satellites, planes, altitude);
              return 'Perfect! I\'ve successfully created your constellation. Please review it in TSM (TravellingSpaceman).';
            } catch (error) {
              console.error('❌ API call failed:', error);
              return 'I encountered an error while creating the constellation. Please check your parameters and try again.';
            }
          },
        }),
      };
    }

    // Generate LLM response with conditional tool access
    const { text } = await generateText(generateOptions);

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
