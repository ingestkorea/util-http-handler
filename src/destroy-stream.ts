import { IncomingMessage } from "node:http";

export const destroyStream = async (streamBody: IncomingMessage): Promise<void> => {
  if (streamBody.destroyed) return;

  try {
    streamBody.resume();
    streamBody.destroy();
  } catch (err) {
    return;
  }
};
