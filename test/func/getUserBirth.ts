import type { FunctionOpenAI } from "../../src/types";

export const getUserBirth = ({ day }: any) => `tanggal ${day}`;

export default {
  function: {
    name: "getUserBirth",
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
