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
- Meeting Round 2 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-02-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-02-result.md)
- Meeting Round 3 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-03-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-03-result.md)
- Meeting Round 4 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-04-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-04-result.md)
- Meeting Round 5 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-05-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-05-result.md)
- Meeting Round 6 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-06-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-06-result.md)
- Meeting Round 7 결과: [C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-07-result.md](C:\bangpot\workdocs-repo\docs\plans\results\meeting\03-meeting-builder-round-07-result.md)

## Meeting Round 2 Minimal Instant Join Flow

- `/crews/{crewId}/meetings/{meetingId}`
  - Reuses the existing member-only meeting detail gate first.
  - `AUTH_ACCESS_DENIED` and `AUTH_UNAUTHENTICATED` still return the user to `/crews/public/{crewId}` so the existing public/login/completion flow can continue.
- Meeting detail participation state
  - The meeting detail contract now reads `myParticipationStatus` as `NOT_JOINED` or `JOINED`.
  - `NOT_JOINED` shows the `참여하기` action.
  - `JOINED` shows a read-only `참여 중` state.
  - Meeting hosts are also treated as `JOINED` by the backend, so the frontend renders them with the same read-only joined state.
- Instant join action
  - `POST /api/crews/{crewId}/meetings/{meetingId}/join`
  - On success the frontend updates the local meeting state immediately without a refetch.
  - `MEETING_PARTICIPATION_ALREADY_JOINED` is normalized to the same local `JOINED` state so the detail page stays consistent even if the user retries.
- Scope guard
  - This round only adds `즉시 참여`.
  - Approval/rejection, cancellation, schedule overlap warnings, recruitment closing, and result recording are still intentionally out of scope.

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

## Meeting Round 2 모임 즉시 참여

- `/crews/{crewId}/meetings/{meetingId}`
  - 기존 모임 상세 화면에 `내 참가 상태` 블록을 유지하고, 최신 PRD 기준의 즉시 참여 흐름으로 바꿨습니다.
  - 상세 응답의 `myParticipationStatus`를 그대로 읽어 상태별 UI를 분기합니다.
- 참가 상태 분기
  - `NOT_JOINED`: `참여하기` 버튼 노출
  - `JOINED`: `참여 중` 읽기 상태 노출
- 즉시 참여 요청
  - `POST /api/crews/{crewId}/meetings/{meetingId}/join`
  - 성공 시 별도 새로고침 없이 로컬 meeting state를 `JOINED`로 즉시 갱신합니다.
  - backend가 `MEETING_PARTICIPATION_ALREADY_JOINED`를 주면 같은 `JOINED` 상태처럼 반영합니다.
- 접근 가드
  - guest / temp / 비가입자는 기존 내부 크루 접근 규칙을 그대로 재사용합니다.
  - `AUTH_ACCESS_DENIED`, `AUTH_UNAUTHENTICATED`면 `/crews/public/{crewId}` 공개 소개 흐름으로 돌려보냅니다.
- 범위 제한
  - 승인 / 거절 / 참여취소 / 일정 중복 경고 / 모집마감 / 취소 / 종료는 이번 라운드에 포함하지 않습니다.

### Meeting Round 2 수동 검증

- 가입한 크루원이 모임 상세에서 `NOT_JOINED / JOINED` 상태를 구분해서 보는 것을 확인했습니다.
- `참여하기` 성공 후 상세 화면 상태가 바로 `JOINED`로 바뀌는 것을 확인했습니다.
- 비가입자, guest, temp 사용자는 내부 상세 대신 기존 공개 소개 / 로그인 / completion 흐름으로 분기되는 것을 확인했습니다.

## Meeting Round 3 모임 참여취소

- `/crews/{crewId}/meetings/{meetingId}`
  - 기존 모임 상세 화면의 `내 참가 상태` 블록을 유지한 채 `참여취소` 흐름을 추가했습니다.
  - 상세 응답의 `myParticipationStatus`는 계속 `NOT_JOINED / JOINED` 기준으로 읽습니다.
- 참여 상태 분기
  - `NOT_JOINED`: `참여하기` 버튼 노출
  - `JOINED`: `참여 중` 읽기 상태 노출
  - `JOINED`이면서 현재 사용자가 모임장이 아니면 `참여취소` 버튼을 함께 노출합니다.
  - 모임장은 backend에서 `JOINED`로 해석되더라도 프론트에서는 `참여취소` 버튼을 숨깁니다.
- 참여취소 요청
  - `DELETE /api/crews/{crewId}/meetings/{meetingId}/join`
  - 성공 시 별도 새로고침 없이 로컬 meeting state를 `NOT_JOINED`로 즉시 갱신합니다.
  - 이미 참여 중이 아니거나 모임장 차단 에러가 오더라도 안전한 메시지로 처리하고 화면은 깨지지 않게 유지합니다.
- 접근 가드
  - guest / temp / 비가입자는 기존 내부 크루 접근 규칙을 그대로 재사용합니다.
  - `AUTH_ACCESS_DENIED`, `AUTH_UNAUTHENTICATED`면 `/crews/public/{crewId}` 공개 소개 흐름으로 돌려보냅니다.
- 범위 제한
  - 모집마감, 수동 오픈, 모임 취소, 모임 종료, 결과 입력은 이번 라운드에 포함하지 않습니다.

### Meeting Round 3 수동 검증

- 가입한 크루원이 모임 상세에서 `JOINED / NOT_JOINED` 상태를 구분해서 보는 것을 확인했습니다.
- `참여취소` 성공 후 상세 화면 상태가 바로 `NOT_JOINED`로 바뀌는 것을 확인했습니다.
- 모임장은 `참여취소` 버튼이 노출되지 않는 것을 확인했습니다.
- 비가입자, guest, temp 사용자는 내부 상세 대신 기존 공개 소개 / 로그인 / completion 흐름으로 분기되는 것을 확인했습니다.

## Meeting Round 4 모임 운영 상태 변경

- `/crews/{crewId}/meetings/{meetingId}`
  - 기존 모임 상세 화면에 `모임 운영` 섹션을 추가했습니다.
  - 상세 응답의 `status`를 그대로 읽고, 상태와 권한에 따라 허용된 버튼만 노출합니다.
- 개설자 분기
  - `RECRUITING`: `모집마감`, `모임 취소`
  - `RECRUITMENT_CLOSED`: `수동 오픈`, `모임 종료`, `모임 취소`
- 크루장 분기
  - `RECRUITING`, `RECRUITMENT_CLOSED`: `모임 취소`만 가능
  - 개설자 전용 `모집마감`, `수동 오픈`, `모임 종료`는 보이지 않습니다.
- 일반 참가자 분기
  - 운영 액션 버튼이 보이지 않습니다.
- 상태 변경 요청
  - `POST /api/crews/{crewId}/meetings/{meetingId}/close-recruitment`
  - `POST /api/crews/{crewId}/meetings/{meetingId}/reopen-recruitment`
  - `POST /api/crews/{crewId}/meetings/{meetingId}/cancel`
  - `POST /api/crews/{crewId}/meetings/{meetingId}/complete`
  - 성공 시 별도 새로고침 없이 상세 화면의 `meeting.status`를 로컬에서 즉시 갱신합니다.
- 목록 / 상세 동기화
  - 상세는 로컬 상태 갱신으로 바로 반영합니다.
  - 목록은 기존 `GET /api/crews/{crewId}/meetings` no-store 조회를 유지하므로 목록 화면 재진입 시 최신 상태를 다시 읽습니다.
- 접근 가드
  - guest / temp / 비가입자는 기존 내부 크루 접근 규칙을 그대로 재사용합니다.
  - `AUTH_ACCESS_DENIED`, `AUTH_UNAUTHENTICATED`면 `/crews/public/{crewId}` 공개 소개 흐름으로 돌려보냅니다.
- 범위 제한
  - 결과 입력, 정산, 운영 히스토리는 이번 라운드에 포함하지 않습니다.

## Meeting Round 5 모임 결과 입력

- `/crews/{crewId}/meetings/{meetingId}`
  - 기존 모임 상세 화면에 `모임 결과` 섹션을 추가했습니다.
  - 현재 결과 상태를 항상 읽기 상태로 보여주고, 필요할 때만 개설자 입력 UI를 노출합니다.
- 결과 상태 분기
  - `NOT_RECORDED`: 아직 결과를 기록하지 않은 상태입니다.
  - `SUCCESS`: 모임이 성공적으로 진행된 상태입니다.
  - `FAILURE`: 모임이 실패로 기록된 상태입니다.
- 결과 입력 조건
  - 현재 사용자가 모임 개설자여야 합니다.
  - 모임 상태가 `COMPLETED`여야 합니다.
  - 결과 상태가 `NOT_RECORDED`여야 합니다.
  - 위 조건을 모두 만족할 때만 `성공`, `실패` 버튼을 보여줍니다.
- 결과 입력 요청
  - `POST /api/crews/{crewId}/meetings/{meetingId}/result`
  - body: `{ result: "SUCCESS" | "FAILURE" }`
  - 성공 시 별도 새로고침 없이 상세 화면의 `meeting.result`를 로컬에서 즉시 갱신합니다.
  - backend가 `MEETING_RESULT_ALREADY_RECORDED`, `MEETING_RESULT_RECORD_NOT_ALLOWED`를 주면 상세를 한 번 다시 읽어 실제 상태를 맞추고, 사용자 메시지를 함께 보여줍니다.
- 개설자 / 크루장 / 일반 참가자 분기
  - 개설자: `COMPLETED + NOT_RECORDED`에서만 입력 가능
  - 크루장: 결과 읽기만 가능, 입력 버튼 없음
  - 일반 참가자: 결과 읽기만 가능, 입력 버튼 없음
- 목록 / 상세 동기화
  - 상세는 로컬 상태 갱신으로 즉시 반영합니다.
  - 목록은 기존 `GET /api/crews/{crewId}/meetings` no-store 조회 흐름을 그대로 사용하므로 목록 화면 재진입 시 최신 결과를 다시 읽습니다.
- 접근 가드
  - guest / temp / 비가입자는 기존 내부 크루 접근 규칙을 그대로 재사용합니다.
  - `AUTH_ACCESS_DENIED`, `AUTH_UNAUTHENTICATED`면 `/crews/public/{crewId}` 공개 소개 흐름으로 돌려보냅니다.
- 범위 제한
  - 정산, 결과 재수정, richer record, 운영 히스토리는 이번 라운드에 포함하지 않습니다.

### Meeting Round 5 자동 검증

- `npm.cmd run test -- src/test/shared/meeting-client.test.tsx src/test/app/meeting-detail-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

모두 통과했습니다.

### Meeting Round 5 수동 검증

- 개설자 기준 `COMPLETED + NOT_RECORDED` 모임에서 `성공`, `실패` 입력이 가능한 것을 확인했습니다.
- 결과 입력 직후 상세 화면이 즉시 `SUCCESS` 또는 `FAILURE`로 갱신되는 것을 확인했습니다.
- 목록 화면으로 돌아갔을 때 같은 결과 상태가 최신으로 반영되는 것을 확인했습니다.
- 크루장과 일반 참가자는 결과를 읽을 수만 있고 입력 버튼은 보이지 않는 것을 확인했습니다.
- 비가입자, guest, temp 사용자는 기존 공개 소개 / 로그인 / completion 흐름으로 분기되는 것을 확인했습니다.

## Meeting Round 6 자동 상태 반영

- 목록과 상세는 모두 backend가 내려준 `status`를 source of truth로 그대로 사용합니다.
- 공통 상태 helper를 추가해서 `RECRUITING / RECRUITMENT_CLOSED / COMPLETED / CANCELED`를 같은 한국어 라벨로 보여줍니다.
  - `RECRUITING` -> `모집 중`
  - `RECRUITMENT_CLOSED` -> `모집 마감`
  - `COMPLETED` -> `모임 종료`
  - `CANCELED` -> `모임 취소`
- 자동 전이 이해를 돕는 최소 안내 문구를 추가했습니다.
  - `RECRUITING`: `참여를 받고 있는 모임 상태예요.`
  - `RECRUITMENT_CLOSED`: `정원 도달 또는 시작 시간이 지나 자동으로 모집이 마감될 수 있어요.`
  - `COMPLETED`: `시작 후 시간이 지나 자동으로 종료된 모임을 포함해요.`
  - `CANCELED`: `취소되어 더 이상 진행되지 않는 모임이에요.`
- 기존 참여하기 / 참여취소 / 운영 액션 / 결과 입력 흐름은 그대로 유지하고, 상태가 자동 전이되었을 때도 의미가 자연스럽게 읽히도록 노출만 보강했습니다.
- 프론트는 타이머를 돌리거나 상태를 계산하지 않습니다.

### Meeting Round 6 자동 검증

- `npm.cmd run test -- src/test/app/meeting-list-page.test.tsx src/test/app/meeting-detail-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

모두 통과했습니다.

### Meeting Round 6 수동 검증

- 목록과 상세에서 자동 전이된 상태가 같은 의미로 보이는 것을 확인했습니다.
- `RECRUITMENT_CLOSED`, `COMPLETED`, `CANCELED` 상태에 맞는 안내 문구가 보이는 것을 확인했습니다.
- 자동으로 모집이 마감된 상태에서 참여 액션이 어색하지 않게 정리된 것을 확인했습니다.
- 비가입자, guest, temp 사용자는 기존 공개 소개 / 로그인 / completion 흐름으로 분기되는 것을 확인했습니다.

## Meeting Round 7 모임 수정과 비용 안내 정합화

- `/crews/{crewId}/meetings/{meetingId}`
  - 모임 개설자이면서 상태가 `RECRUITING` 또는 `RECRUITMENT_CLOSED`일 때만 `모임 수정` 진입점을 보여줍니다.
  - `COMPLETED`, `CANCELED`에서는 수정 링크를 숨겨 수정 불가 상태를 그대로 읽게 합니다.
- `/crews/{crewId}/meetings/{meetingId}/edit`
  - 생성과 같은 의미의 입력 구조를 재사용합니다.
  - 수정 가능한 필드는 `제목`, `테마명`, `장소`, `날짜`, `시간`, `정원`, `비용 안내(총 비용)`, `설명`, `연락 링크`입니다.
  - 개설자가 아니거나 수정 불가 상태면 `이 모임은 지금 수정할 수 없습니다.` 안내만 보여주고 상세로 돌아가게 합니다.
- 수정 요청
  - `PATCH /api/crews/{crewId}/meetings/{meetingId}`
  - 성공 시 상세 화면으로 돌아가며 최신 값을 다시 읽습니다.
- 비용 안내 처리
  - 비용은 settlement가 아니라 meeting 안내 정보로 유지합니다.
  - 저장 필드는 `totalCost` 하나만 사용합니다.
  - 상세에서는 `총 비용 안내`와 `1인당 예상 비용(totalCost / capacity)`을 읽기 전용으로 보여줍니다.
  - 목록에서는 비용을 노출하지 않습니다.
- 목록 / 상세 동기화
  - 상세는 수정 후 상세 경로로 재진입해 최신 응답을 다시 읽습니다.
  - 목록은 기존 `GET /api/crews/{crewId}/meetings` no-store 조회 흐름을 그대로 사용하므로 재진입 시 최신 값이 반영됩니다.

### Meeting Round 7 자동 검증

- `npm.cmd run test -- src/test/shared/meeting-client.test.tsx src/test/app/meeting-create-page.test.tsx src/test/app/meeting-edit-page.test.tsx src/test/app/meeting-detail-page.test.tsx src/test/app/meeting-list-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Meeting Round 7 수동 검증

- 개설자만 `RECRUITING`, `RECRUITMENT_CLOSED` 상태 모임에서 `모임 수정` 진입점을 보는 것을 확인했습니다.
- 수정 화면에서 `제목`, `테마명`, `장소`, `날짜`, `시간`, `정원`, `비용 안내(총 비용)`, `설명`, `연락 링크`를 수정할 수 있는 것을 확인했습니다.
- 수정 성공 후 상세 화면에서 최신 값이 바로 반영되고, 목록 재진입 시 최신 meeting 정보가 보이는 것을 확인했습니다.
- `COMPLETED`, `CANCELED` 상태와 개설자 아님 케이스에서는 수정이 차단되는 것을 확인했습니다.
- 비가입자, guest, temp 사용자는 기존 공개 소개 / 로그인 / completion 흐름으로 분기되는 것을 확인했습니다.

## Crew Round 11A 크루 탈퇴

- `/crews/{crewId}`
  - 내부 허브의 `설정` 링크를 모든 가입 멤버에게 열었습니다.
  - 리더와 일반 멤버는 같은 settings 경로를 보되, 섹션별 권한만 다르게 보입니다.
- `/crews/{crewId}/settings`
  - 리더는 기존 `공개 범위 설정`을 계속 볼 수 있습니다.
  - 일반 멤버는 공개 범위 스위치는 보지 않고, 하단 `크루 탈퇴` 섹션만 봅니다.
  - 탈퇴 실행 전에는 브라우저 확인 모달로 한 번 더 확인합니다.
- 크루 탈퇴 요청
  - `POST /api/crews/{crewId}/leave`
  - 성공 시 `/`로 이동하고 홈에서 `크루를 탈퇴했습니다.` 피드백을 보여줍니다.
- 차단 안내
  - 크루장: `크루장은 위임 전 탈퇴할 수 없어요.`
  - 본인 생성 미완료 모임 존재:
    `진행 중이거나 모집 중인 내가 만든 모임이 있어 탈퇴할 수 없어요.`
- 접근 권한 회수
  - 탈퇴 후 내부 crew API 접근은 backend 멤버십 검사에 의해 즉시 막힙니다.
  - 뒤로가기로 내부 경로를 다시 열어도 기존 공개 소개 / 로그인 / completion 흐름으로 분기됩니다.

### Crew Round 11A 수동 검증

- 일반 크루원이 설정 화면에서 탈퇴 확인 모달을 거쳐 실제로 탈퇴되는 것을 확인했습니다.
- 탈퇴 성공 후 홈 `/`로 이동하고 `크루를 탈퇴했습니다.` 피드백이 노출되는 것을 확인했습니다.
- 탈퇴 직후 같은 크루 내부 경로로 다시 진입하면 공개 소개 흐름으로 분기되는 것을 확인했습니다.
- 크루장은 `크루장은 위임 전 탈퇴할 수 없어요.` 안내만 보고 탈퇴 버튼은 보이지 않는 것을 확인했습니다.
- 본인 생성 미완료 모임이 있는 일반 크루원은 `진행 중이거나 모집 중인 내가 만든 모임이 있어 탈퇴할 수 없어요.` 문구와 함께 차단되는 것을 확인했습니다.

## Crew Round 11B 크루장 위임

- `/crews/{crewId}/members`
  - 현재 크루장이 일반 크루원 항목마다 `크루장 위임` 액션을 볼 수 있습니다.
  - 버튼은 현재 사용자가 `LEADER`이고, 대상 항목의 역할이 `MEMBER`일 때만 노출됩니다.
- 위임 확인 흐름
  - 버튼 클릭 시 브라우저 확인 모달을 먼저 띄웁니다.
  - 확인 문구에는 `위임 후에는 크루 관리 권한이 즉시 새로운 크루장에게 넘어갑니다`가 포함됩니다.
- 위임 요청
  - `POST /api/crews/{crewId}/transfer-leadership`
  - body: `{ targetUserId }`
  - 성공 시 응답의 `leaderUserId`를 기준으로 현재 목록 역할을 로컬에서 즉시 갱신합니다.
- 성공 후 반영
  - 새 크루장은 즉시 `LEADER`
  - 기존 크루장은 즉시 `MEMBER`
  - 목록 상단에는 `크루장이 변경되었습니다` 배너를 짧게 노출합니다.
  - 기존 리더는 즉시 리더 전용 액션을 더 이상 보지 못합니다.
- 실패 안내
  - `CREW_TRANSFER_LEADERSHIP_TARGET_NOT_ALLOWED`는 `현재 일반 크루원에게만 크루장을 위임할 수 있어요.`로 번역해 보여줍니다.

### Crew Round 11B 자동 검증

- `npm.cmd run test -- src/test/shared/crew-client.test.tsx src/test/app/crew-members-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Crew Round 11B 수동 검증

- 현재 크루장이 일반 크루원 항목에서만 `크루장 위임` 버튼을 보는 것을 확인했습니다.
- 위임 확인 모달에 `위임 후에는 크루 관리 권한이 즉시 새로운 크루장에게 넘어갑니다` 문구가 포함되는 것을 확인했습니다.
- 위임 성공 직후 새 크루장이 `LEADER`, 기존 크루장이 `MEMBER`로 즉시 바뀌는 것을 확인했습니다.
- 목록 상단에 `크루장이 변경되었습니다` 배너가 노출되는 것을 확인했습니다.
- 위임 직후 기존 리더는 더 이상 리더 전용 액션을 보지 못하고, 새 리더는 리더 전용 액션을 보는 것을 확인했습니다.

## Crew Round 11C 멤버 강제 제거

- `/crews/{crewId}/members`
  - 현재 크루장만 일반 크루원 항목마다 `퇴출` 액션을 볼 수 있습니다.
  - `LEADER` 항목과 리더 본인 항목에는 `퇴출` 버튼이 보이지 않습니다.
- 퇴출 확인 흐름
  - `퇴출` 버튼 클릭 시 브라우저 확인 모달을 먼저 띄웁니다.
  - 확인 문구에는 아래 두 줄이 포함됩니다.
    - `이 사용자를 퇴출하면 해당 사용자가 맡은 진행 중 모임은 취소됩니다.`
    - `참여 중인 모임에서는 자동으로 제외됩니다.`
- 퇴출 요청
  - `POST /api/crews/{crewId}/members/{targetUserId}/remove`
  - 성공 시 응답의 `removedUserId`를 기준으로 현재 목록에서 대상을 즉시 제거합니다.
- 성공 후 반영
  - 목록 상단에 `크루원에서 제외했습니다` 배너를 짧게 노출합니다.
  - 제거된 대상은 현재 화면에서 바로 사라집니다.
  - 기존 접근 가드를 그대로 재사용하므로, 퇴출된 사용자는 이후 같은 크루의 내부 허브 / 멤버 / meeting 경로에 더 이상 접근하지 못합니다.
- 실패 안내
  - `CREW_MEMBER_REMOVE_TARGET_NOT_ALLOWED`는 `현재 일반 크루원만 퇴출할 수 있어요.`로 번역해 보여줍니다.
  - `AUTH_ACCESS_DENIED`는 `현재 크루장만 퇴출할 수 있어요.`로 안내합니다.

### Crew Round 11C 자동 검증

- `npm.cmd run test -- src/test/shared/crew-client.test.tsx src/test/app/crew-members-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Crew Round 11C 수동 검증

- 현재 크루장이 일반 크루원 항목에서만 `퇴출` 버튼을 보는 것을 확인했습니다.
- 확인 모달에 진행 중 모임 취소 / 참여 중 모임 자동 제외 문구가 포함되는 것을 확인했습니다.
- 퇴출 성공 직후 대상이 목록에서 즉시 사라지고 `크루원에서 제외했습니다` 배너가 보이는 것을 확인했습니다.
- 일반 크루원에게는 `퇴출` 버튼이 노출되지 않는 것을 확인했습니다.
- 퇴출된 사용자는 이후 내부 크루 허브와 같은 크루 meeting 경로에 더 이상 접근하지 못하는 것을 확인했습니다.

## Crew Round 11D 크루 삭제

- `/crews/{crewId}/settings`
  - 현재 크루장만 하단의 `크루 삭제` 위험 영역을 봅니다.
  - 일반 크루원은 기존 탈퇴 섹션만 보고, 크루 삭제 UI는 보지 않습니다.
- 삭제 확인 흐름
  - `현재 크루명` 입력란에 실제 크루명을 다시 입력해야만 `크루 삭제` 버튼이 활성화됩니다.
  - 삭제 버튼 클릭 시 브라우저 확인 모달로 한 번 더 확인합니다.
  - 화면에는 아래 안내를 항상 같이 보여줍니다.
    - `다른 크루원이 남아 있으면 삭제할 수 없어요`
    - `진행 중이거나 모집 중인 모임이 남아 있으면 삭제할 수 없어요`
- 크루 삭제 요청
  - `POST /api/crews/{crewId}/delete`
  - body: `{ crewName }`
  - 성공 시 `/`로 이동하고 홈에서 `크루를 삭제했습니다.` 피드백을 보여줍니다.
- 실패 안내
  - `CREW_DELETE_NOT_ALLOWED_WITH_ACTIVE_MEMBERS`
    - `다른 크루원이 남아 있어 삭제할 수 없어요`
  - `CREW_DELETE_NOT_ALLOWED_WITH_ACTIVE_MEETINGS`
    - `진행 중이거나 모집 중인 모임이 남아 있어 삭제할 수 없어요`
  - `CREW_DELETE_NAME_MISMATCH`
    - `크루명이 일치하지 않아요`
  - `AUTH_ACCESS_DENIED`
    - `현재 크루장만 삭제할 수 있어요.`
- 접근 권한 회수
  - 삭제 후에는 backend가 `DELETED` 크루를 일반 consumer에서 숨기므로, 내부 허브 / 공개 소개 / 멤버 목록 / 정책 화면 어디에서도 더 이상 살아있는 크루처럼 보이지 않습니다.

### Crew Round 11D 자동 검증

- `npm.cmd run test -- src/test/shared/crew-client.test.tsx src/test/app/crew-settings-page.test.tsx src/test/app/page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Crew Round 11D 수동 검증

- 현재 크루장이 settings 화면에서 크루명 재입력 후 삭제를 실행할 수 있는 것을 확인했습니다.
- 크루명 불일치 시 삭제 버튼이 활성화되지 않는 것을 확인했습니다.
- 다른 크루원이 남아 있거나 미완료 모임이 남아 있는 경우 자연스러운 차단 문구가 보이는 것을 확인했습니다.
- 삭제 성공 후 홈으로 이동하고 `크루를 삭제했습니다.` 피드백이 노출되는 것을 확인했습니다.
- 삭제 후 같은 크루의 내부 허브 / 공개 소개 / 멤버 / 정책 경로에 더 이상 접근되지 않는 것을 확인했습니다.

## Explore Round 01 탐색 메인 + 통합 검색 + 결과 목록

- `/explore`
  - 로그인 없이 접근 가능한 공개 탐색 메인 화면을 추가했습니다.
  - 검색어가 비어 있으면 첫 페이지의 전체 탐색 목록을 기본으로 보여줍니다.
  - 홈 `/`에서도 `Explore` 링크로 바로 진입할 수 있게 연결했습니다.
- 통합 검색
  - 하나의 검색 입력창에서 지역 / 매장명 / 테마명을 함께 찾도록 구성했습니다.
  - 입력 중에는 호출하지 않고, `검색` 버튼 또는 submit 시점에만 결과를 갱신합니다.
- 필터
  - `장르` 다중 선택 체크박스
  - `시/도` select
  - `구/군` select
  - 필터 변경은 즉시 결과에 반영되고, `시/도`가 바뀌면 `구/군`은 초기화됩니다.
- 결과 카드
  - 테마 카드 그리드로 노출합니다.
  - 카드에는 포스터, 테마명, 매장명, 지역 라벨, 장르, 난이도, 활동성, 권장 인원, 플레이 시간, 찜 수를 읽기 전용으로 표시합니다.
  - `posterImageUrl`, `difficulty`, `activityLabel`, `recommendedPlayers`, `runningTimeMinutes`가 비어 있을 때는 `정보 준비 중` / `포스터 준비 중` fallback UI를 보여줍니다.
  - 카드 클릭은 이번 라운드에서 비활성으로 두고, `상세는 준비 중입니다.` 안내만 노출합니다.
- infinite scroll
  - `pageInfo.hasNext`가 true인 동안 `IntersectionObserver` 기반으로 다음 페이지를 자동 로드합니다.
  - 이번 라운드 기본 `size`는 20으로 고정했습니다.
- 상태 처리
  - 초기 로딩, 추가 로딩, 빈 결과, 에러 상태를 각각 분리해 처리합니다.
  - 에러 시 `탐색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.` 문구를 보여줍니다.

### Explore Round 01 자동 검증

- `npm.cmd run test -- src/test/shared/explore-client.test.tsx src/test/app/explore-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Explore Round 01 수동 검증

- 로그인 없이 `/explore`에 접근 가능한 것을 확인했습니다.
- 검색어가 비어 있어도 전체 첫 페이지 결과가 기본 목록으로 보이는 것을 확인했습니다.
- 통합 검색이 지역 / 매장명 / 테마명 기준으로 submit 시점에만 동작하는 것을 확인했습니다.
- 장르 다중 선택, `시/도 -> 구/군` 필터가 정상 반영되고 `시/도` 변경 시 `구/군`이 초기화되는 것을 확인했습니다.
- 카드형 결과 목록과 포스터 / 메타 정보 fallback UI가 정상적으로 보이는 것을 확인했습니다.
- `pageInfo.hasNext` 기반 infinite scroll로 추가 결과가 자연스럽게 이어지는 것을 확인했습니다.
- 빈 결과, 로딩, 에러 상태 문구가 깨지지 않는 것을 확인했습니다.
- 홈 `/`에서 영어/기술용 링크를 제거하고 `로그인`, `탐색하기`, `공개 크루 둘러보기`만 남긴 공개 진입 구성이 잘 보이는 것을 확인했습니다.

## Explore Round 02A 테마 상세 조회

- `/explore/themes/{themeId}`
  - 탐색 결과 카드에서 공개 테마 상세로 이동할 수 있게 연결했습니다.
  - 로그인 없이 접근 가능한 공개 상세 화면을 추가했습니다.
- 상세 화면
  - 포스터, 테마명, 매장명, 지역, 장르, 난이도, 플레이 시간을 표시합니다.
  - 포스터가 없으면 `포스터 준비 중` fallback UI를 보여줍니다.
  - 소개글이 없으면 `등록된 설명이 없습니다.` 문구를 보여줍니다.
  - 소개글이 길면 기본 축약 상태로 보여주고 `더보기` / `접기`로 확장할 수 있습니다.
  - `externalLink`가 있으면 `외부 예약 페이지 열기` 링크를 새 탭으로 엽니다.
- 같은 매장의 다른 테마
  - 상세 응답의 `relatedThemes`를 최대 4개까지 카드형으로 노출합니다.
  - 추천 카드도 같은 상세 라우트로 다시 이동할 수 있습니다.
  - 추천 테마가 없으면 `같은 매장의 다른 테마가 아직 없어요.` 문구를 보여줍니다.
- fallback 처리
  - `posterImageUrl`, `description`, `externalLink`가 비어 있어도 화면이 깨지지 않게 처리했습니다.
  - 난이도, 장르, 플레이 시간 같은 메타 정보가 비어 있으면 `정보 준비 중` 문구를 보여줍니다.

### Explore Round 02A 자동 검증

- `npm.cmd run test -- src/test/shared/explore-client.test.tsx src/test/app/explore-page.test.tsx src/test/app/explore-theme-detail-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Explore Round 02A 수동 검증

- 로그인 없이 `/explore`에서 결과 카드 클릭 후 `/explore/themes/{themeId}` 공개 상세로 정상 이동하는 것을 확인했습니다.
- 상세에서 포스터, 테마명, 매장명, 지역, 장르, 난이도, 플레이 시간이 자연스럽게 보이는 것을 확인했습니다.
- 긴 소개글에서 `더보기` / `접기`가 정상 동작하는 것을 확인했습니다.
- `externalLink`가 있는 경우 `외부 예약 페이지 열기`가 새 탭으로 열리는 것을 확인했습니다.
- 같은 매장의 다른 테마가 최대 4개까지 노출되고, 추천 카드 클릭 시 해당 상세로 다시 이동하는 것을 확인했습니다.
- 포스터, 소개글, 외부 링크, 메타 정보가 비어 있을 때 fallback UI가 깨지지 않는 것을 확인했습니다.

## Explore Round 02B 탐색 상세에서 모임 생성 연결

- `/explore/themes/{themeId}`
  - 공개 상세에서 `이 테마로 모임 만들기` 버튼을 활성화했습니다.
  - 버튼 클릭 시 먼저 `GET /api/explore/meeting-create/crews`를 호출해 현재 로그인 사용자의 소속 크루 목록을 읽습니다.
  - 비로그인 사용자는 `/login`으로 이동합니다.
  - 소속 크루가 없으면 `먼저 크루를 만들거나 가입해야 모임을 만들 수 있어요.` 안내만 보여주고 생성으로 진행하지 않습니다.
- 크루 선택 단계
  - 소속 크루가 1개여도 항상 선택 단계를 보여줍니다.
  - 라디오 목록에서 크루를 고른 뒤 `선택한 크루로 모임 만들기`를 눌러 다음 단계로 이동합니다.
- 모임 생성 자동 채움
  - 탐색 상세 응답에서 `themeName`, `storeName`, `regionLabel`, `genre`, `difficulty`, `runningTimeMinutes`를 추출해 query string으로 전달합니다.
  - `/crews/{crewId}/meetings/new`에서는 이 값을 기본값으로만 채우고, 사용자는 여전히 수정할 수 있습니다.
  - 자동 채움 규칙:
    - `테마명` <- `themeName`
    - `장소` <- `regionLabel · storeName`
    - `설명` <- 매장 / 지역 / 장르 / 난이도 / 플레이 시간을 줄바꿈 요약으로 구성
- 범위 제한
  - 이번 라운드는 탐색 상세에서 모임 생성 연결까지만 엽니다.
  - 로그인 후 자동 복귀, 찜 토글, 리뷰/기록, 추천 고도화는 아직 열지 않습니다.

### Explore Round 02B 자동 검증

- `npm.cmd run test -- src/test/shared/explore-client.test.tsx src/test/app/explore-theme-detail-page.test.tsx src/test/app/meeting-create-page.test.tsx`
- `npm.cmd run test -- src/test/shared/explore-client.test.tsx src/test/app/explore-page.test.tsx src/test/app/explore-theme-detail-page.test.tsx src/test/app/meeting-create-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run build`

- 모두 통과했습니다.

### Explore Round 02B 수동 검증

- 로그인 사용자가 공개 테마 상세의 `이 테마로 모임 만들기`를 눌렀을 때 먼저 크루 선택 단계를 보는 것을 확인했습니다.
- 소속 크루가 1개여도 선택 단계를 유지하고, 선택 후 `/crews/{crewId}/meetings/new`로 이동하는 것을 확인했습니다.
- 탐색 상세의 `themeName`, `storeName`, `regionLabel`, `genre`, `difficulty`, `runningTimeMinutes`가 모임 생성 기본값으로 자동 채워지는 것을 확인했습니다.
- 생성 화면에서 자동 채움 값이 기본값일 뿐, 사용자가 직접 수정 가능한 것을 확인했습니다.
- 비로그인 사용자는 `/login`으로 이동하고, 소속 크루가 없는 사용자는 `먼저 크루를 만들거나 가입해야 모임을 만들 수 있어요.` 안내만 보는 것을 확인했습니다.

## Gallery / Log Round 01 완료된 모임 아카이브 입구

- `/archive/meetings`
  - 로그인 사용자 전용 `완료된 모임 아카이브` 화면을 추가했습니다.
  - `GET /api/archive/meetings`를 `page`, `size` 기준으로 연결했습니다.
  - 비로그인 사용자는 `/login?redirectTo=/archive/meetings`로 이동합니다.
- 아카이브 화면
  - 본인과 관련된 `COMPLETED` 모임을 카드형 목록으로 보여줍니다.
  - 카드에는 대표 이미지 또는 placeholder, 테마명, 크루명, 장소, 날짜, 결과를 표시합니다.
  - CTA는 이번 라운드에서 실제 로그 작성으로 연결하지 않고 `기록 준비중` 비활성 버튼으로만 노출합니다.
  - 보조 링크로 기존 meeting 상세를 다시 볼 수 있도록 `모임 다시 보기`를 제공합니다.
- fallback / 상태 처리
  - `posterImageUrl`가 없으면 `대표 이미지 준비 중` placeholder UI를 보여줍니다.
  - 초기 로딩, 추가 로딩, 빈 상태, 에러 상태를 각각 분리해 처리합니다.
  - 빈 상태 문구는 `아직 완료된 모임 기록이 없어요`를 사용합니다.
  - 에러 문구는 `아카이브 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.`를 사용합니다.
- 추가 로딩
  - 이번 라운드는 `pageInfo.hasNext` 기반 `더 보기` 버튼으로 다음 페이지를 불러옵니다.
  - 기본 `size`는 20으로 고정했습니다.

### Gallery / Log Round 01 자동 검증

- `npm.cmd run test -- src/test/shared/archive-client.test.tsx src/test/app/archive-meetings-page.test.tsx src/test/app/page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Gallery / Log Round 01 수동 검증

- 로그인 사용자가 `/archive/meetings`에 접근해 완료된 모임 아카이브 목록을 볼 수 있는 것을 확인했습니다.
- 카드에 대표 이미지 또는 placeholder, 테마명, 크루명, 장소, 날짜, 결과가 자연스럽게 보이는 것을 확인했습니다.
- `posterImageUrl`가 없는 경우 `대표 이미지 준비 중` fallback UI가 깨지지 않는 것을 확인했습니다.
- `더 보기` 버튼으로 `pageInfo.hasNext` 기반 추가 로딩이 동작하는 것을 확인했습니다.
- 빈 상태, 로딩 상태, 에러 상태 문구가 깨지지 않는 것을 확인했습니다.
- CTA는 `기록 준비중`으로만 노출되고, 실제 로그 작성 / 수정 / 삭제로 확장되지 않는 것을 확인했습니다.

## Gallery / Log Round 02 방탈로그 작성 / 수정 / 삭제

- `/crews/{crewId}/meetings/{meetingId}/log`
  - 완료된 모임의 host 또는 `JOINED` / `PENDING` / `APPROVED` 참여 이력이 있는 사용자만 방탈로그를 작성할 수 있도록 연결했습니다.
  - `GET /api/meetings/{meetingId}/logs/me`의 `status`를 source of truth로 사용합니다.
    - `EXISTS`: 기존 로그 수정 모드
    - `NOT_WRITTEN`: 새 작성 모드
    - `DELETED_BLOCKED`: 재작성 차단 안내
  - 이미 내 로그가 있으면 `logs/me` 응답의 본문과 사진 메타데이터를 그대로 사용해 수정 모드로 진입합니다.
- meeting 상세 / archive CTA
  - meeting 상세에서는 완료된 모임 기준으로 내 로그가 없으면 `방탈로그 작성하기`, 있으면 `방탈로그 수정하기` 링크를 노출합니다.
  - archive 카드에서는 `방탈로그 작성·수정` 링크로 같은 경로를 재사용합니다.
- 작성 / 수정 공용 폼
  - 본문은 필수이며 최대 1000자 제한과 현재 글자 수를 함께 보여줍니다.
  - 사진은 파일 선택 UI로 받고, 선택 직후 `POST /api/uploads/log-photos`를 호출합니다.
  - 업로드가 끝난 사진만 `photos[{ url, sizeBytes }]`로 저장 / 수정 payload에 포함합니다.
  - 사진 제약:
    - 최대 5장
    - `jpg` / `jpeg` / `png`
    - 한 장당 5MB 이하
- 저장 / 삭제 후 흐름
  - 저장 / 수정 성공 시 `/crews/{crewId}/logs/{logId}` 상세 화면으로 이동합니다.
  - 삭제 성공 시 같은 편집 화면에서 다시 작성 가능한 create 상태로 돌아갑니다.
- `/crews/{crewId}/logs/{logId}`
  - meeting 제목, 테마명, 장소, 날짜, 작성자 닉네임, 작성/수정 시각, 본문, 사진 목록을 읽기 전용으로 보여줍니다.
  - 사진이 없으면 `등록된 사진이 없어요.` fallback 문구를 보여줍니다.
- 범위 제한
  - 이번 라운드는 작성 / 수정 / 삭제 / 상세 조회까지만 엽니다.
  - 리더 운영 삭제, 알림, 댓글, 좋아요, 전체 피드 고도화는 아직 열지 않습니다.

### Gallery / Log Round 02 자동 검증

- `npm.cmd run test -- src/test/shared/log-client.test.tsx src/test/app/meeting-log-editor-page.test.tsx src/test/app/log-detail-page.test.tsx src/test/app/meeting-detail-page.test.tsx src/test/app/archive-meetings-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Gallery / Log Round 02 수동 검증

- 완료된 모임 참여자가 meeting 상세와 archive에서 방탈로그 작성 / 수정 진입을 할 수 있는 것을 확인했습니다.
- 한 참여자가 같은 meeting에 로그 1개만 작성하고, 저장 / 수정 후 `/crews/{crewId}/logs/{logId}` 상세 화면으로 이동하는 것을 확인했습니다.
- 작성자 본인만 수정 / 삭제할 수 있고, 삭제 후에는 backend 상태값에 따라 재작성 불가가 유지되는 것을 확인했습니다.
- 사진은 파일 선택 후 업로드되고, 업로드가 끝난 사진만 저장되는 것을 확인했습니다.
- 사진 개수 / 확장자 / 용량 제약이 UI에서도 동작하는 것을 확인했습니다.
- 사진이 없는 상세 fallback, 비로그인 / 비멤버 차단, 미완료 모임 작성 차단이 깨지지 않는 것을 확인했습니다.

### Gallery / Log Round 02 정합성 보정 메모

- backend 현재 계약 기준으로 로그 상세 응답의 `photos`는 `string[]`로 소비합니다.
- editor 내부에서는 기존 사진과 새 업로드 사진을 분리 관리합니다.
  - 기존 사진: `kind: "existing", url`
  - 새 업로드 사진: `kind: "uploaded", url, sizeBytes`
- 수정 저장 시 기존 사진은 유실을 막기 위해 프론트 호환용 `sizeBytes: 1`을 채워 payload에 다시 포함합니다.
- 이 값은 backend 상세 응답과 수정 payload shape 차이를 메우기 위한 임시 workaround입니다.

## Gallery / Log Round 03 방탈로그 피드 / 소비 화면 고도화

- `/crews/{crewId}/logs`
  - 로그인한 현재 크루 ACTIVE 멤버만 접근할 수 있는 크루별 방탈로그 피드 화면을 추가했습니다.
  - `GET /api/crews/{crewId}/logs`를 `page`, `size` 기준으로 연결했습니다.
  - 비로그인 사용자는 `/login?redirectTo=/crews/{crewId}/logs`로 이동합니다.
  - 크루원이 아닌 사용자는 `/crews/public/{crewId}`로 되돌립니다.
- 피드 화면
  - 최신 작성순 카드형 목록으로 방탈로그를 보여줍니다.
  - 카드에는 대표사진 또는 placeholder, 후기 요약, 작성자 닉네임, 모임 제목, 테마명, 날짜, 기록 시간, 사진 개수를 표시합니다.
  - `coverPhotoUrl`이 없으면 `대표 사진 준비 중` fallback UI를 보여줍니다.
  - 카드를 누르면 기존 `/crews/{crewId}/logs/{logId}` 상세 화면으로 이동합니다.
- 추가 로딩
  - 이번 라운드는 `pageInfo.hasNext` 기반 `더 보기` 버튼으로 다음 페이지를 불러옵니다.
  - 기본 `size`는 20으로 고정했습니다.
- 범위 제한
  - 이번 라운드는 피드형 목록과 읽기 소비 화면까지만 엽니다.
  - 작성/수정/삭제, 운영 삭제, 알림 연동, 댓글/좋아요는 아직 열지 않습니다.

### Gallery / Log Round 03 자동 검증

- `npm.cmd run test -- src/test/shared/log-client.test.tsx src/test/app/crew-page.test.tsx src/test/app/crew-log-feed-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

### Gallery / Log Round 03 수동 검증

- 로그인한 ACTIVE 크루원으로 `/crews/{crewId}/logs`에 진입했을 때 피드 화면이 정상적으로 열리는 것을 확인했습니다.
- 카드에 대표사진 또는 placeholder, 후기 요약, 작성자 닉네임, 모임 제목, 테마명, 날짜, 작성 시각, 사진 개수가 표시되는 것을 확인했습니다.
- `coverPhotoUrl`이 없는 카드에서 `대표 사진 준비 중` fallback UI가 보이는 것을 확인했습니다.
- `더 보기` 버튼으로 다음 페이지를 이어서 불러올 수 있고, 마지막 페이지에서는 `여기까지 모두 읽었어요.` 문구가 보이는 것을 확인했습니다.
- 카드 클릭 시 기존 `/crews/{crewId}/logs/{logId}` 상세 화면으로 정상 이동하는 것을 확인했습니다.
- 비로그인 사용자는 로그인 유도 흐름으로, 크루원이 아닌 사용자는 `/crews/public/{crewId}`로 분기되는 것을 확인했습니다.
- 크루 허브 내비게이션의 `방탈로그` 링크로 피드 화면에 진입할 수 있는 것을 확인했습니다.
- 작성/수정/삭제, 운영 삭제, 알림, 댓글, 좋아요 UI가 노출되지 않는 것을 확인했습니다.

## Gallery / Log Round 04 크루 내부 방탈로그 피드 + 상세 읽기

- `/crews/{crewId}/logs`
  - 로그인한 현재 크루 ACTIVE 멤버만 접근할 수 있는 크루 내부 방탈로그 피드 화면을 유지합니다.
  - `GET /api/crews/{crewId}/logs`를 `page`, `size` 기준으로 연결합니다.
  - 카드에는 대표사진 또는 placeholder, 후기 요약, 작성자 닉네임, 모임 제목, 모임 날짜, 기록 시간, 추가 사진 수를 표시합니다.
  - 카드를 누르면 crew-scoped 상세 `/crews/{crewId}/logs/{logId}`로 이동합니다.
- `/crews/{crewId}/logs/{logId}`
  - `GET /api/crews/{crewId}/logs/{logId}`를 사용해 크루 문맥 안에서 방탈로그를 읽습니다.
  - 작성자 닉네임, 모임 제목, 테마명, 장소, 날짜, 기록 시간, 수정 시간, 후기 본문 전체를 읽을 수 있습니다.
  - 사진이 있으면 기본 3장 미리보기, 가로 스크롤, 클릭 라이트박스, 좌우 이동, `현재 / 전체` 표시를 제공합니다.
  - 사진이 없으면 사진 영역은 숨깁니다.
- fallback / 상태 처리
  - 피드 로딩: `크루 방탈로그 피드를 불러오는 중입니다.`
  - 피드 빈 상태: `아직 등록된 방탈로그가 없어요.`
  - 피드 에러: `크루 방탈로그 피드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.`
  - 대표 사진 없음: `대표 사진 준비 중`
  - 후기 요약 없음: `후기 요약이 아직 없습니다.`
- 추가 로딩
  - `pageInfo.hasNext` 기반 `더 보기` 버튼으로 다음 페이지를 불러옵니다.
  - 기본 `size`는 20으로 고정합니다.
- 범위 제한
  - 이번 라운드는 목록 피드 + 상세 읽기까지만 엽니다.
  - 작성/수정/삭제 신규 확장, 운영 삭제, 삭제 사유, 알림, 댓글, 좋아요는 아직 열지 않습니다.

### Gallery / Log Round 04 자동 검증

- `npm.cmd run test -- src/test/shared/log-client.test.tsx src/test/app/crew-log-feed-page.test.tsx src/test/app/log-detail-page.test.tsx`
- `npm.cmd run test -- src/test/shared/log-client.test.tsx src/test/app/meeting-log-editor-page.test.tsx src/test/app/log-detail-page.test.tsx src/test/app/crew-log-feed-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

### Gallery / Log Round 04 수동 검증

- 로그인한 ACTIVE 크루원으로 `/crews/{crewId}/logs`에 진입했을 때 피드 화면이 정상적으로 열리는 것을 확인했습니다.
- 카드에 대표 사진 또는 placeholder, 후기 요약, 작성자 닉네임, 모임 제목, 모임 날짜, 기록 시간, 추가 사진 수가 표시되는 것을 확인했습니다.
- `coverPhotoUrl`이 없는 카드에서 `대표 사진 준비 중` fallback UI가 보이는 것을 확인했습니다.
- 카드 클릭 시 `/crews/{crewId}/logs/{logId}` 상세로 이동하는 것을 확인했습니다.
- 상세에서 작성자 닉네임, 모임 제목, 모임 날짜, 기록 시간, 후기 본문 전체, 사진 목록이 정상적으로 보이는 것을 확인했습니다.
- 사진이 있는 로그에서 3장 미리보기, 가로 스크롤, 클릭 라이트박스, 좌우 이동, `현재 / 전체` 표시가 동작하는 것을 확인했습니다.
- 사진이 없는 로그에서는 사진 영역이 숨겨지는 것을 확인했습니다.
- `더 보기` 버튼으로 다음 페이지를 이어서 불러올 수 있고, 마지막 페이지에서 `여기까지 모두 읽었어요.` 문구가 보이는 것을 확인했습니다.
- 비로그인 사용자는 로그인 유도 흐름으로, 크루원이 아닌 사용자는 `/crews/public/{crewId}`로 분기되는 것을 확인했습니다.
- 작성 / 수정 / 삭제 신규 확장, 운영 삭제, 알림, 댓글, 좋아요 UI가 노출되지 않는 것을 확인했습니다.

## Gallery / Log Round 05 작성자 삭제 + 크루장 운영 삭제

- `/crews/{crewId}/logs/{logId}`
  - 로그 상세 화면에 삭제 진입점을 추가합니다.
  - 작성자 본인은 단순 확인 모달로 자기 로그를 삭제할 수 있습니다.
  - 현재 크루 리더가 작성자가 아닐 때는 운영 삭제 모달을 통해 다른 크루원 로그를 삭제할 수 있습니다.
  - 크루장 운영 삭제는 `deleteReason` 입력이 필수입니다.
- 삭제 API
  - `DELETE /api/crews/{crewId}/logs/{logId}`를 사용합니다.
  - 요청 body는 `{ deleteReason }` 형식입니다.
  - 작성자 본인 삭제는 `deleteReason` 없이 호출하고, 크루장 삭제는 입력값을 함께 보냅니다.
- 삭제 성공 후 흐름
  - 삭제 성공 시 상세 화면에 남지 않고 `/crews/{crewId}/logs?notice=...` 피드로 이동합니다.
  - 피드에서는 `방탈로그를 삭제했어요.` 안내 문구만 짧게 보여줍니다.
- 삭제 후 재작성 불가 정책
  - frontend는 더 이상 `sessionStorage` workaround를 쓰지 않습니다.
  - `GET /api/meetings/{meetingId}/logs/me`의 상태값을 그대로 사용합니다.
    - `EXISTS`: 보기 / 수정 유지
    - `NOT_WRITTEN`: 작성하기 노출
    - `DELETED_BLOCKED`: 작성 CTA 숨김 + 재작성 불가 안내
  - 표시 문구:
    - meeting 상세: `삭제된 방탈로그가 있어 다시 작성할 수 없어요.`
- 범위 제한
  - 이번 라운드는 삭제만 다룹니다.
  - 작성/수정/읽기 기본 흐름은 유지하고, 알림 연동, 댓글/좋아요, 신고는 열지 않습니다.

### Gallery / Log Round 05 자동 검증

- `npm.cmd run test -- src/test/shared/log-client.test.tsx src/test/app/log-detail-page.test.tsx src/test/app/meeting-log-editor-page.test.tsx src/test/app/meeting-detail-page.test.tsx src/test/app/archive-meetings-page.test.tsx src/test/app/crew-log-feed-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

### Gallery / Log Round 05 수동 검증

- 작성자 본인으로 crew-scoped 로그 상세에 진입했을 때 `삭제` 버튼이 보이고, 확인 후 삭제 성공 시 크루 로그 피드로 이동하는 것을 확인했습니다.
- 크루장으로 다른 크루원 로그 상세에 진입했을 때 `삭제` 버튼이 보이고, 삭제 사유를 입력해야만 운영 삭제가 가능한 것을 확인했습니다.
- 일반 크루원은 다른 사람 로그 상세에서 삭제 버튼을 볼 수 없는 것을 확인했습니다.
- 삭제 성공 후 피드에서 `방탈로그를 삭제했어요.` 안내 문구가 보이는 것을 확인했습니다.
- `NOT_WRITTEN`, `EXISTS`, `DELETED_BLOCKED` 상태에 따라 meeting 상세와 log editor가 정확히 분기되는 것을 확인했습니다.
- 삭제가 발생한 같은 세션뿐 아니라 새로고침과 브라우저 재시작 이후에도 `DELETED_BLOCKED` 상태가 유지되고, meeting 상세와 editor에서 재작성 CTA가 다시 열리지 않는 것을 확인했습니다.
- 알림 연동, 댓글/좋아요, 신고 UI가 노출되지 않는 것을 확인했습니다.

## Gallery / Log Round 06 크루 사진첩 목록 카드 + 더보기

- `/crews/{crewId}/gallery`
  - 로그인한 현재 크루 ACTIVE 멤버만 접근할 수 있는 크루 내부 사진첩 목록 화면을 추가했습니다.
  - `GET /api/crews/{crewId}/gallery`를 `page`, `size` 기준으로 연결합니다.
  - 비로그인 / completion-required 사용자는 기존 보호 라우트 흐름으로, 크루원이 아닌 사용자는 `/crews/public/{crewId}`로 되돌립니다.
- 카드 구성
  - 카드 1개는 완료된 모임 1개입니다.
  - 카드에는 대표사진 또는 placeholder, 모임 날짜, 모임 제목을 표시합니다.
  - `extraPhotoCount > 0`일 때만 `+ n장` 배지를 노출합니다.
  - 카드 클릭 상세는 이번 라운드에서 열지 않습니다.
- fallback / 상태 처리
  - `coverPhotoUrl`이 `null`이거나 이미지 로드 실패가 나면 `대표 사진 준비 중` placeholder를 보여줍니다.
  - 빈 상태 문구는 `아직 사진이 없네요.`를 사용합니다.
  - 로딩 문구는 `크루 사진첩을 불러오는 중입니다.`
  - 에러 문구는 `크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.`
- 추가 로딩
  - `pageInfo.hasNext` 기반 `더 보기` 버튼으로 다음 페이지를 불러옵니다.
  - 기본 `size`는 20이고, `meetingId` 기준으로 중복 없이 병합합니다.
  - `더 보기` 요청이 실패해도 이미 불러온 카드 목록은 유지하고, 에러 문구만 보조적으로 노출합니다.

### Gallery / Log Round 06 자동 검증

- `npm.cmd run test -- src/test/shared/gallery-client.test.tsx src/test/app/crew-gallery-page.test.tsx src/test/app/crew-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Gallery / Log Round 06 수동 검증

- 로그인한 ACTIVE 크루원으로 `/crews/{crewId}/gallery`에 진입했을 때 `크루 사진첩` 화면이 정상적으로 열리는 것을 확인했습니다.
- 사진이 등록된 완료된 모임만 카드형 목록으로 보이는 것을 확인했고, 카드 1개가 완료된 모임 1개에 대응하는 것을 확인했습니다.
- `coverPhotoUrl`이 있는 카드에서는 대표사진이 정상 표시되고, `coverPhotoUrl`이 없거나 로드가 실패한 카드에서는 `대표 사진 준비 중` placeholder가 보이는 것을 확인했습니다.
- `extraPhotoCount > 0`일 때만 `+ n장` 배지가 보이고, `0`이면 배지가 숨겨지는 것을 확인했습니다.
- 카드에 모임 날짜와 모임 제목이 자연스럽게 보이는 것을 확인했고, 이번 라운드에서는 카드 클릭 상세가 열리지 않는 것을 확인했습니다.
- `더 보기` 버튼으로 다음 페이지를 이어서 불러올 수 있고, 마지막 페이지에서 `여기까지 모두 확인했어요.` 문구가 보이는 것을 확인했습니다.
- `더 보기` 요청이 실패하더라도 이미 불러온 카드 목록은 유지되고, 에러 문구만 추가로 보이는 것을 확인했습니다.
- 사진이 없는 크루에서는 `아직 사진이 없네요.` 빈 상태가 보이고, API 장애 시에도 에러 문구만 노출되며 화면이 깨지지 않는 것을 확인했습니다.
- 비로그인 사용자는 로그인 유도 흐름으로, 크루원이 아닌 사용자는 `/crews/public/{crewId}`로 분기되는 것을 확인했습니다.
- 크루 허브의 `사진첩` 링크를 통해 사진첩 화면으로 진입할 수 있는 것을 확인했습니다.

## Gallery / Log Round 07 크루 사진첩 모달 상세 + 라이트박스

- `/crews/{crewId}/gallery`
  - Round 06 목록 화면 위에 카드 클릭 기반 모달 상세를 추가했습니다.
  - 카드 클릭 시 `GET /api/crews/{crewId}/gallery/{meetingId}`를 호출해 해당 완료 모임의 사진 배열을 읽습니다.
  - 목록 상태, `더보기`로 쌓인 카드, 현재 스크롤 위치를 유지한 채 상세를 읽습니다.
- 모달 상세
  - 모달 상단에는 모임 날짜, 모임 제목, 닫기 버튼을 표시합니다.
  - 본문 영역은 3열 썸네일 그리드로 구성합니다.
  - 개별 사진 로드 실패 시 해당 썸네일만 `n번 사진을 불러올 수 없어요.` placeholder로 대체합니다.
  - 상세 API 실패 시 모달 안에 에러 문구만 표시하고 목록 카드는 그대로 유지합니다.
- 라이트박스
  - 썸네일 클릭 시 큰 사진 보기 라이트박스를 엽니다.
  - 이전/다음 버튼으로 사진을 이동할 수 있습니다.
  - 모바일 스와이프도 지원합니다.
  - 상단에 `1 / n` 형식의 현재 위치를 표시합니다.
  - 라이트박스에서 특정 사진 로드가 실패해도 전체 overlay는 유지하고 placeholder만 보여줍니다.
- fallback / 상태 처리
  - 목록의 대표사진 fallback과 `더보기` 실패 시 기존 카드 유지 규칙은 그대로 유지합니다.
  - 사진이 없는 모임은 목록 자체에 나오지 않으며, 상세 대상 판단도 backend 응답을 그대로 따릅니다.

### Gallery / Log Round 07 자동 검증

- `npm.cmd run test -- src/test/shared/gallery-client.test.tsx src/test/app/crew-gallery-page.test.tsx`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

- 모두 통과했습니다.

### Gallery / Log Round 07 수동 검증

- 로그인한 ACTIVE 크루원으로 `/crews/{crewId}/gallery`에 진입했을 때 기존 목록이 정상적으로 열리고, 이미 불러온 카드 목록이 유지되는 것을 확인했습니다.
- 카드 클릭 시 새 페이지 이동 없이 같은 화면 위에 모달 상세가 열리고, 상단에 모임 날짜, 모임 제목, 닫기 버튼이 보이는 것을 확인했습니다.
- 모달 본문에서 3열 썸네일 그리드가 보이고, 썸네일 클릭 시 라이트박스가 열리는 것을 확인했습니다.
- 라이트박스에서 큰 사진 보기, 이전/다음 버튼, 모바일 스와이프, `1 / n` 표시가 정상 동작하는 것을 확인했습니다.
- 특정 이미지 로드 실패 상황에서도 해당 셀 또는 라이트박스 사진만 placeholder로 대체되고, 전체 모달/라이트박스는 유지되는 것을 확인했습니다.
- 모달 상세 API 실패 시 모달 안에만 에러 문구가 보이고, 배경 목록 카드는 그대로 유지되는 것을 확인했습니다.
- 모달을 닫은 뒤에도 기존 카드 목록, `더보기`로 쌓인 상태, 스크롤 위치가 그대로 유지되는 것을 확인했습니다.
- `더보기` 실패 시에도 이미 불러온 카드가 사라지지 않고 에러 문구만 추가로 보이는 것을 다시 확인했습니다.
- 비로그인 사용자는 로그인 유도 흐름으로, 크루원이 아닌 사용자는 `/crews/public/{crewId}`로 분기되는 것을 확인했습니다.
- 업로드/삭제/순서 변경 UI가 열리지 않고, 이번 라운드는 읽기 전용 모달 상세와 라이트박스까지만 동작하는 것을 확인했습니다.



