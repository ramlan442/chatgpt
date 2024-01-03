import OpenAi from "../src";

describe("prediction total count", () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });

  test("normal text", async () => {
    const chat = await openai.chatCompletions("halo");
    expect(openai.PROMPT_TOKEN).toBeGreaterThanOrEqual(
      chat.usage?.prompt_tokens!,
    );
  });

  test("text question", async () => {
    const chat = await openai.chatCompletions(
      "bagaimana cara mengatasi kesepian?",
    );
    expect(openai.PROMPT_TOKEN).toBeGreaterThanOrEqual(
      chat.usage?.prompt_tokens!,
    );
  }, 60_000);

  test("with function", async () => {
    const chat = await openai.chatCompletions("nama aku adalah ramlan", {
      tools: [
        {
          function: {
            name: "getUserName",
            description: "get user name",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "name user" },
              },
            },
          },
          type: "function",
        },
      ],
    });
    console.log(chat.choices[0].message.tool_calls);
    expect(openai.PROMPT_TOKEN).toBeGreaterThanOrEqual(
      chat.usage?.prompt_tokens!,
    );
  });
});
