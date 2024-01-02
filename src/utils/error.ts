// eslint-disable-next-line import/prefer-default-export
export class ErrorMessage extends Error {
  statusCode?: number;

  statusText?: string;

  isFinal?: boolean;

  accountId?: string;
}
