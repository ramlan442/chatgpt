import OpenAi from "../src";

describe("continue chat", () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });

  test("without parentMessageId", async () => {
    let chat = await openai.chatCompletions("nama aku adalah ramlan");
    chat = await openai.chatCompletions("siapa nama aku");
    expect(chat.text?.toLowerCase().includes("ramlan")).toBe(false);
  }, 60_000);

  test("with parentMessageId", async () => {
    let chat = await openai.chatCompletions("nama aku adalah ramlan");
    chat = await openai.chatCompletions("siapa nama aku", {
      parentMessageId: chat.id,
    });
    expect(chat.text?.toLowerCase().includes("ramlan")).toBe(true);
  }, 60_000);
});
