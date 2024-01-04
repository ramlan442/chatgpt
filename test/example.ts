import OpenAi from "../src";
import fs from "fs";
import path from "path";
import { FunctionOpenAI } from "../src/types";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });
  const funcsDir = path.join(__dirname, "func");
  const funcs = fs.readdirSync(funcsDir);
  const tool_funcs: FunctionOpenAI[] = [];
  if (funcs.length > 0) {
    funcs.forEach((v) => {
      const funcFile = path.join(funcsDir, v);
      const { default: func } = require(funcFile);
      tool_funcs.push(func);
    });
  }

  // const chatStream = await openai.chatCompletions("halo", {
  //   onMessage: (data) => console.log(data),
  // });

  let chat = await openai.chatCompletions("nama aku adalah ramlan", {
    tools: tool_funcs,
  });
  console.log(chat.text);

  chat = await openai.chatCompletions("tanggal lahirku 04 april 2000", {
    tools: tool_funcs,
    // continue contex chat
    parentMessageId: chat.id,
  });
  console.log(chat.text);

  chat = await openai.chatCompletions(
    "siapa namaku dan kapan tanggal lahirku?",
    {
      tools: tool_funcs,
      // continue contex chat
      parentMessageId: chat.id,
    },
  );
  console.log(chat.text);

  // chat = await openai.chatCompletions("siapa nama aku?");
  // console.log(chat.text);

  // const transcribe = await openai.transcribe(
  //   fs.readFileSync(path.join(__dirname, "test.mp3")),
  // );
  // console.log(transcribe);
})();
