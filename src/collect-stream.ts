import { Readable } from "node:stream";
import { destroyStream } from "./destroy-stream.js";

export const collectBodyString = async (streamBody: any): Promise<string> => {
  const data = await collectBody(streamBody);
  return data.toString();
};

const collectBody = async (streamBody: any): Promise<Uint8Array> => {
  if (streamBody instanceof Uint8Array) {
    return streamBody;
  }

  return streamCollector(streamBody);
};

const streamCollector = (stream: Readable): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    let chunks: Buffer[] = [];

    stream.on("data", (chunk) => chunks.push(chunk));

    stream.on("end", async () => {
      const result = Buffer.concat(chunks);
      if (result.length === 0) {
        await destroyStream(stream as any);
      }
      resolve(result);
    });

    stream.on("error", async (err) => {
      chunks = [];
      await destroyStream(stream as any);
      reject(new Error(`[Stream Collection Failed]: ${err.message}`));
    });
  });
};
