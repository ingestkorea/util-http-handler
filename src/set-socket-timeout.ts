import { ClientRequest } from "node:http";
import { HttpHandlerError } from "./models/error.js";

export const setSocketTimeout = (request: ClientRequest, safeReject: (err: Error) => void, timeoutInMs = 0): void => {
  if (!timeoutInMs) return;

  request.setTimeout(timeoutInMs, () => {
    const error = new HttpHandlerError({
      code: "SDK.TIMEOUT",
      message: `[Gateway Timeout]: No data received/sent for ${timeoutInMs}ms`,
    });
    safeReject(error);
  });
};
