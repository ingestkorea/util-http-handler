export interface HttpRequest extends Endpoint, HttpMessage {
  method: string;
}

export interface HttpResponse extends HttpMessage {
  statusCode: number;
}

export interface ResolvedHttpResponse extends HttpResponse {
  body: string;
}

export interface Endpoint {
  protocol: string;
  hostname: string;
  path: string;
  query?: QueryParameterBag;
}

export interface HttpMessage {
  headers: HeaderBag;
  body?: any;
}

export type QueryParameterBag = Record<string, string | string[] | null>;

export type HeaderBag = Record<string, string>;
