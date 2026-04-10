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

