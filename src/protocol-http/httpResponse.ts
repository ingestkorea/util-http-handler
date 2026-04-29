import { HeaderBag, HttpMessage, HttpResponse as IHttpResponse } from "../models/index.js";

type HttpResponseOptions = Partial<IHttpResponse>;

export class HttpResponse implements IHttpResponse {
  statusCode: number;
  headers: HeaderBag;
  body?: any;

  constructor(options: HttpResponseOptions) {
    this.statusCode = options.statusCode || -1;
    this.headers = options.headers || {};
    this.body = options.body;
  }

  isInstance(response: unknown): response is HttpResponse {
    if (!response) return false;
    const resp = response as any;
    return typeof resp.statusCode === "number" && typeof resp.headers === "object";
  }
}
