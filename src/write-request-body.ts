import { ClientRequest } from "http";
import { Readable } from "stream";
import { HttpRequest } from './protocol-http';

export const writeRequestBody = (
  httpRequest: ClientRequest, request: HttpRequest
): void => {
  const expect = request.headers["Expect"] || request.headers["expect"];
  if (expect === "100-continue") httpRequest.on("continue", () => writeBody(httpRequest, request.body));
  else writeBody(httpRequest, request.body);
  return;
};

const writeBody = (
  httpRequest: ClientRequest, body?: string | ArrayBuffer | Readable | Uint8Array
): void => {
  if (!body) {
    httpRequest.end();
    return;
  };

  if (body instanceof Readable) body.pipe(httpRequest)// pipe automatically handles end
  else httpRequest.end(Buffer.from(body as Parameters<typeof Buffer.from>[0]));
  return;
};