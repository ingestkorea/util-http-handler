import { ClientRequest } from "http";
import { Socket } from "net";
import { IngestkoreaError } from "@ingestkorea/util-error-handler";

export const setConnectionTimeout = (
  request: ClientRequest,
  reject: (err: IngestkoreaError) => void,
  timeoutInMs = 0
): void => {
  if (!timeoutInMs) return;
  request.on("socket", (socket: Socket) => {
    if (socket.connecting) {
      const timeoutId = setTimeout(() => {
        request.destroy();
        return reject(
          new IngestkoreaError({
            code: 504,
            type: "Gateway Timeout",
            message: "Request Timeout",
            description: `Socket timed out without establishing a connection within ${timeoutInMs} ms`,
          })
        );
      }, timeoutInMs);
      socket.on("connect", () => clearTimeout(timeoutId));
      socket.on("error", (err: Error) => {
        clearTimeout(timeoutId);
        request.destroy();
        return reject(
          new IngestkoreaError({
            code: 500,
            type: "Internal Server Error",
            message: "Something Broken",
            description: `Socket Connecting Error: ${err.message}`,
          })
        );
      });
    }
  });
};
