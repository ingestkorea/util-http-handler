# @ingestkorea/util-http-handler

[![npm (scoped)](https://img.shields.io/npm/v/@ingestkorea/util-http-handler?style=flat-square)](https://www.npmjs.com/package/@ingestkorea/util-http-handler)
[![npm downloads](https://img.shields.io/npm/dm/@ingestkorea/util-http-handler?style=flat-square)](https://www.npmjs.com/package/@ingestkorea/util-http-handler)

> An internal package

> You probably shouldn't, at least directly.

## Description

Node.js 환경을 위한 가벼운 HTTP 핸들러 유틸리티입니다. AWS Lambda 및 일반 서버 환경에 최적화되어 있습니다.

## Features

- **Keep-Alive 지원**: 소켓을 재사용하여 연속적인 요청의 응답 속도를 향상시킵니다.
- **좀비 소켓 방지**: `freeSocketTimeout` 옵션을 통해 람다 환경의 간헐적인 연결 끊김(ECONNRESET) 이슈를 해결합니다.
- **이중 타임아웃 시스템**: 연결 타임아웃(connectionTimeout)과 소켓 타임아웃(socketTimeout)을 분리하여 제어합니다.
- **리소스 자동 정리**: 요청 성공, 실패, 데이터 파싱 에러 시에도 스트림이 항상 닫히도록 제어합니다.

## Installing

```sh
npm install @ingestkorea/util-http-handler
```

## Getting Started

### Pre-requisites

- TypeScript v5 이상
- Node v22 이상

```sh
# save dev mode
npm install -D typescript
npm install -D @types/node
```

## Usage

### HTTP 핸들러 생성

실행 환경에 맞춰 freeSocketTimeout을 조정하면 좀비 소켓(ECONNRESET) 에러를 효과적으로 방지할 수 있습니다.

```ts
import { NodeHttpHandler } from "@ingestkorea/util-http-handler";

// 1. AWS Lambda 환경 (안정성 우선)
const lambdaHandler = new NodeHttpHandler({
  connectionTimeout: 2000,
  socketTimeout: 3000,
  freeSocketTimeout: 1000, // 서버가 연결을 끊기 전에 클라이언트가 먼저 정리
});

// 2. 일반 Node.js 서버 환경 (성능 우선)
const serverHandler = new NodeHttpHandler({
  connectionTimeout: 3000,
  socketTimeout: 5000,
  freeSocketTimeout: 15000, // 소켓 재사용률 높여서 응답 지연 시간 단축
});
```

### 응답 바디 처리

`collectBodyString`과 `destroyStream`을 조합하여 메모리 누수 없이 안전하게 데이터를 처리합니다.

```ts
// helper.ts
import { HttpResponse, collectBodyString, destroyStream } from "@ingestkorea/util-http-handler";

const isJsonResponse = (contentType?: string): boolean => {
  return contentType?.toLowerCase().includes("application/json") ?? false;
};

const parseBody = async (output: HttpResponse): Promise<any> => {
  const { headers, body: streamBody } = output;

  // 1. JSON 응답인지 확인
  if (!isJsonResponse(headers["content-type"])) {
    await destroyStream(streamBody); // JSON이 아니면 즉시 스트림 파괴 및 리소스 정리
    throw new Error("Invalid Content-Type");
  }

  try {
    // 2. 데이터 수집 (완료 시 내부적으로 destroyStream 호출됨)
    const data = await collectBodyString(streamBody);
    return data.length ? JSON.parse(data) : {};
  } catch (err) {
    await destroyStream(streamBody); // 파싱 에러 발생 시 스트림 파괴 및 리소스 정리
    throw new Error("JSON Parsing Error");
  }
};

const parseErrorBody = async (output: HttpResponse): Promise<never> => {
  ...
}
```

### 요청 실행

```ts
import { HttpRequest } from "@ingestkorea/util-http-handler";
import { parseBody, parseErrorBody } from "./helper.js";

(async () => {
  try {
    const request = new HttpRequest({
      protocol: "https:",
      method: "GET",
      hostname: "api.example.com",
      path: "/v1/data",
    });

    const { response } = await httpHandler.handle(request);

    // 에러 상태 코드 처리
    if (response.statusCode >= 300) {
      // parseErrorBody 로직 실행.
    }

    const result = await parseBody(response);
    console.log(result);
  } catch (err) {
    console.error(err);
  }
})();
```

## Getting Help

기능 추가 요청, 버그 신고는 깃허브 이슈를 사용해주세요.

## License

This Utility is distributed under the [MIT License](https://opensource.org/licenses/MIT), see LICENSE for more information.
