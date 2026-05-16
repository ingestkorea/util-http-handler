# @ingestkorea/util-http-handler

[![npm (scoped)](https://img.shields.io/npm/v/@ingestkorea/util-http-handler?style=flat-square)](https://www.npmjs.com/package/@ingestkorea/util-http-handler)
[![npm downloads](https://img.shields.io/npm/dm/@ingestkorea/util-http-handler?style=flat-square)](https://www.npmjs.com/package/@ingestkorea/util-http-handler)

> An internal package

> You probably shouldn't, at least directly.

## Description

- Node.js 환경을 위한 가벼운 HTTP 핸들러 유틸리티입니다.
- AWS Lambda 및 일반 서버 환경에 최적화되어 있습니다.
- 기존 Node.js 방식(http/https)과 현대적인 fetch 방식을 모두 지원합니다.

## Features

- **Multi-Handler 지원**: 정밀한 소켓 제어가 가능한 `NodeHttpHandler`와 최신 API 기반의 `NodeFetchHandler`를 제공합니다.

- **Keep-Alive 지원**: 소켓을 재사용하여 연속적인 요청의 응답 속도를 향상시킵니다.

- **좀비 소켓 방지**: `freeSocketTimeout` 옵션을 통해 람다 환경의 간헐적인 연결 끊김(ECONNRESET) 현상을 방지합니다.

- **이중 타임아웃 시스템**:

  - **NodeHttpHandler**: 연결 타임아웃(connectionTimeout)과 소켓 타임아웃(socketTimeout)을 분리하여 제어합니다.
  - **NodeFetchHandler**: AbortController 기반의 요청 타임아웃을 지원합니다.

- **리소스 자동 정리**: 요청 성공, 실패, 데이터 파싱 에러 시에도 스트림이 항상 닫히도록 제어합니다.

- **환경별 스트림 처리**: Node.js `Readable` 및 Web 표준 `ReadableStream`을 모두 안전하게 수집하고 정리합니다.

## Installing

```sh
npm install @ingestkorea/util-http-handler
```

## Getting Started

### Pre-requisites

- **TypeScript v5 이상**
- **Node v22 이상**

```sh
# save dev mode
npm install -D typescript @types/node
```

## Usage

### HTTP 핸들러 생성

#### NodeHttpHandler

- 정밀한 소켓 풀 및 프로토콜 제어가 필요한 백엔드 서버 사이드 환경에 적합합니다. (서버/람다 권장)
- 실행 환경에 맞춰 `socketTimeout`을 조정하면 서버 지연으로 인한 **무한 대기 현상을 방지합니다.**
- 내부적으로 내부 소켓 유휴 타임아웃은 `socketTimeout +2초` 설정되어 유휴 소켓 재사용 시 발생하는 **`socket hang up (ECONNRESET)` 에러를 예방**합니다.

```ts
import { NodeHttpHandler } from "@ingestkorea/util-http-handler";

// 1. AWS Lambda 환경 (빠른 실패 및 타임아웃 방지)
// 람다 특성상 keepAlive를 끄는 것이 소켓 유실로 인한 ECONNRESET 예방에 유리
const lambdaHandler = new NodeHttpHandler({
  keepAlive: false,
  connectionTimeout: 1000,
  socketTimeout: 2000,
});

// 2. 일반 Node.js 백엔드 서버 환경 (기본 권장값)
// 지속적인 커넥션 재사용으로 성능 최적화
const serverHandler = new NodeHttpHandler({
  connectionTimeout: 3000,
  socketTimeout: 5000,
});
```

#### NodeFetchHandler

- 표준 fetch API 기반으로 동작하며, 가벼운 요청에 적합합니다. (표준/범용 권장)

```ts
import { NodeFetchHandler } from "@ingestkorea/util-http-handler";

const fetchHandler = new NodeFetchHandler({
  requestTimeout: 3000, // 전체 요청 제한 시간
});
```

### 응답 바디 처리

- **NodeHttpHandler**: `collectBodyString`과 `destroyStream`을 조합하여 메모리 누수 없이 안전하게 데이터를 처리합니다.

- **NodeFetchHandler**: `collectFetchBodyString`과 `destroyFetchStream`을 조합하여 메모리 누수 없이 안전하게 데이터를 처리합니다.

**주의사항**: 핸들러 타입에 맞는 데이터 수집, 리소스 정리 함수를 사용해야 합니다.

```ts
// helper.ts
import {
  HttpResponse,
  collectBodyString,     // NodeHttpHandler 응답용 (Readable)
  destroyStream,         // Node 스트림 파괴
  collectFetchBodyString, // FetchHttpHandler 응답용 (ReadableStream)
  destroyFetchStream     // Fetch 스트림 파괴
} from "@ingestkorea/util-http-handler";

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

const isJsonResponse = (contentType?: string): boolean => {
  return contentType?.toLowerCase().includes("application/json") ?? false;
};
```

### 요청 실행

```ts
import { HttpRequest, NodeHttpHandler, HttpHandlerError } from "@ingestkorea/util-http-handler";
import { parseBody, parseErrorBody } from "./helper.js";

// 핸들러는 성능을 위해 재사용 권장
const httpHandler = new NodeHttpHandler({...});

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
    if (err instanceof HttpHandlerError) {
      if(err.code == "SDK.NETWORK_ERROR" || err.code == "SDK.TIMEOUT"){
        // ...재시도 로직
      }
    } else {
      console.error(err);
    }
  }
})();
```

## Getting Help

기능 추가 요청, 버그 신고는 깃허브 이슈를 사용해주세요.

## License

This Utility is distributed under the [MIT License](https://opensource.org/licenses/MIT), see LICENSE for more information.
