import { ClientRequest } from "node:http";

export const setSocketTimeout = (request: ClientRequest, safeReject: (err: Error) => void, timeoutInMs = 0): void => {
  if (!timeoutInMs) return;

  request.setTimeout(timeoutInMs, () => {
    safeReject(new Error(`[Gateway Timeout]: No data received/sent for ${timeoutInMs}ms`));
  });
};
