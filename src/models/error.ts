export type HttpHandlerErrorCode = "SDK.UNKNOWN_ERROR" | HttpHandlerRetryableErrorCode;
export type HttpHandlerRetryableErrorCode = "SDK.TIMEOUT" | "SDK.NETWORK_ERROR";

export class HttpHandlerError extends Error {
  public readonly code: HttpHandlerErrorCode;
  constructor(input: { code: HttpHandlerErrorCode; message: string }) {
    super(input.message);
    this.code = input.code;
    this.name = "HttpHandlerError";
  }
}
