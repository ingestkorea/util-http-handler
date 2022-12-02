import { Agent as hAgent, request as hRequest } from "node:http";
import { Agent as hsAgent, request as hsRequest, RequestOptions } from "node:https";
import { IngestkoreaError } from '@ingestkorea/util-error-handler';
import { HttpRequest, HttpResponse } from './protocol-http';

import { getTransformedHeaders } from './get-transformed-headers';
import { setConnectionTimeout } from './set-connection-timeout';
import { setSocketTimeout } from './set-socket-timeout';

export interface NodeHttpHandlerOptions {
  connectionTimeout?: number;
  socketTimeout?: number;
  httpAgent?: hAgent;
  httpsAgent?: hsAgent;
};

interface ResolvedNodeHttpHandlerConfig {
  connectionTimeout: number;
  socketTimeout: number;
  httpAgent: hAgent;
  httpsAgent: hsAgent;
};

export class NodeHttpHandler {
  config?: ResolvedNodeHttpHandlerConfig;

  constructor(options?: NodeHttpHandlerOptions) {
    const { connectionTimeout, socketTimeout, httpAgent, httpsAgent } = options || {};
    const keepAlive = true;
    const maxSockets = 50;
    this.config = {
      connectionTimeout: connectionTimeout || 5000,
      socketTimeout: socketTimeout || 5000,
      httpAgent: httpAgent || new hAgent({ keepAlive, maxSockets }),
      httpsAgent: httpsAgent || new hsAgent({ keepAlive, maxSockets }),
    };
  };

  destroy(): void {
    this.config?.httpAgent?.destroy();
    this.config?.httpsAgent?.destroy();
  }

  async handle(request: HttpRequest): Promise<{ response: HttpResponse }> {
    return new Promise((resolve, reject) => {
      if (!this.config) throw new Error("Node HTTP request handler config is not resolved");

      const isSSL = request.protocol === "https:";
      const queryString = new URLSearchParams(request.query).toString();
      const nodeHttpsOptions: RequestOptions = {
        method: request.method,
        host: request.hostname,
        path: queryString ? `${request.path}?${queryString}` : request.path,
        headers: request.headers,
        agent: isSSL ? this.config.httpsAgent : this.config.httpAgent,
      };

      const requestFunc = isSSL ? hsRequest : hRequest;
      const req = requestFunc(nodeHttpsOptions, (res) => {
        const httpResponse = new HttpResponse({
          statusCode: res.statusCode || -1,
          headers: getTransformedHeaders(res.headers),
          body: res,
        });
        resolve({ response: httpResponse });
      });
      setConnectionTimeout(req, reject, this.config.connectionTimeout);
      setSocketTimeout(req, reject, this.config.socketTimeout);

      req.on("error", (err: Error) => {
        req.destroy();
        return reject(new IngestkoreaError({
          code: 400, type: 'Bad Request',
          message: 'Invalid Request', description: `${err.name}: ${err.message}`
        }));
      });
      req.end(request.body);
    });
  };
};