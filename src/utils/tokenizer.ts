import { getEncoding } from "js-tiktoken";

const tokenizer = getEncoding("cl100k_base");

// eslint-disable-next-line import/prefer-default-export
export function encode(input: string): Uint32Array {
  return new Uint32Array(tokenizer.encode(input));
}
