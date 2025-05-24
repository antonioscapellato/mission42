// AI SDK
import { generateText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';

// Ollama
import { createOllama } from 'ollama-ai-provider';
const ollama = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL
});

type ToolCall = {
  type: "tool-call";
  toolCallId: string;
  toolName: "createConstellation";
  args: {
    numSatellites: number;
    numPlanes: number;
    altitudesPerPlane: number[];
  };
};

// Tool definitions
const tools = {
  createConstellation: {
    description: "Create a constellation of satellites with specified parameters",
    parameters: {
      type: "object",
      properties: {
        numSatellites: {
          type: "number",
          description: "Total number of satellites in the constellation"
        },
        numPlanes: {
          type: "number",
          description: "Number of orbital planes"
        },
        altitudesPerPlane: {
          type: "array",
          items: {
            type: "number"
          },
          description: "Array of altitudes for each plane in kilometers"
        }
      },
      required: ["numSatellites", "numPlanes", "altitudesPerPlane"]
    },
    handler: async (params: {
      numSatellites: number;
      numPlanes: number;
      altitudesPerPlane: number[];
    }) => {
      const response = await fetch('http://localhost:3001/api/constellation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return response.json();
    }
  }
};

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
    
    // Add system prompt
    const systemPrompt = "You are Mission42, an AI agent specialized in helping users set up and manage satellite constellations. You can assist with constellation design, orbital parameters, and provide expert guidance on satellite deployment and management.";
    
    // Convert messages array into a prompt string, including system prompt
    const prompt = `${systemPrompt}\n\n${messages.map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;

    console.log('Generated prompt:', prompt.substring(0, 100) + '...');

    console.log('Generating response with Ollama...');

    const { text, toolCalls } = await generateText({
      model: ollama(process.env.OLLAMA_MODEL_NAME || "llama2"),
      prompt: prompt,
      maxTokens: 512,
      tools: tools,
    });

    console.log('Response: ', text);
    console.log('Tool calls: ', toolCalls);

    // Handle tool calls if any
    if (toolCalls && toolCalls.length > 0) {
      console.log(`Processing ${toolCalls.length} tool calls...`);
      
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall: ToolCall) => {
          console.log(`Processing tool call: ${toolCall.toolName}`, {
            toolCallId: toolCall.toolCallId,
            args: toolCall.args
          });

          const tool = tools[toolCall.toolName];
          if (tool && 'handler' in tool) {
            console.log(`Executing handler for ${toolCall.toolName}...`);
            try {
              const result = await tool.handler(toolCall.args);
              console.log(`Tool call ${toolCall.toolName} completed successfully:`, result);
              return {
                name: toolCall.toolName,
                result
              };
            } catch (error) {
              console.error(`Error executing tool ${toolCall.toolName}:`, error);
              return {
                name: toolCall.toolName,
                error: 'Tool execution failed'
              };
            }
          }
          console.warn(`No handler found for tool: ${toolCall.toolName}`);
          return null;
        })
      );

      console.log('All tool calls processed. Results:', toolResults);

      // Send response with tool results
      return res.status(200).json({
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        toolResults,
        createdAt: Date.now()
      });
    }

    // Send regular response if no tool calls
    return res.status(200).json({
      id: Date.now().toString(),
      role: 'assistant',
      content: text,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('❌ Error processing chat completion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}