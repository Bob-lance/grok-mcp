#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { GrokApiClient } from './grok-api-client.js';

// Get API key from environment variable
const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  throw new Error('[Error] XAI_API_KEY environment variable is required');
}

/**
 * GrokMcpServer - MCP server for Grok AI API integration
 */
class GrokMcpServer {
  private server: Server;
  private grokClient: GrokApiClient;

  constructor() {
    console.error('[Setup] Initializing Grok MCP server...');
    
    this.server = new Server(
      {
        name: 'grok-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Grok API client
    this.grokClient = new GrokApiClient(API_KEY as string);

    // Set up tool handlers
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up the MCP tool handlers
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'chat_completion',
          description: 'Generate a response using Grok AI chat completion',
          inputSchema: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                description: 'Array of message objects with role and content',
                items: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      description: 'Role of the message sender (system, user, assistant)',
                      enum: ['system', 'user', 'assistant']
                    },
                    content: {
                      type: 'string',
                      description: 'Content of the message'
                    }
                  },
                  required: ['role', 'content']
                }
              },
              model: {
                type: 'string',
                description: 'Grok model to use (e.g., grok-2-latest, grok-3, grok-3-reasoner, grok-3-deepsearch, grok-3-mini-beta)',
                default: 'grok-3-mini-beta'
              },
              temperature: {
                type: 'number',
                description: 'Sampling temperature (0-2)',
                minimum: 0,
                maximum: 2,
                default: 1
              },
              max_tokens: {
                type: 'integer',
                description: 'Maximum number of tokens to generate',
                default: 16384
              }
            },
            required: ['messages']
          }
        },
        {
          name: 'image_understanding',
          description: 'Analyze images using Grok AI vision capabilities (Note: Grok 3 may support image creation)',
          inputSchema: {
            type: 'object',
            properties: {
              image_url: {
                type: 'string',
                description: 'URL of the image to analyze'
              },
              base64_image: {
                type: 'string',
                description: 'Base64-encoded image data (without the data:image prefix)'
              },
              prompt: {
                type: 'string',
                description: 'Text prompt to accompany the image'
              },
              model: {
                type: 'string',
                description: 'Grok vision model to use (e.g., grok-2-vision-latest, potentially grok-3 variants)',
                default: 'grok-2-vision-latest'
              }
            },
            required: ['prompt']
          }
        },
        {
          name: 'function_calling',
          description: 'Use Grok AI to call functions based on user input',
          inputSchema: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                description: 'Array of message objects with role and content',
                items: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      description: 'Role of the message sender (system, user, assistant, tool)',
                      enum: ['system', 'user', 'assistant', 'tool']
                    },
                    content: {
                      type: 'string',
                      description: 'Content of the message'
                    },
                    tool_call_id: {
                      type: 'string',
                      description: 'ID of the tool call (for tool messages)'
                    }
                  },
                  required: ['role', 'content']
                }
              },
              tools: {
                type: 'array',
                description: 'Array of tool objects with type, function name, description, and parameters',
                items: {
                  type: 'object'
                }
              },
              tool_choice: {
                type: 'string',
                description: 'Tool choice mode (auto, required, none)',
                enum: ['auto', 'required', 'none'],
                default: 'auto'
              },
              model: {
                type: 'string',
                description: 'Grok model to use (e.g., grok-2-latest, grok-3, grok-3-reasoner, grok-3-deepsearch, grok-3-mini-beta)',
                default: 'grok-3-mini-beta'
              }
            },
            required: ['messages', 'tools']
          }
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'chat_completion':
            return await this.handleChatCompletion(request.params.arguments);
          case 'image_understanding':
            return await this.handleImageUnderstanding(request.params.arguments);
          case 'function_calling':
            return await this.handleFunctionCalling(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error: any) {
        console.error(`[Error] Tool call error: ${error.message}`);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle chat completion tool calls
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async handleChatCompletion(args: any) {
    console.error('[Tool] Handling chat_completion tool call');
    
    const { messages, model, temperature, max_tokens, ...otherOptions } = args;
    
    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }
    
    // Create options object
    const options = {
      model: model || 'grok-2-latest',
      temperature: temperature !== undefined ? temperature : 1,
      max_tokens: max_tokens !== undefined ? max_tokens : 16384,
      ...otherOptions
    };
    
    // Call Grok API
    const response = await this.grokClient.createChatCompletion(messages, options);
    
    return {
      content: [
        {
          type: 'text',
          text: response.choices[0].message.content,
        },
      ],
    };
  }

  /**
   * Handle image understanding tool calls
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async handleImageUnderstanding(args: any) {
    console.error('[Tool] Handling image_understanding tool call');
    
    const { image_url, base64_image, prompt, model, ...otherOptions } = args;
    
    // Validate inputs
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    if (!image_url && !base64_image) {
      throw new Error('Either image_url or base64_image is required');
    }
    
    // Prepare message content
    const content: any[] = [];
    
    // Add image
    if (image_url) {
      content.push({
        type: 'image_url',
        image_url: {
          url: image_url,
          detail: 'high',
        },
      });
    } else if (base64_image) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64_image}`,
          detail: 'high',
        },
      });
    }
    
    // Add text prompt
    content.push({
      type: 'text',
      text: prompt,
    });
    
    // Create messages array
    const messages = [
      {
        role: 'user',
        content,
      },
    ];
    
    // Create options object
    const options = {
      model: model || 'grok-2-vision-latest',
      ...otherOptions
    };
    
    // Call Grok API
    const response = await this.grokClient.createImageUnderstanding(messages, options);
    
    return {
      content: [
        {
          type: 'text',
          text: response.choices[0].message.content,
        },
      ],
    };
  }

  /**
   * Handle function calling tool calls
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async handleFunctionCalling(args: any) {
    console.error('[Tool] Handling function_calling tool call');
    
    const { messages, tools, tool_choice, model, ...otherOptions } = args;
    
    // Validate inputs
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }
    
    if (!Array.isArray(tools) || tools.length === 0) {
      throw new Error('Tools must be a non-empty array');
    }
    
    // Create options object
    const options = {
      model: model || 'grok-2-latest',
      tool_choice: tool_choice || 'auto',
      ...otherOptions
    };
    
    // Call Grok API
    const response = await this.grokClient.createFunctionCall(messages, tools, options);
    
    // Check if there are tool calls in the response
    if (response.choices[0].message.tool_calls) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: response.choices[0].message,
              usage: response.usage
            }, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: response.choices[0].message.content,
          },
        ],
      };
    }
  }

  /**
   * Run the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect