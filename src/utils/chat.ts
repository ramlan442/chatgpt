import type OpenAI from "openai";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { cache } from "./utils";

// eslint-disable-next-line import/prefer-default-export
type MessageWithId = OpenAI.Chat.ChatCompletionMessageParam & { id: string };
// eslint-disable-next-line import/prefer-default-export
export const buildMessage = (
  id: string,
  message: OpenAI.Chat.ChatCompletionMessageParam[] | null,
  { msgId, systemMessage }: { msgId?: string; systemMessage?: string } = {},
) => {
  let msg: MessageWithId[] = [];

  const folderName = "messages";
  const fileName = path.join(folderName, `${id}.json`);
  if (!fs.existsSync(folderName)) fs.mkdirSync(folderName);

  if (!cache.has(id)) {
    if (fs.existsSync(fileName))
      msg = JSON.parse(fs.readFileSync(fileName, "utf-8"));
    msg.push({ content: systemMessage!, role: "system", id: "system" });
    cache.set(id, msg);
  }

  msg = cache.get<MessageWithId[]>(id)!;

  if (message) {
    msg.push(...message.map((v) => ({ ...v, id: randomUUID() })));

    fs.writeFileSync(fileName, JSON.stringify(msg, null, 2), "utf-8");

    if (msgId) {
      const index = msg.findIndex((v) => v.id === msgId);
      if (index) {
        msg = msg.slice(1, index + 1);
      }
    }
  }

  return {
    id,
    messages: msg.map((v) => ({ ...v, id: undefined })),
    saveMessage: (newMessage: MessageWithId) => {
      msg?.push(newMessage);
      fs.writeFileSync(fileName, JSON.stringify(msg, null, 2), "utf-8");
    },
  };
};
