// pages/api/chat.ts

import { generateText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createOllama } from 'ollama-ai-provider';
import { z } from 'zod';

// Ollama setup
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Zod schema for validation
const createConstellationSchema = z.object({
  numSatellites: z.number(),
  numPlanes: z.number(),
  altitudesPerPlane: z.array(z.number()),
});

// OpenAPI-style schema for tool registration
const createConstellationToolParams = {
  type: "object",
  properties: {
    numSatellites: {
      type: "number",
      description: "Total number of satellites in the constellation",
    },
    numPlanes: {
      type: "number",
      description: "Number of orbital planes",
    },
    altitudesPerPlane: {
      type: "array",
      items: { type: "number" },
      description: "Array of altitudes for each plane in kilometers",
    },
  },
  required: ["numSatellites", "numPlanes", "altitudesPerPlane"],
};

type ToolCall = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: any;
};

type ToolResult = {
  name: string;
  result?: any;
  error?: string;
};

type ToolDefinition = {
  description: string;
  parameters: z.ZodType<any>;
  handler: (params: any) => Promise<any>;
};

// Tool handler setup
const tools: Record<string, ToolDefinition> = {
  createConstellation: {
    description: "Create a constellation of satellites with specified parameters",
    parameters: createConstellationSchema,
    handler: async (params: z.infer<typeof createConstellationSchema>) => {
      const response = await fetch('http://localhost:3001/api/constellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.json();
    },
  },
};

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

    // Tool config passed to generateText
    const toolSet = {
      createConstellation: {
        description: tools.createConstellation.description,
        parameters: createConstellationToolParams,
      },
    };

    const { text, toolCalls } = await generateText({
      model,
      prompt,
      maxTokens: 512,
      tools: toolSet,
    });

    if (toolCalls && toolCalls.length > 0) {
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall: ToolCall): Promise<ToolResult> => {
          const tool = tools[toolCall.toolName];
          if (!tool) {
            return {
              name: toolCall.toolName,
              error: 'Tool not found',
            };
          }

          const parsed = tool.parameters.safeParse(toolCall.args);
          if (!parsed.success) {
            return {
              name: toolCall.toolName,
              error: `Invalid parameters: ${parsed.error.message}`,
            };
          }

          try {
            const result = await tool.handler(parsed.data);
            return { name: toolCall.toolName, result };
          } catch (err) {
            console.error(`Error executing ${toolCall.toolName}:`, err);
            return {
              name: toolCall.toolName,
              error: 'Tool execution failed',
            };
          }
        })
      );

      return res.status(200).json({
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        toolResults,
        createdAt: Date.now(),
      });
    }

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
