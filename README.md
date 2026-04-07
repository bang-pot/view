# BangPot Frontend

BangPot frontend 저장소입니다. 현재 저장소에는 Common Ops, Common Error Contract, Production Start, Auth Round 2 최소 기능 UI 기준이 반영되어 있습니다.

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

## 로컬 실행

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
- frontend가 HTTPS이고 backend가 HTTP이면 browser mixed content를 피하기 위해 `NEXT_PUBLIC_API_BASE_URL=/backend`, `BANGPOT_BACKEND_PROXY_TARGET=http://<backend-host>:<port>` 조합으로 same-origin proxy를 사용합니다.

## Common Error Contract 기준

- 성공 응답은 별도 envelope 없이 resource JSON 그대로 사용합니다.
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

## Auth Round 2 최소 기능 흐름

- `/`
  - `FULL` 사용자에게만 최소 프로필 메뉴를 노출합니다.
  - 메뉴 안에서 `Profile`, `Logout`에 진입할 수 있습니다.
- `/profile`
  - 진입 시 먼저 `/api/auth/me` 상태를 확인합니다.
  - `GUEST`는 `/login?redirectTo=%2Fprofile`로 이동합니다.
  - `TEMP` 또는 `completionRequired=true`는 `/auth/complete?redirectTo=%2Fprofile`로 이동합니다.
  - `FULL`만 `GET /api/auth/profile`로 현재 프로필(`id`, `nickname`)을 조회합니다.
- 닉네임 수정
  - `PATCH /api/auth/profile`로 저장합니다.
  - 실패 시 backend Common Error Contract의 `fieldErrors`와 `message`를 그대로 소비합니다.
- 로그아웃
  - `POST /api/auth/logout` 호출 뒤 `/api/auth/me`를 다시 확인합니다.
  - `GUEST`로 전환되면 `/login`으로 이동합니다.
- `/protected-demo`
  - `FULL` 사용자에게 최소 프로필 메뉴를 추가해 보호 경로에서도 `Profile`, `Logout`에 진입할 수 있습니다.

## 최소 UI를 택한 이유

- 이번 라운드의 목표는 디자이너 시안이 없는 상태에서 기능 검증용 auth 진입과 로그아웃 흐름을 닫는 것이었습니다.
- 그래서 전역 헤더나 공통 shell을 미리 크게 설계하지 않고, 현재 최소 공통 auth UI 위치에 `Profile + Logout`만 가진 메뉴를 추가했습니다.
- 이렇게 하면 나중에 디자이너 시안이 들어왔을 때 전체 헤더 구조를 다시 설계해도 현재 auth 계약과 로그아웃 흐름은 그대로 재사용할 수 있습니다.
- 즉 이번 구조는 임시방편이 아니라, 과한 구조 고정을 피하고 후속 디자인 변경 비용을 줄이기 위한 의도적인 최소 구현입니다.

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
- Auth Round 2 결과: [C:\bangpot\workdocs-repo\docs\plans\results\auth\01-auth-builder-round-02-result.md](C:\bangpot\workdocs-repo\docs\plans\results\auth\01-auth-builder-round-02-result.md)
