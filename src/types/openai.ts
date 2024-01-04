import type OpenAI from "openai";

export interface OpenAIType {
  chatCompletions: (
    text: string,
    opts?: {
      headers?: any;
      model?: OpenAI.Chat.ChatCompletionCreateParams["model"];
      endpoint?: string;
      tools?: Array<OpenAI.ChatCompletionTool>;
      onMessage?: (data: any) => void;
    },
  ) => Promise<ChatResponse>;
}

export interface FunctionOpenAI {
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [id: string]: {
          type: "number" | "string" | "boolean";
          description: string;
          enum?: string[];
        };
      };
      required: string[];
    };
    path: string;
  };
  type: "function";
}

export type ChatResponse = OpenAI.ChatCompletion & {
  text: string | null;
  tool_call?: OpenAI.ChatCompletionMessageToolCall;
};
