# OPENAI API NODEJS

library to use api from openai in nodejs

## Installation

```bash
  npm i @ramlan442/openai
```

## Usage/Examples

for a complete example can check in test/example.ts

```javascript
import OpenAi from "@ramlan442/openai";

(async () => {
  const openai = new OpenAi({ key: process.env.OPENAI_KEY });
  // const chatStream = await openai.chatCompletions("halo", {
  //   onMessage: (data) => console.log(data),
  // });
  const chat = await openai.chatCompletions("halo", {});
  console.log(chat);
})();
```

## TODO

- [ ] Chat Completions
  - [x] Stream
  - [ ] Function Call
  - [ ] Split Text on Stream
  - [ ] Previous Chat (continue conversation)
- [ ] Transcribe (convert audio to text)

## Credits

- inspiration from [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)
