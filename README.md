# BangPot Frontend

BangPot frontend 저장소입니다. 현재 저장소에는 Common Ops, Common Error Contract, Production Start frontend 작업의 기반이 반영되어 있습니다.

## 기술 스택

- Next.js App Router
- React
- TypeScript
- ESLint
- Vitest

## 디렉터리 구조

- `src/app`: 라우트 진입점
- `src/features`: 사용자 기능 흐름과 화면 컴포넌트
- `src/entities`: 도메인 단위 UI와 표현 모델
- `src/shared`: 공통 UI, 설정, API client, 에러 처리, 운영 보조 모듈

## 로컬 실행 방법

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

## 공개 env 키

| Key | 용도 | local | prod |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | frontend 실행 모드 (`local`, `prod`) | 권장 | 필수 |
| `NEXT_PUBLIC_API_BASE_URL` | backend base URL 또는 same-origin proxy base path | fallback 허용 | 필수 |

## 비공개 env 키

| Key | 용도 | local | prod |
| --- | --- | --- | --- |
| `BANGPOT_BACKEND_PROXY_TARGET` | Next/Vercel server가 backend로 대신 호출할 HTTP target | 선택 | same-origin proxy 사용 시 필수 |

규칙:

- `local`에서는 `NEXT_PUBLIC_API_BASE_URL`이 없을 때만 `http://localhost:8080` fallback을 허용합니다.
- `prod`에서는 `NEXT_PUBLIC_API_BASE_URL`을 반드시 명시해야 합니다.
- 운영 배포에는 localhost fallback이 남아 있으면 안 됩니다.
- frontend가 HTTPS이고 backend가 HTTP라면 browser mixed content를 피하기 위해 `NEXT_PUBLIC_API_BASE_URL=/backend`, `BANGPOT_BACKEND_PROXY_TARGET=http://<backend-host>:<port>` 조합으로 same-origin proxy를 사용합니다.

## Common Error Contract 기준

- 성공 응답은 별도 envelope 없이 resource JSON 그대로 유지합니다.
- 실패 응답은 backend 공통 JSON 계약을 우선 사용합니다.
- frontend shared error는 아래 값을 기준으로 정렬합니다.

| 필드 | 설명 |
| --- | --- |
| `code` | backend가 내려준 공통 에러 코드 |
| `message` | backend가 내려준 실패 메시지 |
| `requestId` | backend 요청 추적 ID |
| `fieldErrors` | validation 실패일 때만 채워지는 필드 오류 배열 |
| `status` | transport 수준의 HTTP status |
| `path` | frontend가 호출한 API 경로 |

규칙:

- backend가 `code`, `message`, `requestId`, `fieldErrors`를 내려주면 frontend는 그 값을 그대로 사용합니다.
- backend가 공통 실패 응답 계약을 지키지 않는 예외 상황에서만 fallback `code/message`를 사용합니다.
- auth/common 흐름의 실패 분기는 status 추측보다 backend `code`를 우선 사용합니다.

## 검증 명령

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## 작업 문서 위치

관련 계획서와 결과 문서는 모두 `workdocs-repo`에 정리합니다.

- Common Ops frontend 결과: [C:\bangpot\workdocs-repo\docs\plans\results\common-ops\00-common-ops-frontend-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\common-ops\00-common-ops-frontend-round-01-result.md)
- Common Error Contract frontend 결과: [C:\bangpot\workdocs-repo\docs\plans\results\common-error\00-common-error-contract-frontend-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\common-error\00-common-error-contract-frontend-round-01-result.md)
