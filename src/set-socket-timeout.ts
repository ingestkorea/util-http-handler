import { ClientRequest } from "http";
import { IngestkoreaError } from '@ingestkorea/util-error-handler';

export const setSocketTimeout = (
  request: ClientRequest, reject: (err: IngestkoreaError) => void, timeoutInMs = 0
) => {
  request.setTimeout(timeoutInMs, () => {
    request.destroy();
    return reject(new IngestkoreaError({
      code: 504, type: 'Gateway Timeout',
      message: 'Request Timeout', description: `Connection timed out after ${timeoutInMs} ms`
    }));
  });
};