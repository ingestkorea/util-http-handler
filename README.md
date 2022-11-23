# @ingestkorea/util-http-handler

## Description
INGESTKOREA Util HTTP Handler for Node.js.

## Installing
```sh
npm install @ingestkorea/util-error-handler
npm install @ingestkorea/util-http-handler
```

## Getting Started

### Import
```ts
import { IngestkoreaError } from '@ingestkorea/util-error-handler';
import {
    NodeHttpHandler, HttpRequest, HttpResponse, collectBodyString
} from '@ingestkorea/util-http-handler';
```

### Usage

#### Create Node Http Handler
```ts
const httpHandler = new NodeHttpHandler({
    connectionTimeout: 3000,
    socketTimeout: 3000
});
```

#### Set Response Body Handler
```ts
const parseBody = async (contentType: string, streamBody: any): Promise<any> => {
    const isValid = /application\/json/gi.exec(contentType) ? true : false;
    if (!isValid) throw new IngestkoreaError({
        code: 400, type: 'Bad Request',
        message: 'Invalid Request', description: 'response content-type is not applicaion/json'
    });
    const data = await collectBodyString(streamBody);
    if (data.length) return JSON.parse(data);
    return {};
};

const parseErrorBody = async (contentType: string, streamBody: any): Promise<void> => {
    const isValid = /application\/json/gi.exec(contentType) ? true : false;
    if (!isValid) throw new IngestkoreaError({
        code: 400, type: 'Bad Request',
        message: 'Invalid Request', description: 'response content-type is not applicaion/json'
    });
    const data = await collectBodyString(streamBody);
    if (data.length) throw new IngestkoreaError({
        code: 400, type: 'Bad Request',
        message: 'Invalid Request', description: JSON.parse(data)
    });
    throw new IngestkoreaError({ code: 400, type: 'Bad Request', message: 'Invalid Request' });
};
```

#### Set Serialize, Deserialize command
```ts
const serialize_command_01 = async () => {
    return new HttpRequest({
        protocol: 'https:',
        method: 'GET',
        hostname: 'api.hello-world.com',
        path: '/userInfo',
        query: {
            id: '12345'
        },
    });
};

const deserialize_command_01 = async (output: HttpResponse): Promise<any> => {
    const { statusCode, headers, body } = output;
    if (statusCode >= 300) await parseErrorBody(headers['content-type'], body);
    let content = await parseBody(headers['content-type'], body);
    return content;
};
```

#### Async/await
```ts
(async () => {
    try {
        let request = await serialize_command_01();
        let { response } = await httpHandler.handle(request);
        let output = await deserialize_command_01(response);
        console.log(output)
    } catch (err) {
        if (err instanceof Error) console.log(err);
        if (err instanceof IngestkoreaError) console.log(err);
    };
})();
```