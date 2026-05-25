import { HttpRequest, HttpResponse } from "./protocol-http/index.js";
import { buildQueryString } from "./querystring-http/index.js";
import { convertNodeFetchErrorCode } from "./convert-http-error-code.js";
import { HeaderBag, HttpHandlerError } from "./models/index.js";

export interface NodeFetchHandlerOptions {
  requestTimeout?: number;
  keepAlive?: boolean;
}

interface ResolvedNodeFetchHandlerOptions {
  requestTimeout: number;
  keepAlive: boolean;
}

const DEFAULT_REQUEST_TIMEOUT = 5000;

export class NodeFetchHandler {
  private config: ResolvedNodeFetchHandlerOptions;

  constructor(options?: NodeFetchHandlerOptions) {
    this.config = {
      requestTimeout: options?.requestTimeout || DEFAULT_REQUEST_TIMEOUT,
      keepAlive: options?.keepAlive ?? true,
    };
  }

  async handle(request: HttpRequest): Promise<{ response: HttpResponse }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
    const body = this.serializeBody(request.body);
    try {
      const fullUrl = this.buildUrl(request);
      const headers = new Headers(request.headers);
      headers.set("connection", this.config.keepAlive ? "keep-alive" : "close");

      const response = await fetch(fullUrl, {
        signal: controller.signal,
        method: request.method,
        headers: headers,
        keepalive: false,
        redirect: "error",
        ...(body && { body }),
      });

      const httpResponse = new HttpResponse({
        statusCode: response.status,
        headers: this.getTransformedHeadersFromFetch(response.headers),
        body: response.body,
      });

      return { response: httpResponse };
    } catch (err: any) {
      if (err instanceof HttpHandlerError) {
        throw err;
      }

      if (err?.name === "AbortError" || err?.name === "TimeoutError") {
        throw new HttpHandlerError({
          code: "SDK.TIMEOUT",
          message: err.message || "Fetch request timed out",
        });
      }

      const errorCode = convertNodeFetchErrorCode(err);
      if (errorCode !== "SDK.UNKNOWN_ERROR") {
        throw new HttpHandlerError({
          code: errorCode,
          message: err?.cause?.message || err?.message || String(err),
        });
      }

      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(request: HttpRequest): string {
    const queryString = buildQueryString(request.query);
    const path = queryString ? `${request.path}?${queryString}` : request.path;
    return `${request.protocol}//${request.hostname}${path}`;
  }

  private serializeBody(body: any): BodyInit | null {
    if (!body) return null;
    if (body instanceof Uint8Array || typeof body === "string") return body;
    return body;
  }

  private getTransformedHeadersFromFetch = (headers: Headers): HeaderBag => {
    const init: HeaderBag = {};
    const transformedHeaders = Array.from(headers.keys())
      .sort()
      .reduce((acc, name) => {
        const headerValue = headers.get(name);
        if (headerValue !== null) {
          acc[name] = headerValue;
        }
        return acc;
      }, init);

    return transformedHeaders;
  };
}

export const collectFetchBodyString = async (streamBody: any): Promise<string> => {
  const data = await fetchStreamCollector(streamBody);
  return new TextDecoder().decode(data);
};

const fetchStreamCollector = async (stream: ReadableStream): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLength += value.length;
      }
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    if (result.length === 0) {
      await destroyFetchStream(stream);
    }
    return result;
  } catch (err: any) {
    await destroyFetchStream(stream);
    throw new Error(`[Fetch Stream Collection Failed]: ${err.message}`);
  }
};

export const destroyFetchStream = async (stream: ReadableStream | null): Promise<void> => {
  if (!stream) return;

  try {
    await stream.cancel();
  } catch (err) {
    return;
  }
};
