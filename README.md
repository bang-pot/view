# BangPot Frontend

BangPot ?꾨줎?몄뿏????μ냼?낅땲?? ?꾩옱 ??μ냼?먮뒗 Common Ops, Common Error Contract, Production Start, Auth Round 1~2, Crew Round 1, Crew Round 3~5??理쒖냼 湲곕뒫 UI媛 諛섏쁺?섏뼱 ?덉뒿?덈떎.

## 湲곗닠 ?ㅽ깮

- Next.js App Router
- React
- TypeScript
- ESLint
- Vitest

## ?붾젆?곕━ 援ъ“

- `src/app`: ?쇱슦??吏꾩엯??
- `src/features`: 湲곕뒫 ?⑥쐞 ?붾㈃怨??먮쫫
- `src/entities`: ?꾨찓???⑥쐞 ?쒗쁽 紐⑤뜽
- `src/shared`: 怨듯넻 ?ㅼ젙, API client, ?먮윭 泥섎━, ?댁쁺 蹂댁“ 紐⑤뱢

## 濡쒖뺄 ?ㅽ뻾

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

## 怨듦컻 env 湲곗?

| Key | ?⑸룄 | local | prod |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | ?꾨줎???ㅽ뻾 紐⑤뱶 (`local`, `prod`) | 沅뚯옣 | ?꾩닔 |
| `NEXT_PUBLIC_API_BASE_URL` | backend base URL ?먮뒗 same-origin proxy base path | fallback ?덉슜 | ?꾩닔 |

洹쒖튃:

- `local`?먯꽌??`NEXT_PUBLIC_API_BASE_URL`???놁쓣 ?뚮쭔 `http://localhost:8080` fallback???덉슜?⑸땲??
- `prod`?먯꽌??`NEXT_PUBLIC_API_BASE_URL`??諛섎뱶??紐낆떆?댁빞 ?⑸땲??
- ?댁쁺 諛고룷?먮뒗 localhost fallback???⑥븘 ?덉쑝硫????⑸땲??

## 鍮꾧났媛?env 湲곗?

| Key | ?⑸룄 | local | prod |
| --- | --- | --- | --- |
| `BANGPOT_BACKEND_PROXY_TARGET` | Next/Vercel ?쒕쾭媛 backend濡??꾨줉?쒗븷 HTTP target | ?좏깮 | same-origin proxy ?ъ슜 ???꾩닔 |

洹쒖튃:

- frontend媛 HTTPS?닿퀬 backend媛 HTTP???뚮뒗 mixed content瑜??쇳븯湲??꾪빐 `NEXT_PUBLIC_API_BASE_URL=/backend`, `BANGPOT_BACKEND_PROXY_TARGET=http://<backend-host>:<port>` 議고빀??same-origin proxy瑜??ъ슜?⑸땲??

## Common Error Contract 湲곗?

?깃났 ?묐떟? 蹂꾨룄 envelope ?놁씠 resource JSON??洹몃?濡??ъ슜?⑸땲?? ?ㅽ뙣 ?묐떟? backend 怨듯넻 JSON 怨꾩빟???곗꽑 ?ъ슜?⑸땲??

| ?꾨뱶 | ?ㅻ챸 |
| --- | --- |
| `code` | backend 怨듯넻 ?먮윭 肄붾뱶 |
| `message` | backend ?ㅽ뙣 硫붿떆吏 |
| `requestId` | backend ?붿껌 異붿쟻 ID |
| `fieldErrors` | validation ?ㅽ뙣 ???꾨뱶 ?먮윭 諛곗뿴 |
| `status` | transport 怨꾩링??HTTP status |
| `path` | frontend媛 ?몄텧??API 寃쎈줈 |

洹쒖튃:

- backend媛 `code`, `message`, `requestId`, `fieldErrors`瑜??대젮二쇰㈃ frontend??洹?媛믪쓣 洹몃?濡??ъ슜?⑸땲??
- backend媛 怨듯넻 ?ㅽ뙣 ?묐떟 怨꾩빟??吏?ㅼ? ?딅뒗 ?덉쇅 ?곹솴?먯꽌留?fallback `code/message`瑜??ъ슜?⑸땲??
- auth/common/crew ?먮쫫???먮윭 遺꾧린??status 異붿륫蹂대떎 backend `code`瑜??곗꽑 ?ъ슜?⑸땲??

## Auth Round 2 理쒖냼 湲곕뒫 ?먮쫫

- `/`
  - `FULL` ?ъ슜?먯뿉寃뚮쭔 理쒖냼 ?꾨줈??硫붾돱瑜??몄텧?⑸땲??
  - 硫붾돱 ?덉뿉??`Create crew`, `Profile`, `Logout`, `Public crews`媛 ?덉뒿?덈떎.
- `/profile`
  - 癒쇱? `/api/auth/me` ?곹깭瑜??뺤씤?⑸땲??
  - `GUEST`??`/login?redirectTo=%2Fprofile`濡??대룞?⑸땲??
  - `TEMP` ?먮뒗 `completionRequired=true`??`/auth/complete?redirectTo=%2Fprofile`濡??대룞?⑸땲??
  - `FULL`留?`GET /api/users/me`濡??꾩옱 ?꾨줈??`id`, `nickname`)??議고쉶?⑸땲??
- ?됰꽕???섏젙
  - `PATCH /api/users/me`濡??곌껐?⑸땲??
  - ?ㅽ뙣 ??`fieldErrors`? backend `message`瑜?洹몃?濡??ъ슜?⑸땲??
- ?됰꽕??媛?⑹꽦 ?뺤씤
  - `GET /api/users/nickname-availability`瑜??ъ슜?⑸땲??
- 濡쒓렇?꾩썐
  - `POST /api/auth/logout` ?몄텧 ??`/api/auth/me`瑜??ㅼ떆 ?뺤씤?⑸땲??
  - `GUEST` ?꾪솚???뺤씤?섎㈃ `/login`?쇰줈 ?대룞?⑸땲??

## Crew Round 1 理쒖냼 湲곕뒫 ?먮쫫

- `Create crew`
  - `FULL` ?ъ슜?먯뿉寃뚮쭔 理쒖냼 硫붾돱?먯꽌 ?몄텧?⑸땲??
- `/crews/new`
  - 癒쇱? `/api/auth/me`濡?auth ?곹깭瑜??뺤씤?⑸땲??
  - `GUEST`??`/login?redirectTo=%2Fcrews%2Fnew`濡??대룞?⑸땲??
  - `TEMP` ?먮뒗 `completionRequired=true`??`/auth/complete?redirectTo=%2Fcrews%2Fnew`濡??대룞?⑸땲??
  - `FULL`留??앹꽦 ?쇱쓣 蹂????덉뒿?덈떎.
- ?앹꽦 ??
  - `Name`: ?꾩닔
  - `Description`: ?좏깮
  - `Visibility`: 湲곕낯媛?`PUBLIC`
  - `imageUrl`: ?대쾲 ?쇱슫?쒖뿉?쒕뒗 `null`濡?蹂대깄?덈떎.
- ?앹꽦 ?깃났
  - `POST /api/crews`
  - ?깃났 ??`/crews/{crewId}`濡??대룞?⑸땲??

## Crew Round 3 理쒖냼 湲곕뒫 ?먮쫫

- 硫붿씤 `/`
  - `Public crews` 留곹겕瑜??듯빐 怨듦컻 ?щ（ 諛쒓껄 ?붾㈃?쇰줈 吏꾩엯?⑸땲??
- `/crews/public`
  - `GET /api/crews/public`?쇰줈 怨듦컻 ?щ（ 移대뱶 紐⑸줉??蹂댁뿬以띾땲??
- `/crews/public/{crewId}`
  - `GET /api/crews/{crewId}/join`?쇰줈 怨듦컻 ?щ（ ?뚭컻? ?꾩옱 ?ъ슜???곹깭瑜??④퍡 ?뺤씤?⑸땲??
  - ?곹깭蹂?遺꾧린:
    - `GUEST`: 濡쒓렇?몄쑝濡??대룞
    - `COMPLETION_REQUIRED`: completion?쇰줈 ?대룞
    - `CAN_REQUEST`: ?좏깮??硫붿떆吏 ?낅젰 + 媛???좎껌
    - `PENDING`: ?뱀씤 ?湲?以?
    - `MEMBER`: `/crews/{crewId}`濡??대룞
    - `PRIVATE_RESTRICTED`: 鍮꾪솢?깊솕 + ?덈궡 臾멸뎄
- 媛???좎껌
  - `POST /api/crews/{crewId}/join-requests`
  - 硫붿떆吏???좏깮 ?낅젰?닿퀬 鍮꾩썙?????덉뒿?덈떎.
  - ?깃났 ??寃곌낵 紐⑤떖??蹂댁뿬二쇨퀬 ?댄썑 ?곹깭瑜?`PENDING`?쇰줈 ?좎??⑸땲??
  - 200??珥덇낵??`fieldErrors.message`瑜??꾨뱶 ?먮윭濡??몄텧?⑸땲??

## Crew Round 4 理쒖냼 湲곕뒫 ?먮쫫

- `/crews/{crewId}`
  - 由щ뜑?먭쾶留?`媛???좎껌 愿由? 留곹겕瑜?蹂댁뿬以띾땲??
  - `GET /api/crews/{crewId}/join-requests/pending`?쇰줈 ?湲?以??붿빟???쒖떆?⑸땲??
- `/crews/{crewId}/join-requests`
  - 癒쇱? `/api/auth/me`濡?guest/temp/full ?곹깭瑜??뺤씤?⑸땲??
  - `GUEST`??`/login?redirectTo=...`濡??대룞?⑸땲??
  - `TEMP` ?먮뒗 `completionRequired=true`??completion?쇰줈 ?대룞?⑸땲??
  - `FULL`留?`GET /api/crews/{crewId}/join-requests`濡??꾩껜 紐⑸줉??議고쉶?⑸땲??
- 紐⑸줉 ?쒖떆
  - `nickname`
  - `message`
  - `status`
- ?곹깭蹂?泥섎━
  - `PENDING`?먮쭔 `?뱀씤`, `嫄곗젅` 踰꾪듉??蹂댁엯?덈떎.
  - 泥섎━ ?깃났 ??蹂꾨룄 ?덈줈怨좎묠 ?놁씠 紐⑸줉 ?곹깭瑜?利됱떆 媛깆떊?⑸땲??
  - `APPROVED`, `REJECTED`???쎄린 ?곹깭濡??⑥뒿?덈떎.

## Crew Round 5 理쒖냼 湲곕뒫 ?먮쫫

- `/crews/{crewId}`
  - 鍮꾧났媛??щ（ 由щ뜑?먭쾶留?`吏곸젒 珥덈?` 留곹겕瑜?蹂댁뿬以띾땲??
  - 吏꾩엯 留곹겕 ?몄텧 ?щ???`GET /api/crews/{crewId}/invite-candidates` ?깃났 ?щ?瑜?湲곗??쇰줈 ?먮떒?⑸땲??
- `/crews/{crewId}/invites`
  - 癒쇱? `/api/auth/me`濡?guest/temp/full ?곹깭瑜??뺤씤?⑸땲??
  - `GUEST`??`/login?redirectTo=...`濡??대룞?⑸땲??
  - `TEMP` ?먮뒗 `completionRequired=true`??completion?쇰줈 ?대룞?⑸땲??
  - `FULL`留?珥덈? ?붾㈃??蹂????덉뒿?덈떎.
- 吏곸젒 珥덈? ?붾㈃
  - 寃??input
  - 寃곌낵 紐⑸줉
  - 1紐??좏깮
  - `珥덈? 蹂대궡湲? 踰꾪듉
- 寃??
  - `GET /api/crews/{crewId}/invite-candidates`
  - `nickname` query???좏깮?대ŉ, 鍮꾩썙?먮㈃ ?꾩껜 珥덈? ?꾨낫瑜?議고쉶?⑸땲??
- 吏곸젒 珥덈? ?앹꽦
  - `POST /api/crews/{crewId}/invites`
  - body: `{ targetUserId }`
  - ?깃났 ??`PENDING` ?앹꽦 臾멸뎄瑜?蹂댁뿬二쇨퀬 踰꾪듉??鍮꾪솢?깊솕?⑸땲??
- ?덉쇅 泥섎━
  - `CREW_INVITE_NOT_ALLOWED`: 怨듦컻 ?щ（ 吏곸젒 珥덈? 遺덇? 硫붿떆吏
  - `CREW_ALREADY_JOINED`: ?대? 媛?낇븳 ?ъ슜???덈궡
  - `CREW_INVITE_ALREADY_PENDING`: ?대? pending 珥덈?媛 ?덈뒗 ?ъ슜???덈궡

## 寃利?紐낅졊

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## ?묒뾽 臾몄꽌 ?꾩튂

怨꾪쉷怨?寃곌낵 臾몄꽌??紐⑤몢 `workdocs-repo`???뺣━?⑸땲??

- Auth Round 2 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\auth\01-auth-builder-round-02-result.md](C:\bangpot\workdocs-repo\docs\plans\results\auth\01-auth-builder-round-02-result.md)
- Crew Round 1 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-01-result.md)
- Crew Round 3 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-03-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-03-result.md)
- Crew Round 4 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-04-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-04-result.md)
- Crew Round 5 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-05-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-05-result.md)
- Crew Round 6 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-06-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-06-result.md)
 - Crew Round 7 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-07-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-07-result.md)
- Crew Round 8 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-08-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-08-result.md)
- Crew Round 9 寃곌낵: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-09-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-09-result.md)
- Crew Round 10 결과: [C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-10-result.md](C:\bangpot\workdocs-repo\docs\plans\results\crew\02-crew-builder-round-10-result.md)
- Meeting Round 1 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-01-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-01-result.md)

## Crew Round 6 Minimal Invite Flow

- `/profile`
  - Full users can enter their invite consumer flow through the `My invites` link.
- `/crew-invites`
  - Reuses the existing auth gate first.
  - `GUEST` users are redirected to `/login?redirectTo=%2Fcrew-invites`.
  - `TEMP` or `completionRequired=true` users are redirected to `/auth/complete?redirectTo=%2Fcrew-invites`.
  - `FULL` users load `GET /api/crew-invites/me`.
- Invite list
  - Shows `crewName`, `inviterNickname`, and `status`.
  - `PENDING` items expose `Accept` and `Reject`.
  - `APPROVED` items stay readable and expose a link to `/crews/{crewId}`.
  - `REJECTED` items stay readable without further actions.
- Invite actions
  - Accept: `POST /api/crew-invites/{inviteId}/accept`
  - Reject: `POST /api/crew-invites/{inviteId}/reject`
  - Successful actions update local state immediately without a refetch.

## Crew Round 7 Minimal Internal Hub

- `/crews/{crewId}`
  - Reuses the new member-only hub contract from `GET /api/crews/{crewId}`.
  - Non-members are redirected back to `/crews/public/{crewId}` instead of seeing the internal hub shell.
- Crew hub shell
  - Renders a minimal `Crew summary card`, `Crew navigation`, `Crew guidance area`, and `Body canvas`.
  - The summary card shows `crewId`, `name`, `description`, `visibility`, and the current member `role`.
  - The visible labels are currently Korean for the manual verification round: `홈`, `정책`, `크루원`, `관리`, `본문 캔버스`.
  - The side navigation stays intentionally small and only exposes the shell structure, not actual tab bodies.
- Guidance area
  - `hasNotice=true` shows a minimal notice marker only.
  - Leaders additionally see `pendingJoinRequestCount` and a `가입 신청 관리` link.
  - Regular members do not see the leader-only join request summary.
- Scope guard
  - This round opens the internal crew space skeleton only.
  - It does not implement policy, member list, schedules, meetings, or a full management console yet.

## Crew Round 8 Crew Members Read View

- `/crews/{crewId}`
  - The internal hub now links its `크루원` navigation item to the actual members screen.
- `/crews/{crewId}/members`
  - Reuses the joined-member access rule through `GET /api/crews/{crewId}/members`.
  - `AUTH_ACCESS_DENIED` and `AUTH_UNAUTHENTICATED` are redirected back to `/crews/public/{crewId}` so the existing public/login/completion flow can continue.
- Member list rendering
  - The page is intentionally read-only and renders a simple list of members.
  - Each row shows `nickname`, `role`, `joinedAt`, `bio`, `gender`, and `escapeCount`.
  - `profileImageUrl` falls back to a default avatar label when the backend returns `null`.
  - The frontend keeps the list stable with `LEADER` first and the remaining members sorted by `joinedAt desc`.
- States
  - Empty list: `아직 표시할 크루원이 없습니다.`
  - Load failure: a safe error message with a link back to the internal crew hub
  - No member row click action or management action is attached in this round

### Manual Verification

- Verified the round 08 checklist on the local app:
  - joined members can open `/crews/{crewId}/members`
  - non-members are redirected back to `/crews/public/{crewId}`
 - leader-first ordering and joined-date ordering are visible
  - avatar fallbacks render safely
  - no member click action or management action was introduced

## Crew Round 9 Crew Policies Read View

- `/crews/{crewId}`
  - The internal hub now links its `정책` navigation item to the policy screen.
- `/crews/{crewId}/policies`
  - Reuses the joined-member access rule through `GET /api/crews/{crewId}/policies`.
  - `AUTH_ACCESS_DENIED` and `AUTH_UNAUTHENTICATED` are redirected back to `/crews/public/{crewId}` so the existing public/login/completion flow can continue.
- Policy rendering
  - Policies are rendered as read-only accordion cards.
  - The default state shows titles only.
  - Clicking a title expands the full text body and preserves plain text plus line breaks only.
  - Clicking the same title again collapses the body.
- Empty state
  - Shared empty message: `자유로운 분위기로 운영되고 있네요`
  - Leaders additionally see a disabled `정책 추가하러 가기` CTA placeholder.
  - Regular members only see the empty message.
- States
  - Load failure: a safe error message with a link back to the internal crew hub
  - No policy management action is attached in this round

### Manual Verification

- Verified the round 09 checklist on the local app:
  - joined members can open `/crews/{crewId}/policies`
  - policy titles toggle open and closed as accordion cards
  - empty-state messaging changes between leader and member views
  - non-members are redirected back to `/crews/public/{crewId}`
  - no policy management action was introduced beyond the leader-only CTA placeholder

## Crew Round 10 크루 공개 범위 설정

- `/crews/{crewId}`
  - 리더에게만 `설정` 링크가 보입니다.
  - 링크는 `/crews/{crewId}/settings`로 연결됩니다.
- `/crews/{crewId}/settings`
  - 기존 `GET /api/crews/{crewId}` 응답의 `visibility`와 `myRole`을 그대로 사용합니다.
  - `GUEST`는 `/login?redirectTo=%2Fcrews%2F{crewId}%2Fsettings`
  - `TEMP` 또는 `completionRequired=true`는 `/auth/complete?redirectTo=%2Fcrews%2F{crewId}%2Fsettings`
  - 비가입자는 `/crews/public/{crewId}`로 돌려보냅니다.
  - 일반 크루원은 값을 바꾸지 못하고 `크루장만 공개 범위를 변경할 수 있습니다.` 문구만 봅니다.
- 토글 동작
  - 스위치 라벨: `공개 크루 여부`
  - `PUBLIC`이면 탐색 노출 + 직접 가입 신청 가능
  - `PRIVATE`이면 탐색 비노출 + 직접 가입 신청 불가
  - 토글 변경 시 `PATCH /api/crews/{crewId}/visibility`를 즉시 호출하고, 성공하면 화면 상태를 로컬에서 바로 갱신합니다.
  - 확인 모달이나 변경 이력은 이번 라운드에 넣지 않습니다.

## Meeting Round 1 모임 생성 / 목록 / 상세

- 내부 허브
  - `/crews/{crewId}`의 네비게이션에 `모임` 링크를 추가했습니다.
  - 가입한 크루원만 모임 영역으로 진입할 수 있습니다.
- `/crews/{crewId}/meetings`
  - `GET /api/crews/{crewId}/meetings`로 모임 목록을 읽습니다.
  - 각 항목에 `테마명`, `장소`, `날짜`, `시간`, `정원`, `모임 상태`, `결과 상태`를 표시합니다.
  - 빈 목록이면 `아직 등록된 모임이 없습니다.` 문구를 보여줍니다.
  - `모임 만들기` 링크를 통해 생성 화면으로 이동합니다.
- `/crews/{crewId}/meetings/new`
  - 필수 입력: `날짜`, `시간`, `장소`, `테마명`, `정원`
  - 선택 입력: `총 비용`, `예약 링크`, `오픈채팅 링크`, `설명`
  - `POST /api/crews/{crewId}/meetings` 성공 시 새 모임 상세 페이지로 바로 이동합니다.
- `/crews/{crewId}/meetings/{meetingId}`
  - `GET /api/crews/{crewId}/meetings/{meetingId}`로 상세를 읽습니다.
  - 생성 직후 기본 상태인 `RECRUITING`, `NOT_RECORDED`를 화면에서 확인할 수 있습니다.
- 접근 가드
  - guest와 temp는 기존 auth 규칙을 그대로 재사용합니다.
  - 비가입자는 내부 모임 화면 대신 `/crews/public/{crewId}` 공개 소개 흐름으로 돌려보냅니다.
- 범위 제한
  - 참가 신청, 승인/거절, 모집마감, 취소, 종료, 결과 입력은 이번 라운드에 포함하지 않습니다.

### Meeting Round 1 수동 검증

- 가입한 크루원 기준으로 `/crews/{crewId}/meetings` 진입을 확인했습니다.
- `모임 만들기` 화면에서 필수 입력만으로 생성이 성공하는 것을 확인했습니다.
- 생성 직후 상세 화면에서 `RECRUITING`, `NOT_RECORDED`가 보이는 것을 확인했습니다.
- 목록으로 돌아왔을 때 방금 만든 모임이 바로 보이는 것을 확인했습니다.
- 비가입자는 `/crews/public/{crewId}` 흐름으로 분기되는 것을 확인했습니다.

