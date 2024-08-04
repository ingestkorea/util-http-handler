import { IncomingMessage } from "node:http";

export const destroyStream = async (streamBody: IncomingMessage): Promise<void> => {
  streamBody.destroy();
  return;
};
