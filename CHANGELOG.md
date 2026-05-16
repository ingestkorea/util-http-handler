# Changelog

## 1.4.1 (2026-05-16)

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
- **`NodeHttpHandlerOptions`**:
  - 초기화 시 구형 타임아웃 옵션인 `freeSocketTimeout` 제거
  - `socketTimeout` 또는 `keepAlive` 옵션으로 대체
  - 내부 소켓 유휴 타임아웃(`agentOptions.timeout`)은 비즈니스 타임아웃(`socketTimeout`)보다 +2초 길게 자동 계산되도록 설정. 유휴 소켓 재사용 시 발생할 수 있는 레이스 컨디션 및 `socket hang up` 차단.
