import FormData from "form-data";
import axios from "axios";
import { ErrorMessage, fetchSSE } from "./utils";
import "dotenv/config";

class OpenAi {
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
    }: {
      headers?: any;
      model?: string;
      endpoint?: string;
      onMessage?: (data: any) => void;
    } = {},
  ) {
    /**
     * //TODO
     * [chat] save previous chat
     * [token] calc token
     * [improve] chat stream
     */
    const chatUrl = endpoint || `${this.BASE_URL}/v1/chat/completions`;
    const useStream = !!onMessage;
    let response;
    const body = {
      max_tokens: 1000, // TODO ~token
      model: model || this.CHATGPT_MODEL,
      messages: [
        {
          role: "system",
          content: this.SYSTEM_MESSAGE,
        },
        {
          role: "user",
          content: text,
        },
      ],
      stream: useStream,
    };

    if (useStream) {
      fetchSSE(chatUrl, {
        onMessage: (d) => onMessage?.(d),
        body: JSON.stringify(body),
        method: "POST",
        headers: headers || this.DEFAULT_HEADERS,
      });
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
