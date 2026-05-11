# BangPot Frontend

BangPot 프론트엔드 저장소입니다. Next.js App Router 기반으로 홈, 크루 탐색, 방탈출 탐색, 프로필, 크루 내부 화면을 제공합니다.

## 기술 스택

- Next.js App Router
- React
- TypeScript
- ESLint
- Vitest
- Testing Library

## 로컬 실행

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 주요 스크립트

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

- `dev`: 로컬 개발 서버 실행
- `build`: 프로덕션 빌드 확인
- `lint`: ESLint 검사
- `test`: Vitest 테스트 실행

## 환경 변수

`.env.example`을 복사해서 `.env`를 만든 뒤 필요한 값을 조정합니다.

| Key | 설명 | local 예시 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | 프론트 실행 환경 | `local` |
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저에서 호출할 API base URL | `http://localhost:8080` |
| `BANGPOT_BACKEND_PROXY_TARGET` | Next/Vercel 서버가 백엔드로 프록시할 target | `http://localhost:8080` |

운영 배포에서 프론트가 HTTPS이고 백엔드가 HTTP인 경우 mixed content를 피하기 위해 `NEXT_PUBLIC_API_BASE_URL=/backend`와 `BANGPOT_BACKEND_PROXY_TARGET=http://<backend-host>:<port>` 조합을 사용할 수 있습니다.

## 디렉터리 구조

```text
src/
  app/        Next.js 라우트 진입점
  features/   화면과 기능 단위 구현
  entities/   도메인 단위 표현 모델
  shared/     공통 UI, API client, 오류 처리, 설정
  test/       화면과 기능 테스트
```

## API 연결

프론트 API 호출은 `src/shared` 하위 client 모듈을 통해 관리합니다.

- 브라우저에서 직접 호출하는 base URL은 `NEXT_PUBLIC_API_BASE_URL`을 사용합니다.
- 운영 환경에서 same-origin proxy를 사용할 때는 `/backend` 경로를 통해 백엔드로 전달합니다.
- 백엔드 오류 응답은 공통 오류 계약을 우선 사용하고, 예외 상황에서만 프론트 fallback 메시지를 사용합니다.

## 테스트

변경 전후로 가능한 범위에서 아래 명령을 실행합니다.

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

특정 테스트 파일만 확인할 때는 예를 들어 아래처럼 실행합니다.

```powershell
npm.cmd test -- --run src/test/app/explore-page.test.tsx
```

## 작업 규칙

- 공통으로 쓸 수 있는 버튼, 칩, 입력, 셀렉트 등은 `src/shared/ui` 컴포넌트를 우선 사용합니다.
- API 계약이 바뀌면 `src/shared/*/types.ts`와 client, 화면 테스트를 함께 확인합니다.
- 화면 변경은 가능한 한 해당 feature 모듈 내부에 가깝게 유지합니다.
- 커밋 메시지는 `refactor: 변경 내용` 형식을 사용합니다.

## 배포

프론트는 Vercel 배포를 기준으로 운영합니다. 배포 전에는 최소한 `lint`, `test`, `build`가 통과하는지 확인합니다.
