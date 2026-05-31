# Vietnamese UI design

## Goal

Localize the web frontend UI to Vietnamese while preserving the current gameplay, routes, API contracts, and visual style.

## Scope

In scope:

- User-visible English text in `apps/web/src`.
- Landing, create-room, host dashboard, player room, shared UI components, and frontend metadata text.
- Static labels, headings, helper text, button text, empty states, loading states, and frontend-only error/fallback copy.

Out of scope:

- Server/API/socket response messages.
- Shared validation schema messages.
- Route names, event names, localStorage keys, API payload fields, or game logic.
- Adding an i18n framework, locale routing, or translation dictionaries.

## Approach

Translate strings directly in the existing React/Next.js files. Use natural Vietnamese copy that matches the current playful pixel/game-show tone. Keep copy concise so existing layouts do not need structural changes.

Do not introduce new abstractions for localization. The app does not currently have a multi-language requirement, so direct translation keeps the change small and low-risk.

## Files likely affected

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/create/CreateRoomClient.tsx`
- `apps/web/src/app/host/[roomCode]/HostRoomClient.tsx`
- `apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx`
- `apps/web/src/components/BingoBoard.tsx`
- `apps/web/src/components/CalledItemCard.tsx`
- `apps/web/src/components/PixelUi.tsx` if it contains visible copy

## Verification

- Search `apps/web/src` for remaining obvious English UI strings.
- Run the web typecheck and lint commands if available.
- For UI verification, run the app and inspect the main flows in a browser if the local dev environment starts successfully.

## Success criteria

- The frontend UI reads as Vietnamese for end users.
- No gameplay behavior changes.
- No new localization framework or dictionary is added.
- Server/API/socket messages remain unchanged unless surfaced as existing frontend text.
