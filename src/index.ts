import { ErrorMessage, fetchSSE } from "./utils";
import "dotenv/config";

class OpenAi {
  private BASE_URL = "https://api.openai.com";
  private PATH_URL_CHAT = "/v1/chat/completions";
  private CHATGPT_MODEL = "gpt-3.5-turbo-1106";
  private SYSTEM_MESSAGE = "You are a helpful assistant.";
  private DEFAULT_HEADERS = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
  } as any;

  constructor({ key }: { key?: string }) {
    if (key) {
      this.DEFAULT_HEADERS["authorization"] = "Bearer " + key;
    }
  }

  async chatCompletions(
    text: string,
    {
      headers,
      model,
      onMessage,
      systemMessage,
    }: {
      headers?: any;
      model?: string;
      systemMessage?: string;
      onMessage?: (data: any) => void;
    },
  ) {
    /**
     * //TODO
     * [chat] save previous chat
     * [token] calc token
     * [improve] chat stream
     */
    try {
      const chatUrl = `${this.BASE_URL}${this.PATH_URL_CHAT}`;
      const useStream = !!onMessage;
      let response;
      const body = {
        max_tokens: 1000, //TODO ~token
        model: model || this.CHATGPT_MODEL,
        messages: [
          {
            role: "system",
            content: systemMessage || this.SYSTEM_MESSAGE,
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

      return response as any;
    } catch (error) {
      return error;
    }
  }

  async transcribe() {
    //TODO convert audio to text
  }
}

export default OpenAi;
