import { ClientRequest } from "node:http";
import { Socket } from "node:net";

export const setConnectionTimeout = (
  request: ClientRequest,
  safeReject: (err: Error) => void,
  timeoutInMs = 0
): void => {
  if (!timeoutInMs) return;

  request.on("socket", (socket: Socket) => {
    if (!socket.connecting) return;

    const timeoutId = setTimeout(() => {
      cleanup();
      safeReject(new Error(`[Gateway Timeout]: Failed to establish connection within ${timeoutInMs}ms`));
    }, timeoutInMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.off("connect", onConnect);
      socket.off("error", onError);
    };

    const onConnect = () => cleanup();
    const onError = (err: Error) => cleanup();

    socket.once("connect", onConnect);
    socket.once("error", onError);
  });
};
