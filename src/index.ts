import FormData from "form-data";
import axios from "axios";
import { promptTokensEstimate } from "openai-chat-tokens";
import type OpenAI from "openai";
import { ErrorMessage, fetchSSE } from "./utils";
import "dotenv/config";

class OpenAi {
  PROMPT_TOKEN = 0;

  private MAX_TOKEN = 4000;

  private BASE_URL = "https://api.openai.com";

  private CHATGPT_MODEL = "gpt-3.5-turbo-1106";

  private SYSTEM_MESSAGE = "You are a helpful assistant.";

  private DEFAULT_HEADERS = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
  } as any;

  constructor({
    key,
    systemMessage,
  }: { key?: string; systemMessage?: string } = {}) {
    if (key) this.DEFAULT_HEADERS.authorization = `Bearer ${key}`;
    if (systemMessage) this.SYSTEM_MESSAGE = systemMessage;
  }

  async chatCompletions(
    text: string,
    {
      headers,
      model,
      endpoint,
      onMessage,
      tools,
    }: {
      headers?: any;
      model?: OpenAI.Chat.ChatCompletionCreateParams["model"];
      endpoint?: string;
      tools?: Array<OpenAI.ChatCompletionTool>;
      onMessage?: (data: any) => void;
    } = {},
  ): Promise<OpenAI.ChatCompletion> {
    const chatUrl = endpoint || `${this.BASE_URL}/v1/chat/completions`;
    const useStream = !!onMessage;
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: this.SYSTEM_MESSAGE,
      },
      {
        role: "user",
        content: text,
      },
    ];

    this.PROMPT_TOKEN = promptTokensEstimate({ messages, tools });

    const MAX_TOKENS = Math.max(
      1,
      Math.min(
        this.PROMPT_TOKEN < this.MAX_TOKEN
          ? this.MAX_TOKEN - this.PROMPT_TOKEN
          : 1000,
        this.MAX_TOKEN,
      ),
    );

    let response: OpenAI.ChatCompletion;
    const body: OpenAI.ChatCompletionCreateParams = {
      messages,
      model: model || this.CHATGPT_MODEL,
      max_tokens: MAX_TOKENS,
      tools,
      stream: useStream,
    };

    if (useStream) {
      await fetchSSE(chatUrl, {
        onMessage: (d) => onMessage?.(d),
        body: JSON.stringify(body),
        method: "POST",
        headers: headers || this.DEFAULT_HEADERS,
      });
      response = "" as any;
    } else {
      const res = await fetch(chatUrl, {
        body: JSON.stringify(body),
        method: "POST",
        headers: headers || this.DEFAULT_HEADERS,
      });

      if (!res.ok) {
        const reason = await res.text();
        const msg = `OpenAI error ${res.status || res.statusText}: ${reason}`;
        const error = new ErrorMessage(msg);
        error.statusCode = res.status;
        error.statusText = res.statusText;
        throw error;
      }

      response = await res.json();
    }

    return response;
  }

  async transcribe(
    file: Buffer,
    {
      lang,
      model,
      baseUrl,
      headers,
    }: {
      baseUrl?: string;
      headers?: any;
      lang?: string;
      model?: string;
    } = {},
  ) {
    const endpoint = baseUrl || `${this.BASE_URL}/v1/audio/transcriptions`;

    const formData = new FormData();
    formData.append("file", file, { filename: "audio.mp3" });
    formData.append("model", model || "whisper-1");
    formData.append("language", lang || "id");

    const res = await axios.post(endpoint, formData, {
      headers: headers || {
        ...this.DEFAULT_HEADERS,
        ...formData.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  }
}

export default OpenAi;
