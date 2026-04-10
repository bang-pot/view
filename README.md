# BangPot Frontend

BangPot frontend 저장소입니다. 현재 저장소에는 Common Ops, Common Error Contract, Production Start, Auth Round 1~2, Crew Round 1, Crew Round 3~4의 최소 기능 UI가 반영되어 있습니다.

## 기술 스택

- Next.js App Router
- React
- TypeScript
- ESLint
- Vitest

## 디렉터리 구조

- `src/app`: 라우트 진입점
- `src/features`: 기능 단위 화면과 흐름
- `src/entities`: 도메인 단위 UI/표현 모델
- `src/shared`: 공통 UI, 설정, API client, 에러 처리, 운영 보조 모듈

## 로컬 실행

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

## 공개 env 기준

| Key | 용도 | local | prod |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | frontend 실행 모드 (`local`, `prod`) | 권장 | 필수 |
| `NEXT_PUBLIC_API_BASE_URL` | backend base URL 또는 same-origin proxy base path | fallback 허용 | 필수 |

규칙:

- `local`에서는 `NEXT_PUBLIC_API_BASE_URL`이 없을 때만 `http://localhost:8080` fallback을 허용합니다.
- `prod`에서는 `NEXT_PUBLIC_API_BASE_URL`을 반드시 명시해야 합니다.
- 운영 배포에는 localhost fallback이 남아 있으면 안 됩니다.

## 비공개 env 기준

| Key | 용도 | local | prod |
| --- | --- | --- | --- |
| `BANGPOT_BACKEND_PROXY_TARGET` | Next/Vercel server가 backend로 프록시할 HTTP target | 선택 | same-origin proxy 사용 시 필수 |

규칙:

- frontend가 HTTPS이고 backend가 HTTP일 때는 mixed content를 피하기 위해 `NEXT_PUBLIC_API_BASE_URL=/backend`, `BANGPOT_BACKEND_PROXY_TARGET=http://<backend-host>:<port>` 조합의 same-origin proxy를 사용합니다.

## Common Error Contract 기준

성공 응답은 별도 envelope 없이 resource JSON을 그대로 사용합니다. 실패 응답은 backend 공통 JSON 계약을 우선 사용합니다.

| 필드 | 설명 |
| --- | --- |
| `code` | backend 공통 에러 코드 |
| `message` | backend 실패 메시지 |
| `requestId` | backend 요청 추적 ID |
| `fieldErrors` | validation 실패 시 필드 에러 배열 |
| `status` | transport 계층의 HTTP status |
| `path` | frontend가 호출한 API 경로 |

규칙:

- backend가 `code`, `message`, `requestId`, `fieldErrors`를 내려주면 frontend는 그 값을 그대로 사용합니다.
- backend가 공통 실패 응답 계약을 지키지 않는 예외 상황에서만 fallback `code/message`를 사용합니다.
- auth/common/crew 흐름의 에러 분기는 status 추측보다 backend `code`를 우선 사용합니다.

## Auth Round 2 최소 기능 흐름

- `/`
  - `FULL` 사용자에게만 최소 프로필 메뉴를 노출합니다.
  - 메뉴 안에는 `Create crew`, `Profile`, `Logout`이 있습니다.
- `/profile`
  - 먼저 `/api/auth/me` 상태를 확인합니다.
  - `GUEST`는 `/login?redirectTo=%2Fprofile`로 이동합니다.
  - `TEMP` 또는 `completionRequired=true`는 `/auth/complete?redirectTo=%2Fprofile`로 이동합니다.
  - `FULL`만 `GET /api/auth/profile`로 현재 프로필(`id`, `nickname`)을 조회합니다.
- 닉네임 수정
  - `PATCH /api/auth/profile`로 연결합니다.
  - 실패 시 `fieldErrors`와 backend `message`를 그대로 사용합니다.
- 로그아웃
  - `POST /api/auth/logout` 호출 후 `/api/auth/me`를 다시 확인합니다.
  - `GUEST` 전환이 확인되면 `/login`으로 이동합니다.

## Crew Round 1 최소 기능 흐름

- `Create crew`
  - `FULL` 사용자에게만 최소 메뉴에서 노출합니다.
- `/crews/new`
  - 먼저 `/api/auth/me`로 auth 상태를 확인합니다.
  - `GUEST`는 `/login?redirectTo=%2Fcrews%2Fnew`로 이동합니다.
  - `TEMP` 또는 `completionRequired=true`는 `/auth/complete?redirectTo=%2Fcrews%2Fnew`로 이동합니다.
  - `FULL`만 생성 폼을 볼 수 있습니다.
- 생성 폼
  - `Name`: 필수
  - `Description`: 선택
  - `Visibility`: 기본값 `PUBLIC`
  - `imageUrl`: 이번 라운드에서는 `null`로 보냅니다.
- 생성 성공
  - `POST /api/crews`
  - 성공 시 `/crews/{crewId}`로 이동합니다.

## Crew Round 3 최소 기능 흐름

- 메인 `/`
  - `Public crews` 링크를 통해 공개 크루 발견 화면으로 진입합니다.
- `/crews/public`
  - `GET /api/crews/public`으로 공개 크루 카드 목록을 보여줍니다.
- `/crews/public/{crewId}`
  - `GET /api/crews/{crewId}/join`으로 공개 크루 소개와 현재 사용자 상태를 함께 확인합니다.
  - 상태별 분기:
    - `GUEST`: 로그인으로 이동
    - `COMPLETION_REQUIRED`: completion으로 이동
    - `CAN_REQUEST`: 선택형 메시지 입력 + 가입 신청
    - `PENDING`: 승인 대기 중
    - `MEMBER`: `/crews/{crewId}`로 이동
    - `PRIVATE_RESTRICTED`: 비활성화 + 안내 문구
- 가입 신청
  - `POST /api/crews/{crewId}/join-requests`
  - 메시지는 선택 입력이며 비워둘 수 있습니다.
  - 성공 시 결과 모달을 보여주고 이후 상태를 `PENDING`으로 유지합니다.
  - 200자 초과는 `fieldErrors.message`를 필드 에러로 노출합니다.

## Crew Round 4 최소 기능 흐름

- `/crews/{crewId}`
  - 기존 내부 크루 페이지에서 리더에게만 `가입 신청 관리` 진입 링크를 보여줍니다.
  - `GET /api/crews/{crewId}/join-requests/pending`으로 대기 중 요약을 읽습니다.
- `/crews/{crewId}/join-requests`
  - 먼저 `/api/auth/me`로 guest/temp/full 상태를 확인합니다.
  - `GUEST`는 `/login?redirectTo=...`로 이동하고, `TEMP` 또는 `completionRequired=true`는 completion으로 이동합니다.
  - `FULL`만 `GET /api/crews/{crewId}/join-requests`를 호출해 전체 목록을 불러옵니다.
- 목록 노출 내용
  - `nickname`
  - `message`
  - `status`
- 상태별 처리
  - `PENDING`에는 `승인`, `거절` 버튼이 보입니다.
  - 처리 성공 후에는 별도 새로고침 없이 목록 상태를 즉시 갱신합니다.
  - `APPROVED`, `REJECTED`는 읽기 전용 상태로 남습니다.

## 검증 명령

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## 작업 문서 위치

계획과 결과 문서는 모두 `workdocs-repo`에 정리합니다.

- Common Ops frontend 결과: [C:\bangpot\workdocs-repo\docs\plans\results\common-ops\00-common-ops-frontend-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\common-ops\00-common-ops-frontend-round-01-result.md)
- Common Error Contract frontend 결과: [C:\bangpot\workdocs-repo\docs\plans\results\common-error\00-common-error-contract-frontend-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\common-error\00-common-error-contract-frontend-round-01-result.md)
- Auth Round 2 결과: [C:\bangpot\workdocs-repo\docs\plans\results\auth\01-auth-builder-round-02-result.md](C:\bangpot\workdocs-repo\docs\plans\results\auth\01-auth-builder-round-02-result.md)
- Crew Round 1 결과: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-01-result.md)
- Crew Round 3 결과: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-03-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-03-result.md)
- Crew Round 4 결과: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-04-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-04-result.md)
