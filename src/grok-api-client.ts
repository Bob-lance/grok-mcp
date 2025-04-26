import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * GrokApiClient - A client for interacting with the Grok AI API
 */
export class GrokApiClient {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1';
  
  /**
   * Constructor for the GrokApiClient
   * @param apiKey - The Grok AI API key
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    console.error('[Setup] Initializing Grok API client...');
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
      console.error(`[API] Request to ${config.url}`);
      return config;
    });
    
    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.error(`[API] Response from ${response.config.url} with status ${response.status}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`[Error] API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
          console.error(`[Error] Request URL: ${error.config.url}`);
          console.error(`[Error] Request headers: ${JSON.stringify(error.config.headers)}`);
          console.error(`[Error] Request data: ${JSON.stringify(error.config.data)}`);
        } else if (error.request) {
          console.error(`[Error] No response received: ${error.message}`);
        } else {
          console.error(`[Error] Request error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Make a request to the chat completions endpoint
   * @param messages - The messages to send to the API
   * @param options - Additional options for the request
   * @returns The API response
   */
  async createChatCompletion(messages: any[], options: any = {}): Promise<any> {
    try {
      console.error('[API] Creating chat completion...');
      
      const requestBody = {
        messages,
        model: options.model || 'grok-3-mini-beta',
        ...options
      };
      
      const response = await this.axiosInstance.post('/chat/completions', requestBody);
      return response.data;
    } catch (error) {
      console.error('[Error] Failed to create chat completion:', error);
      throw error;
    }
  }
  
  /**
   * Make a request to the chat completions endpoint with image input
   * @param messages - The messages to send to the API (including image content)
   * @param options - Additional options for the request
   * @returns The API response
   */
  async createImageUnderstanding(messages: any[], options: any = {}): Promise<any> {
    try {
      console.error('[API] Creating image understanding request...');
      
      const requestBody = {
        messages,
        model: options.model || 'grok-2-vision-latest',
        ...options
      };
      
      const response = await this.axiosInstance.post('/chat/completions', requestBody);
      return response.data;
    } catch (error) {
      console.error('[Error] Failed to create image understanding request:', error);
      throw error;
    }
  }
  
  /**
   * Make a request to the chat completions endpoint with function calling
   * @param messages - The messages to send to the API
   * @param tools - The tools to make available to the model
   * @param options - Additional options for the request
   * @returns The API response
   */
  async createFunctionCall(messages: any[], tools: any[], options: any = {}): Promise<any> {
    try {
      console.error('[API] Creating function call request...');
      
      const requestBody = {
        messages,
        model: options.model || 'grok-3-mini-beta',
        tools,
        tool_choice: options.tool_choice || 'auto',
        ...options
      };
      
      const response = await this.axiosInstance.post('/chat/completions', requestBody);
      return response.data;
    } catch (error) {
      console.error('[Error] Failed to create function call request:', error);
      throw error;
    }
  }
}
