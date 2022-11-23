import { HeaderBag, HttpMessage, HttpResponse as IHttpResponse } from "../types";

type HttpResponseOptions = Partial<HttpMessage> & {
    statusCode: number;
};

export interface HttpResponse extends IHttpResponse { }

export class HttpResponse {
    statusCode: number;
    headers: HeaderBag;
    body?: any;

    constructor(options: HttpResponseOptions) {
        this.statusCode = options.statusCode;
        this.headers = options.headers || {};
        this.body = options.body;
    };

    isInstance(response: unknown): response is HttpResponse {
        if (!response) return false;
        const resp = response as any;
        return typeof resp.statusCode === "number" && typeof resp.headers === "object";
    };
};