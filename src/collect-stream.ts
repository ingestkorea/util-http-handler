import { Readable } from "node:stream";
import { IngestkoreaError } from "@ingestkorea/util-error-handler";

export const collectBodyString = async (streamBody: any): Promise<string> => {
  const data = await collectBody(streamBody);
  return data.toString();
};

export const collectBody = async (streamBody: any): Promise<Uint8Array> => {
  if (streamBody instanceof Uint8Array) return streamBody;
  return streamCollector(streamBody);
};

export const streamCollector = (stream: Readable): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    let chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", () => {
      chunks = [];
      return reject(
        new IngestkoreaError({
          code: 400,
          type: "Bad Request",
          message: "Invalid Request",
          description: "streamCollector error",
        })
      );
    });
  });
};
