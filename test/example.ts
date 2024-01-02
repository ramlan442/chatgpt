import OpenAi from "../dist";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });
  // const chatStream = await openai.chatCompletions("halo", {
  //   onMessage: (data) => console.log(data),
  // });
  const chat = await openai.chatCompletions("halo", {});
  console.log(chat);
})();
