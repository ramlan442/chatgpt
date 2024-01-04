import FormData from "form-data";
import axios from "axios";
import { promptTokensEstimate } from "openai-chat-tokens";
import { randomUUID } from "crypto";
import type OpenAI from "openai";
import type { ChatResponse, FunctionOpenAI } from "./types";
import { ErrorMessage, buildMessage, fetchSSE } from "./utils";
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
    text: string | null,
    opts: {
      headers?: any;
      model?: OpenAI.Chat.ChatCompletionCreateParams["model"];
      endpoint?: string;
      parentMessageId?: string;
      chatMessageId?: string;
      tools?: Array<FunctionOpenAI>;
      onMessage?: (data: any) => void;
    } = {},
  ): Promise<ChatResponse> {
    const {
      headers,
      model,
      endpoint,
      onMessage,
      tools,
      chatMessageId,
      parentMessageId,
    } = opts;
    const chatUrl = endpoint || `${this.BASE_URL}/v1/chat/completions`;
    const useStream = !!onMessage;
    const { messages, saveMessage, id } = buildMessage(
      parentMessageId || randomUUID(),
      text
        ? [
            {
              role: "user",
              content: text,
            },
          ]
        : null,
      { systemMessage: this.SYSTEM_MESSAGE, msgId: chatMessageId },
    );

    this.PROMPT_TOKEN = promptTokensEstimate({ messages, tools });

    const MAX_TOKENS = Math.max(
      1,
      Math.min(
        this.PROMPT_TOKEN < this.MAX_TOKEN
          ? this.MAX_TOKEN - this.PROMPT_TOKEN
          : this.PROMPT_TOKEN - this.MAX_TOKEN,
        this.MAX_TOKEN,
      ),
    );

    const body: OpenAI.ChatCompletionCreateParams = {
      messages,
      model: model || this.CHATGPT_MODEL,
      max_tokens: MAX_TOKENS,
      tools: tools
        ? tools.map((v) => ({
            ...v,
            function: { ...v.function, path: undefined },
          }))
        : undefined,
      stream: useStream,
    };

    const chatMessageResponse = await new Promise<ChatResponse>(
      (resolve, reject) => {
        const response: ChatResponse = {} as any;

        if (useStream) {
          let prevIndex = 0;
          let nextIndex = 100;
          fetchSSE(chatUrl, {
            onMessage: (data) => {
              if (data === "[DONE]") {
                if (response.choices[0].message.content) {
                  onMessage(
                    response.choices[0].message.content.slice(
                      prevIndex,
                      nextIndex,
                    ),
                  );
                }
                resolve(response);
                return;
              }
              try {
                const res: OpenAI.ChatCompletionChunk = JSON.parse(data);
                response.id = id;
                if (res.created) response.created = res.created;
                if (res.model) response.model = res.model;

                if (res.choices?.length) {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  const { delta, finish_reason, index, logprobs } =
                    res.choices[0];
                  if (!response.choices) {
                    response.choices = [
                      {
                        message: {
                          content: "",
                          role: "assistant",
                        },
                        finish_reason: finish_reason as any,
                        index,
                        logprobs: logprobs as any,
                      },
                    ];
                  }
                  if (delta?.content) {
                    const { content } = delta;
                    response.choices[0].message.content += content;
                    const tt = response.choices[0].message.content!;
                    if (tt!.length > nextIndex) {
                      const textSlice = tt.slice(prevIndex, nextIndex);
                      prevIndex = nextIndex;
                      nextIndex += 100;
                      onMessage(textSlice);
                    }
                    // onMessage(tt);
                  }
                  if (delta.tool_calls) {
                    if (!response.choices[0].message.tool_calls) {
                      response.choices[0].message.tool_calls =
                        delta.tool_calls as any;
                    }

                    const rtol = response.choices[0].message.tool_calls;
                    let responseTool: OpenAI.ChatCompletionChunk.Choice.Delta.ToolCall =
                      rtol![rtol!.length - 1] as any;
                    const resTool = delta.tool_calls[0];

                    if (responseTool.index !== resTool.index) {
                      response.choices[0].message.tool_calls!.push(
                        resTool as any,
                      );
                      responseTool = rtol![rtol!.length - 1] as any;
                    }

                    responseTool.function!.arguments +=
                      resTool.function!.arguments!;
                  }
                  if (finish_reason)
                    response.choices[0].finish_reason = finish_reason;
                  if (index) response.choices[0].index = index;
                  if (logprobs) response.choices[0].logprobs = logprobs;
                }
              } catch (err) {
                console.warn("OpenAI stream SEE event unexpected error", err);
                reject(err);
              }
            },
            body: JSON.stringify(body),
            method: "POST",
            headers: headers || this.DEFAULT_HEADERS,
            onFinish: () => {
              response.id = id;
              resolve(response);
            },
            onError(error) {
              reject(error);
            },
          }).catch(reject);
        } else {
          fetch(chatUrl, {
            body: JSON.stringify(body),
            method: "POST",
            headers: headers || this.DEFAULT_HEADERS,
          }).then((res) => {
            if (!res.ok) {
              res
                .text()
                .then((reason) => {
                  const msg = `OpenAI error ${
                    res.status || res.statusText
                  }: ${reason}`;
                  const error = new ErrorMessage(msg);
                  error.statusCode = res.status;
                  error.statusText = res.statusText;
                  reject(error);
                })
                .catch(reject);
            }

            res
              .json()
              .then((v) => resolve(v))
              .catch((v) => reject(v));
          });
        }
      },
    );
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { content, role, tool_calls } =
      chatMessageResponse.choices[0].message;
    chatMessageResponse.id = id;
    chatMessageResponse.text = content;
    saveMessage({
      id: randomUUID(),
      role,
      content,
      tool_calls,
    });

    if (tool_calls) {
      // eslint-disable-next-line no-restricted-syntax
      for (const tool of tool_calls) {
        const {
          function: { arguments: arg, name },
          id: idTool,
        } = tool;
        const fn = tools?.find((v) => v.function.name === name);
        if (fn) {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const fnc = require(fn.function.path);

          saveMessage({
            tool_call_id: idTool,
            id: randomUUID(),
            role: "tool",
            // eslint-disable-next-line no-await-in-loop
            content: await fnc[fn.function.name](JSON.parse(arg)),
          });
        }
      }
      return this.chatCompletions(null, { ...opts, parentMessageId: id });
    }

    return chatMessageResponse;
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
