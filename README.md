# OPENAI API NODEJS

library to use api from openai in nodejs

## Installation

```bash

  npm i github:ramlan442/openai # latest from github

  # or

  npm i @ramlan442/openai # via npm
```

## Usage/Examples

for a complete example can check in test/example.ts

```typescript
import OpenAi from "@ramlan442/openai";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });

  let chat = await openai.chatCompletions("my name is ramlan");
  console.log(chat.text);

  chat = await openai.chatCompletions("what is my name", {
    parentMessageId: chat.id, // without passing this will make new conversation
  });
  console.log(chat.text);
  // end
})();
```

### stream mode

```typescript
import OpenAi from "@ramlan442/openai";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });

  let chat = await openai.chatCompletions("my name is ramlan",
    onMessage: (text) => {
      console.log(text)
    }
  );

  chat = await openai.chatCompletions("what is my name", {
    onMessage: (text) => {
      console.log(text)
    },
    parentMessageId: chat.id, // without passing this will make new conversation
  });
})();
```

### With Function Call

```typescript
(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });
  // function call
  // load all func file, for template you can see in section func template
  // locate should in same folder
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

  let chat = await openai.chatCompletions("may name is ramlan", {
    tools: tool_funcs,
  });
  console.log(chat.text);

  chat = await openai.chatCompletions("my birthday is 04 april 2000", {
    tools: tool_funcs,
    parentMessageId: chat.id, // without passing this will make new conversation
  });
  console.log(chat.text);

  chat = await openai.chatCompletions(
    "my name is ramlan and when my birthday?",
    {
      tools: tool_funcs,
      parentMessageId: chat.id, // without passing this will make new conversation
    },
  );
  console.log(chat.text);
})();
```

### Function Template

for a complete example can check in test/func

```typescript
import type { FunctionOpenAI } from "@ramlan442/openai/types";

// this main function
export const getUserBirth = ({ day }: any) => `tanggal ${day}`;

// this for information function
export default {
  function: {
    name: "getUserBirth", // <-- name should same with main function
    description: "get user birth",
    parameters: {
      type: "object",
      properties: {
        day: { type: "string", description: "day of birth user" },
      },
      required: ["day"],
    },
    path: __filename,
  },
  type: "function",
} as FunctionOpenAI;
```

### transcribe

```typescript
import OpenAi from "@ramlan442/openai";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });

  const transcribe = await openai.transcribe(
    // audio buffer
    fs.readFileSync(path.join(__dirname, "test.mp3")),
  );
  console.log(transcribe);
})();
```

## TODO

- [ ] Chat Completions
  - [x] Stream
  - [x] Function Call
  - [ ] Vision
  - [x] Split Text on Stream
  - [ ] Support Custom Domain, Body, etc..
  - [x] Previous Chat (continue conversation)
- [x] Transcribe (convert audio to text)
- [ ] text to speech

## Credits

- inspiration from [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)
