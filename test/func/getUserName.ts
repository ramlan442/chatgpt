import type { FunctionOpenAI } from "../../src/types";

export const getUserName = ({ name }: any) => name;

export default {
  function: {
    name: "getUserName",
    description: "get user name",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "name user" },
      },
      required: ["name"],
    },
    path: __filename,
  },
  type: "function",
} as FunctionOpenAI;
