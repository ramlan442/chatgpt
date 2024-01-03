import OpenAi from "../src";
import fs from "fs";
import path from "path";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });

  // const chatStream = await openai.chatCompletions("halo", {
  //   onMessage: (data) => console.log(data),
  // });

  const chat = await openai.chatCompletions("halo");
  console.log(chat);

  const transcribe = await openai.transcribe(
    fs.readFileSync(path.join(__dirname, "test.mp3")),
  );
  console.log(transcribe);
})();
