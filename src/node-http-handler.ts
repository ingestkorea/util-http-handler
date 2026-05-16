import { Agent as hAgent, AgentOptions, request as hRequest } from "node:http";
import { Agent as hsAgent, request as hsRequest, RequestOptions } from "node:https";
import { HttpRequest, HttpResponse } from "./protocol-http/index.js";
import { buildQueryString } from "./querystring-http/index.js";
import { writeRequestBody } from "./write-request-body.js";
import { getTransformedHeaders } from "./get-transformed-headers.js";
import { setConnectionTimeout } from "./set-connection-timeout.js";
import { setSocketTimeout } from "./set-socket-timeout.js";
import { HttpHandlerError, HttpHandlerErrorCode, CODE_TIME_OUT, CODE_NETWORK_ERROR } from "./models/index.js";

export interface NodeHttpHandlerOptions {
  connectionTimeout?: number;
  socketTimeout?: number;
  keepAlive?: boolean;
  family?: 4 | 6;
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
const DEFAULT_MAX_SOCKETS = 50;

export class NodeHttpHandler {
  config: ResolvedNodeHttpHandlerConfig;

  constructor(options?: NodeHttpHandlerOptions) {
    const resolvedConnectionTimeout = options?.connectionTimeout || DEFAULT_CONNECTION_TIMEOUT;
    const resolvedSocketTimeout = options?.socketTimeout || DEFAULT_SOCKET_TIMEOUT;

    const agentOptions: AgentOptions = {
      keepAlive: options?.keepAlive ?? true,
      family: options?.family ?? 4,
      maxSockets: DEFAULT_MAX_SOCKETS,
      timeout: resolvedSocketTimeout + 2000,
    };

    this.config = {
      connectionTimeout: resolvedConnectionTimeout,
      socketTimeout: resolvedSocketTimeout,
      httpAgent: options?.httpAgent || new hAgent(agentOptions),
      httpsAgent: options?.httpsAgent || new hsAgent(agentOptions),
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
        if (err instanceof HttpHandlerError) {
          return safeReject(err);
        }

        if ("code" in err) {
          const error = new HttpHandlerError({
            code: convertErrorCode(err.code),
            message: err.message,
          });
          return safeReject(error);
        }

        return safeReject(err instanceof Error ? err : new Error(String(err)));
      });

      writeRequestBody(req, request);
    });
  }
}

const convertErrorCode = (code: unknown): HttpHandlerErrorCode => {
  if (typeof code !== "string") return "SDK.UNKNOWN_ERROR";

  if (CODE_TIME_OUT.includes(code)) return "SDK.TIMEOUT";
  if (CODE_NETWORK_ERROR.includes(code)) return "SDK.NETWORK_ERROR";

  return "SDK.UNKNOWN_ERROR";
};
