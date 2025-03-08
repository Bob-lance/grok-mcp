# Grok MCP Plugin

A Model Context Protocol (MCP) plugin that provides seamless access to Grok AI's powerful capabilities directly from Cline.

## Features

This plugin exposes three powerful tools through the MCP interface:

1. **Chat Completion** - Generate text responses using Grok's language models
2. **Image Understanding** - Analyze images with Grok's vision capabilities
3. **Function Calling** - Use Grok to call functions based on user input

## Prerequisites

- Node.js (v16 or higher)
- A Grok AI API key (obtain from [console.x.ai](https://console.x.ai/))
- Cline with MCP support

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/grok-mcp.git
   cd grok-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Add the MCP server to your Cline MCP settings:

   For VSCode Cline extension, edit the file at:
   ```
   ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   ```

   Add the following configuration:
   ```json
   {
     "mcpServers": {
       "grok-mcp": {
         "command": "node",
         "args": ["/path/to/grok-mcp/build/index.js"],
         "env": {
           "XAI_API_KEY": "your-grok-api-key"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

   Replace `/path/to/grok-mcp` with the actual path to your installation and `your-grok-api-key` with your Grok AI API key.

## Usage

Once installed and configured, the Grok MCP plugin provides three tools that can be used in Cline:

### Chat Completion

Generate text responses using Grok's language models:

```javascript
<use_mcp_tool>
<server_name>grok-mcp</server_name>
<tool_name>chat_completion</tool_name>
<arguments>
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, what can you tell me about Grok AI?"
    }
  ],
  "temperature": 0.7
}
</arguments>
</use_mcp_tool>
```

### Image Understanding

Analyze images with Grok's vision capabilities:

```javascript
<use_mcp_tool>
<server_name>grok-mcp</server_name>
<tool_name>image_understanding</tool_name>
<arguments>
{
  "image_url": "https://example.com/image.jpg",
  "prompt": "What is shown in this image?"
}
</arguments>
</use_mcp_tool>
```

You can also use base64-encoded images:

```javascript
<use_mcp_tool>
<server_name>grok-mcp</server_name>
<tool_name>image_understanding</tool_name>
<arguments>
{
  "base64_image": "base64-encoded-image-data",
  "prompt": "What is shown in this image?"
}
</arguments>
</use_mcp_tool>
```

### Function Calling

Use Grok to call functions based on user input:

```javascript
<use_mcp_tool>
<server_name>grok-mcp</server_name>
<tool_name>function_calling</tool_name>
<arguments>
{
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in San Francisco?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "The unit of temperature to use"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
</arguments>
</use_mcp_tool>
```

## API Reference

### Chat Completion

Generate a response using Grok AI chat completion.

**Parameters:**

- `messages` (required): Array of message objects with role and content
- `model` (optional): Grok model to use (defaults to grok-2-latest)
- `temperature` (optional): Sampling temperature (0-2, defaults to 1)
- `max_tokens` (optional): Maximum number of tokens to generate (defaults to 16384)

### Image Understanding

Analyze images using Grok AI vision capabilities.

**Parameters:**

- `prompt` (required): Text prompt to accompany the image
- `image_url` (optional): URL of the image to analyze
- `base64_image` (optional): Base64-encoded image data (without the data:image prefix)
- `model` (optional): Grok vision model to use (defaults to grok-2-vision-latest)

Note: Either `image_url` or `base64_image` must be provided.

### Function Calling

Use Grok AI to call functions based on user input.

**Parameters:**

- `messages` (required): Array of message objects with role and content
- `tools` (required): Array of tool objects with type, function name, description, and parameters
- `tool_choice` (optional): Tool choice mode (auto, required, none, defaults to auto)
- `model` (optional): Grok model to use (defaults to grok-2-latest)

## Development

### Project Structure

- `src/index.ts` - Main server implementation
- `src/grok-api-client.ts` - Grok API client implementation

### Building

```bash
npm run build
```

### Running

```bash
XAI_API_KEY="your-grok-api-key" node build/index.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Model Context Protocol](https://github.com/modelcontextprotocol/mcp)
- [Grok AI](https://x.ai/)
