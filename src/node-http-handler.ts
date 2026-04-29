import { Agent as hAgent, AgentOptions, request as hRequest } from "node:http";
import { Agent as hsAgent, request as hsRequest, RequestOptions } from "node:https";
import { HttpRequest, HttpResponse } from "./protocol-http/index.js";
import { buildQueryString } from "./querystring-http/index.js";
import { writeRequestBody } from "./write-request-body.js";
import { getTransformedHeaders } from "./get-transformed-headers.js";
import { setConnectionTimeout } from "./set-connection-timeout.js";
import { setSocketTimeout } from "./set-socket-timeout.js";

export interface NodeHttpHandlerOptions {
  connectionTimeout?: number;
  socketTimeout?: number;
  freeSocketTimeout?: number;
  httpAgent?: hAgent;
  httpsAgent?: hsAgent;
}

interface ResolvedNodeHttpHandlerConfig {
  connectionTimeout: number;
  socketTimeout: number;
  httpAgent: hAgent;
  httpsAgent: hsAgent;
}

const DEFAULT_CONNECTION_TIMEOUT = 5000;
const DEFAULT_SOCKET_TIMEOUT = 5000;
const DEFAULT_FREE_SOCKET_TIMEOUT = 3000;
const DEFAULT_MAX_SOCKETS = 50;

export class NodeHttpHandler {
  config: ResolvedNodeHttpHandlerConfig;

  constructor(options?: NodeHttpHandlerOptions) {
    const agentOptions: AgentOptions = {
      keepAlive: true,
      family: 4,
      maxSockets: DEFAULT_MAX_SOCKETS,
    };
    const httpAgent = options?.httpAgent || new hAgent(agentOptions);
    const httpsAgent = options?.httpsAgent || new hsAgent(agentOptions);
    (httpsAgent as any).freeSocketTimeout = options?.freeSocketTimeout || DEFAULT_FREE_SOCKET_TIMEOUT;

    this.config = {
      connectionTimeout: options?.connectionTimeout || DEFAULT_CONNECTION_TIMEOUT,
      socketTimeout: options?.socketTimeout || DEFAULT_SOCKET_TIMEOUT,
      httpAgent,
      httpsAgent,
    };
  }

  destroy(): void {
    this.config.httpAgent.destroy();
    this.config.httpsAgent.destroy();
  }

  async handle(request: HttpRequest): Promise<{ response: HttpResponse }> {
    return new Promise((resolve, reject) => {
      const isSSL = request.protocol === "https:";
      const queryString = buildQueryString(request.query);
      const nodeHttpsOptions: RequestOptions = {
        method: request.method,
        host: request.hostname,
        path: queryString ? `${request.path}?${queryString}` : request.path,
        headers: request.headers,
        agent: isSSL ? this.config.httpsAgent : this.config.httpAgent,
      };

      let isFinished = false;
      // 중복 호출 방지 래퍼
      const safeReject = (err: Error) => {
        if (isFinished) return;
        isFinished = true;
        req.destroy();
        reject(err);
      };

      const safeResolve = (response: HttpResponse) => {
        if (isFinished) return;
        isFinished = true;
        resolve({ response });
      };

      const requestFunc = isSSL ? hsRequest : hRequest;
      const req = requestFunc(nodeHttpsOptions, (res) => {
        const httpResponse = new HttpResponse({
          statusCode: res.statusCode,
          headers: getTransformedHeaders(res.headers),
          body: res,
        });
        safeResolve(httpResponse);
      });

      setConnectionTimeout(req, safeReject, this.config.connectionTimeout);
      setSocketTimeout(req, safeReject, this.config.socketTimeout);

      req.on("error", (err) => {
        safeReject(err);
      });

      writeRequestBody(req, request);
    });
  }
}
