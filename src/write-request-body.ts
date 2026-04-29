import { ClientRequest } from "node:http";
import { Readable, pipeline } from "node:stream";
import { HttpRequest } from "./protocol-http/index.js";

export const writeRequestBody = (httpRequest: ClientRequest, request: HttpRequest): void => {
  const expect = request.headers["Expect"] || request.headers["expect"];

  if (expect === "100-continue") {
    httpRequest.on("continue", () => writeBody(httpRequest, request.body));
  } else {
    writeBody(httpRequest, request.body);
  }
  return;
};

const writeBody = (httpRequest: ClientRequest, body?: string | ArrayBuffer | Readable | Uint8Array): void => {
  if (!body) {
    httpRequest.end();
    return;
  }

  if (body instanceof Readable) {
    pipeline(body, httpRequest, (err) => {
      if (err) {
        body.destroy();
        httpRequest.destroy(err);
      }
    });
    return;
  } else {
    const buffer = Buffer.isBuffer(body)
      ? body
      : body instanceof Uint8Array
      ? Buffer.from(body.buffer, body.byteOffset, body.byteLength)
      : Buffer.from(body as any);

    httpRequest.end(buffer);
  }
  return;
};
