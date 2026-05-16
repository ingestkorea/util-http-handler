# Changelog

## 1.4.0 (2026-05-16)

### Added

- **통합 HTTP 에러 클래스(`HttpHandlerError`)**:
  - 상위 `middlewareRetry` 미들웨어가 재시도 전략시 식별할 수 있도록 에러 코드 규격을 정의.(`SDK.TIMEOUT`, `SDK.NETWORK_ERROR`)
- **일시적 인프라 장애 판단 기준 정의 (`CODE_TIME_OUT`, `CODE_NETWORK_ERROR`)**:
  - **Timeouts**: `ETIMEDOUT`, `EAI_AGAIN`
  - **Network Errors**: `ECONNRESET`, `ECONNREFUSED`, `EADDRINUSE`, `EPIPE`, `EHOSTUNREACH`, `ENETUNREACH`
  - 위 에러 발생 시 상위 미들웨어에서 지수 백오프(Exponential Backoff)를 포함한 자동 재시도가 수행 가능.

### Changed

- **`NodeHttpHandler`**:
  - `HttpHandlerError`를 이용한 에러 규격화 및 원본 자바스크립트 런타임 에러 감지 안전장치 추가.
  - 사용자의 `keepAlive` 및 `family` 설정 지원.
- **`NodeFetchHandler`**:
  - `AbortError`/`TimeoutError` 및 `err.cause.code`를 3단계 Fallback 구조로 추적하여 `HttpHandlerError`를 이용한 에러 규격화 추가.
- **`package.json`**:
  - ESM 지원하기 위해서 `"type": "module"` 속성 추가.
