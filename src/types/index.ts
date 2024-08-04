export interface HttpRequest extends HttpMessage, Endpoint {
  method: string;
}

export interface HttpResponse extends HttpMessage {
  statusCode: number;
}

export interface ResolvedHttpResponse extends HttpResponse {
  body: string;
}

export interface HttpMessage {
  headers: HeaderBag;
  body?: any;
}

export type HeaderBag = Record<string, string>;

export interface Endpoint {
  protocol: string;
  hostname: string;
  path: string;
  query?: QueryParameterBag;
}

export type QueryParameterBag = Record<string, string | string[] | null>;
