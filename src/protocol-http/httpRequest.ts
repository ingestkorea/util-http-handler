import { Endpoint, HeaderBag, HttpMessage, HttpRequest as IHttpRequest, QueryParameterBag } from "../types";

type HttpRequestOptions = Partial<HttpMessage> & Partial<Endpoint> & { method?: string };

export interface HttpRequest extends IHttpRequest {}

export class HttpRequest implements HttpMessage, Endpoint {
  method: string;
  protocol: string;
  hostname: string;
  path: string;
  query: QueryParameterBag;
  headers: HeaderBag;
  body?: any;

  constructor(options: HttpRequestOptions) {
    this.method = options.method || "GET";
    this.protocol = options.protocol || "https:";
    this.hostname = options.hostname || "localhost";
    this.path = options.path
      ? "/" +
        options.path
          .split("/")
          .filter((d) => !!d)
          .join("/")
      : "/";
    this.query = options.query || {};
    this.headers = options.headers || {};
    this.body = options.body;
  }

  isInstance(request: unknown): request is HttpRequest {
    if (!request) return false;
    const req: any = request;
    return (
      "method" in req &&
      "protocol" in req &&
      "hostname" in req &&
      "path" in req &&
      typeof req["query"] === "object" &&
      typeof req["headers"] === "object"
    );
  }
}
