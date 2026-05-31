# Vietnamese UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the web frontend's user-visible UI text to Vietnamese without changing gameplay behavior.

**Architecture:** This is a direct-copy localization pass over existing React/Next.js components in `apps/web/src`. No i18n framework or dictionary is introduced; only static/frontend fallback strings and metadata are translated. API contracts, socket events, localStorage keys, route names, and server-returned messages stay unchanged.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Socket.IO client.

---

## File Structure

Modify only existing frontend files:

- `apps/web/src/app/layout.tsx`: update HTML language and metadata copy.
- `apps/web/src/app/page.tsx`: translate landing page hero, CTAs, and how-to-play copy.
- `apps/web/src/app/create/CreateRoomClient.tsx`: translate create-room form labels, helper text, status messages, and fallback errors.
- `apps/web/src/app/host/[roomCode]/HostRoomClient.tsx`: translate host dashboard labels, controls, invite panel, player presence, winner states, and fallback errors.
- `apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx`: translate join screen, status badges, player controls, called-item panel, winner popup, and fallback errors.
- `apps/web/src/components/BingoBoard.tsx`: translate visible free-cell text and image alt fallback.
- `apps/web/src/components/CalledItemCard.tsx`: translate called-item labels, empty text, image text, and image alt fallback.
- `apps/web/src/lib/api.ts`: translate frontend fallback request error used when non-JSON errors occur.

No new files are required.

---

### Task 1: Translate root metadata and landing page

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Update root metadata and language**

In `apps/web/src/app/layout.tsx`, make these exact text changes:

```tsx
export const metadata: Metadata = {
  title: "Bingo Realtime",
  description: "Trang Bingo realtime cho nhóm đông người.",
};
```

Change the document language:

```tsx
<html lang="vi">
```

- [ ] **Step 2: Translate landing page copy**

In `apps/web/src/app/page.tsx`, replace the current user-visible English strings with:

```tsx
<StatusBadge tone="info">Bingo Realtime</StatusBadge>
<h1 className="pixel-title mt-6 text-4xl leading-tight sm:text-6xl lg:text-7xl">Tiệc Bingo Pixel</h1>
<p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-pixel-muted sm:text-xl">
  Tạo phòng Bingo realtime cho nhóm đông người: host gọi từng mục, người chơi đánh dấu bảng trên điện thoại, và màn hình lớn cập nhật như bảng điểm arcade.
</p>
<div className="mt-8 grid gap-3 sm:grid-cols-2">
  <Link className="pixel-button pixel-button-primary w-full" href="/create">
    Tạo ván mới
  </Link>
  <a className="pixel-button pixel-button-secondary w-full" href="#join">
    Cách tham gia
  </a>
</div>
```

For the how-to-play panel, use:

```tsx
<p className="pixel-label text-pixel-pink">Cách chơi</p>
<div className="mt-5 grid gap-4">
  {[
    ["01", "Host tạo phòng rồi chia sẻ mã QR hoặc đường link."],
    ["02", "Người chơi nhập tên để nhận bảng Bingo riêng."],
    ["03", "Khi thấy bảng đã hoàn chỉnh, bấm BINGO để server kiểm tra."],
  ].map(([step, text]) => (
    <div className="grid grid-cols-[3.5rem_1fr] gap-3 border-4 border-pixel-ink bg-white p-3 shadow-[4px_4px_0_#10101f]" key={step}>
      <span className="flex min-h-11 items-center justify-center bg-pixel-gold font-pixel text-xl font-black text-pixel-ink">{step}</span>
      <p className="self-center font-bold leading-6 text-slate-700">{text}</p>
    </div>
  ))}
</div>
<p className="mt-5 border-4 border-pixel-ink bg-pixel-cyan p-4 font-black text-pixel-ink shadow-[4px_4px_0_#10101f]">
  Đã có link phòng? Mở link người chơi từ host để vào thẳng bảng Bingo của bạn.
</p>
```

- [ ] **Step 3: Verify this task**

Run:

```bash
npm --workspace apps/web run typecheck
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 4: Commit this task**

Only if the user has explicitly requested commits for implementation work, run:

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/page.tsx
git commit -m "Localize landing page to Vietnamese"
```

---

### Task 2: Translate shared Bingo display components

**Files:**
- Modify: `apps/web/src/components/BingoBoard.tsx`
- Modify: `apps/web/src/components/CalledItemCard.tsx`

- [ ] **Step 1: Translate Bingo board visible fallback text**

In `apps/web/src/components/BingoBoard.tsx`, change the free-cell label:

```tsx
return <span className="font-pixel text-sm font-black uppercase tracking-[0.12em] text-pixel-ink sm:text-lg lg:text-base xl:text-lg">TỰ DO</span>;
```

Change the image alt fallback:

```tsx
<img className="h-12 w-12 object-cover sm:h-16 sm:w-16 lg:h-14 lg:w-14 xl:h-16 xl:w-16" src={cell.value} alt={cell.label ?? "Mục Bingo"} />
```

- [ ] **Step 2: Translate called-item component defaults and labels**

In `apps/web/src/components/CalledItemCard.tsx`, change `itemDisplayValue`:

```tsx
function itemDisplayValue(item?: Exclude<BoardCell, { type: "free" }>) {
  if (!item) return "--";
  if (item.type === "image") return "Ảnh";
  return item.label ?? item.value;
}
```

Change the default prop text:

```tsx
export function CalledItemCard({ item, previousItem, emptyText = "Chưa có mục nào được gọi", compact = false, animate = false }: CalledItemCardProps) {
```

Replace all three repeated label pairs with:

```tsx
<p className="pixel-label text-pixel-pink">Lượt trước</p>
<p className="pixel-label text-pixel-pink">Lượt hiện tại</p>
```

Change the image alt fallback:

```tsx
<img className={`${compact ? "h-24 sm:h-32" : "h-44 sm:h-52"} w-full object-cover`} src={item.value} alt={item.label ?? "Ảnh Bingo"} />
```

- [ ] **Step 3: Verify this task**

Run:

```bash
npm --workspace apps/web run typecheck
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 4: Commit this task**

Only if the user has explicitly requested commits for implementation work, run:

```bash
git add apps/web/src/components/BingoBoard.tsx apps/web/src/components/CalledItemCard.tsx
git commit -m "Localize Bingo display components"
```

---

### Task 3: Translate create-room UI

**Files:**
- Modify: `apps/web/src/app/create/CreateRoomClient.tsx`

- [ ] **Step 1: Translate helper defaults and frontend-only error strings**

In `apps/web/src/app/create/CreateRoomClient.tsx`, make these exact replacements:

```tsx
return fileName.replace(/\.[^.]+$/, "") || "Ảnh";
```

```tsx
label: label || "Ảnh",
```

```tsx
setItemActionError("Số lượng phải lớn hơn 0.");
```

```tsx
setItemActionError("Số nhỏ nhất phải nhỏ hơn hoặc bằng số lớn nhất.");
```

```tsx
setItemActionError(`Khoảng này chỉ có ${rangeSize} số không trùng.`);
```

```tsx
setItemActionError("Vui lòng chọn một hoặc nhiều file ảnh.");
```

```tsx
setUploadProgress(`Đang tải lên ${index + 1}/${imageFiles.length}`);
```

```tsx
const payload = await response.json().catch(() => ({ message: "Không thể tải ảnh lên." }));
```

```tsx
throw new Error(payload.message ?? "Không thể tải ảnh lên.");
```

```tsx
const label = (uploaded.label ?? fileNameLabel(imageFile.name)) || "Ảnh";
```

```tsx
setUploadProgress(`Đã tải lên ${imageLines.length} ảnh.`);
```

```tsx
setItemActionError(caught instanceof Error ? caught.message : "Không thể tải ảnh lên.");
```

```tsx
setError(caught instanceof Error ? caught.message : "Không thể tạo phòng.");
```

- [ ] **Step 2: Translate create-room sidebar and estimate panel**

Replace sidebar copy with:

```tsx
<StatusBadge tone="warning">Tạo phòng</StatusBadge>
<h1 className="pixel-title mt-5 text-4xl leading-tight sm:text-5xl">Tạo sảnh Bingo</h1>
<p className="mt-5 font-bold leading-7 text-pixel-muted">Nhập danh sách mục, chọn luật thắng, rồi chia sẻ link để mỗi người chơi nhận một bảng riêng.</p>
```

Replace stats labels:

```tsx
<StatCard label="Mục sẵn sàng" tone={parsedItems.length >= requiredItems ? "green" : "gold"} value={`${parsedItems.length}/${requiredItems}`} />
<StatCard label="Số" tone="cyan" value={itemTypeCounts.number} />
<StatCard label="Chữ" tone="pink" value={itemTypeCounts.text} />
<StatCard label="Ảnh" tone="green" value={itemTypeCounts.image} />
```

Replace estimate panel copy:

```tsx
<p className="pixel-label text-slate-600">Ước tính lượt thắng Bingo</p>
<label className="mt-3 block text-sm font-black text-slate-700" htmlFor="estimated-players">
  Số người chơi dự kiến
  <input className="pixel-input mt-2 px-2 py-1 text-sm" id="estimated-players" min={1} onChange={(event) => setEstimatedPlayers(Number(event.target.value))} type="number" value={estimatedPlayers} />
</label>
```

Use these paragraphs inside the `winnerEstimate` branch:

```tsx
<p>Với {winnerEstimatePlayerCount} người chơi cùng tranh Bingo, bạn sẽ gọi khoảng <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.averageFirstWin}</span> mục trước khi có người thắng.</p>
<p>Có 1% khả năng một người chơi may mắn thắng sau <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.luckyOnePercent}</span> lượt gọi.</p>
<p>Thông thường sẽ có <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.typicalWinners}</span> người chơi thắng cùng lúc.</p>
```

Use this fallback:

```tsx
<p className="mt-4 text-sm font-bold text-slate-600">Thêm đủ mục và ít nhất một luật thắng để ước tính người thắng đầu tiên.</p>
```

- [ ] **Step 3: Translate create-room form labels and item tools**

Replace form labels and controls with these Vietnamese strings while keeping JSX structure and handlers unchanged:

```tsx
<label className="pixel-label text-slate-600" htmlFor="title">Tên ván chơi</label>
```

```tsx
Dùng ô TỰ DO ở giữa
```

```tsx
<p className="font-pixel text-sm font-black uppercase tracking-[0.08em]">Kích thước bảng</p>
```

```tsx
<p className="pixel-label text-slate-600">Luật thắng</p>
```

For the win-rule array, use:

```tsx
{[
  ["Hàng ngang", horizontal, setHorizontal],
  ["Cột dọc", vertical, setVertical],
  ["Đường chéo", diagonal, setDiagonal],
].map(([label, checked, setter]) => (
```

Replace item list labels:

```tsx
<p className="pixel-label text-slate-600">Danh sách mục</p>
<p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Thêm số ngẫu nhiên</p>
```

Use field labels:

```tsx
Số lượng
Từ
Đến
```

Use button text:

```tsx
Thêm số
```

Translate upload area:

```tsx
<p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Tải ảnh lên</p>
```

```tsx
Chọn ảnh
```

```tsx
{isUploading ? uploadProgress ?? "Đang tải lên" : imageFiles.length ? `Thêm ${imageFiles.length} ảnh` : "Thêm ảnh"}
```

```tsx
<p className="mt-2 text-xs font-bold text-pixel-ink/75">JPG, PNG, WEBP, tối đa 2MB mỗi ảnh.</p>
```

- [ ] **Step 4: Translate preview, advanced editor, submit, and success result**

Replace preview copy:

```tsx
<p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Xem trước ({parsedItems.length})</p>
<button className="pixel-badge bg-pixel-paper" onClick={clearItems} type="button">Xóa hết</button>
```

For image chips:

```tsx
{item.type === "image" ? "Ảnh" : item.label ?? item.value}
```

For empty preview and overflow:

```tsx
<p className="font-bold text-slate-600">Chưa có mục nào. Thêm số ngẫu nhiên hoặc tải ảnh lên để bắt đầu.</p>
<span className="pixel-chip bg-pixel-gold">+{parsedItems.length - 30} mục nữa</span>
```

Replace advanced editor copy:

```tsx
<summary className="pixel-label cursor-pointer text-slate-600">Chỉnh sửa nâng cao</summary>
```

```tsx
<p>Mỗi dòng là một mục. Dòng chỉ gồm số sẽ thành mục số; các dòng khác sẽ thành mục chữ.</p>
<p className="mt-1 break-all font-mono text-xs">Ảnh: image|https://example.com/photo.jpg|Tên ảnh</p>
```

Replace submit and success copy:

```tsx
{isSubmitting ? "Đang tạo phòng" : "Tạo phòng Bingo"}
```

```tsx
{!canSubmit ? <p className="mt-3 text-sm font-bold text-slate-600">Bạn cần tên ván chơi, đủ số mục, và ít nhất một luật thắng.</p> : null}
```

```tsx
<p className="pixel-label text-pixel-ink/70">Phòng đã sẵn sàng</p>
```

```tsx
<a className="pixel-button pixel-button-primary" href={result.hostUrl} rel="noreferrer" target="_blank">Mở trang host</a>
```

```tsx
{inviteCopyStatus === "copied" ? "Đã sao chép" : inviteCopyStatus === "failed" ? "Sao chép thất bại" : "Sao chép link mời"}
```

- [ ] **Step 5: Verify this task**

Run:

```bash
npm --workspace apps/web run typecheck
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 6: Commit this task**

Only if the user has explicitly requested commits for implementation work, run:

```bash
git add apps/web/src/app/create/CreateRoomClient.tsx
git commit -m "Localize create room UI"
```

---

### Task 4: Translate host dashboard UI

**Files:**
- Modify: `apps/web/src/app/host/[roomCode]/HostRoomClient.tsx`

- [ ] **Step 1: Translate host fallback errors and status formatting**

Change the datetime locale in `formatLastSeen`:

```tsx
return new Intl.DateTimeFormat("vi-VN", {
```

Change host-state load fallback:

```tsx
.catch((caught) => setError(caught instanceof Error ? caught.message : "Không thể tải phòng host."));
```

Replace missing-token alert copy:

```tsx
<p className="text-2xl font-black">Thiếu host token</p>
<p className="mt-2">Hãy mở đúng link host được tạo sau khi tạo phòng.</p>
```

- [ ] **Step 2: Translate dashboard header and controls**

Replace header strings:

```tsx
<p className="pixel-label text-pixel-cyan">Bảng điều khiển host</p>
<h1 className="mt-2 text-3xl font-black leading-tight text-pixel-cream sm:text-5xl">{hostState?.title ?? `Phòng ${roomCode}`}</h1>
```

Replace badges:

```tsx
<StatusBadge tone="warning">Mã {roomCode}</StatusBadge>
<StatusBadge tone={isConnected ? "success" : "danger"}>{isConnected ? "Online" : "Offline"}</StatusBadge>
<StatusBadge tone={statusTone(hostState?.status)}>{hostState?.status === "playing" ? "đang chơi" : hostState?.status === "ended" ? "đã kết thúc" : hostState?.status === "waiting" ? "đang chờ" : "đang tải"}</StatusBadge>
```

Replace controls panel:

```tsx
<p className="pixel-label text-slate-600">Điều khiển</p>
```

Buttons:

```tsx
Bắt đầu
Gọi mục
Kết thúc
Ván mới
```

- [ ] **Step 3: Translate invite and called-items sections**

Replace invite labels:

```tsx
<p className="pixel-label text-slate-600">Mời người chơi</p>
```

Copy button ternary:

```tsx
{copyStatus === "copied" ? "Đã sao chép" : copyStatus === "failed" ? "Sao chép thất bại" : "Sao chép link"}
```

Replace recently called section:

```tsx
<p className="pixel-label text-slate-600">Đã gọi gần đây</p>
```

Image fallback in chips:

```tsx
<span className="min-w-0 max-w-36 truncate sm:max-w-48">{called.item.label ?? (called.item.type === "image" ? "Ảnh" : called.item.value)}</span>
```

Empty state:

```tsx
<p className="font-bold text-slate-600">Chưa có mục nào được gọi.</p>
```

- [ ] **Step 4: Translate player stats, presence popup, and winner section**

Replace stat labels:

```tsx
<StatCard compact label="Người chơi" tone="cyan" value={hostState?.players.length ?? 0} />
<StatCard compact className="transition hover:brightness-110" label="Online" tone="green" value={onlinePlayers.length} />
<StatCard compact label="Yêu cầu" tone="gold" value={hostState?.claims.length ?? 0} />
```

Replace presence popup labels:

```tsx
<p className="pixel-label text-slate-600">Trạng thái người chơi</p>
<button className="pixel-badge bg-pixel-paper" onClick={() => setShowPlayersPopup(false)} type="button">Đóng</button>
```

```tsx
<p className="font-black text-slate-700">Đang online ({onlinePlayers.length})</p>
```

Winner suffix:

```tsx
<span className="font-black">{player.name}{player.isWinner ? " • Thắng" : ""}</span>
```

Empty online state:

```tsx
<p className="font-bold text-slate-600">Chưa có người chơi online.</p>
```

Offline section:

```tsx
<p className="font-black text-slate-700">Offline ({offlinePlayers.length})</p>
```

Offline player card:

```tsx
<div className="font-black">{player.name}{player.isWinner ? " • Thắng" : ""}</div>
<p className="mt-1 text-xs font-bold">Lần cuối online: {formatLastSeen(player.lastSeenAt)}</p>
```

Empty offline state:

```tsx
<p className="font-bold text-slate-600">Không có người chơi offline.</p>
```

Winner panel:

```tsx
<p className="pixel-label text-slate-600">Người thắng</p>
```

Empty winner state:

```tsx
<p className="font-bold text-slate-600">Chưa có người thắng.</p>
```

- [ ] **Step 5: Verify this task**

Run:

```bash
npm --workspace apps/web run typecheck
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 6: Commit this task**

Only if the user has explicitly requested commits for implementation work, run:

```bash
git add "apps/web/src/app/host/[roomCode]/HostRoomClient.tsx"
git commit -m "Localize host dashboard UI"
```

---

### Task 5: Translate player room UI

**Files:**
- Modify: `apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx`

- [ ] **Step 1: Translate player-room fallback messages and loading state**

Replace winner verification success message:

```tsx
setSuccessMessage(`${event.playerName} đã thắng Bingo. Ván chơi đã kết thúc.`);
```

Replace join fallback error:

```tsx
setError(caught instanceof Error ? caught.message : "Không thể tham gia phòng.");
```

Replace loading badge:

```tsx
<StatusBadge tone="info">Đang khôi phục phòng...</StatusBadge>
```

- [ ] **Step 2: Translate join screen**

Replace join panel copy:

```tsx
<StatusBadge tone="info">Phòng {roomCode}</StatusBadge>
<h1 className="pixel-title mt-5 text-4xl leading-tight sm:text-6xl">Nhận bảng Bingo của bạn</h1>
<p className="mt-5 font-bold leading-7 text-pixel-muted">Nhập tên để nhận một bảng Bingo riêng. Không cần tài khoản, chỉ cần link phòng.</p>
<label className="pixel-label mt-8 block text-pixel-muted" htmlFor="player-name">Tên người chơi</label>
<input className="pixel-input mt-3" id="player-name" maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: An" value={name} />
```

Replace join button ternary:

```tsx
{isJoining ? "Đang vào phòng" : "Tham gia ngay"}
```

- [ ] **Step 3: Translate player dashboard header and statuses**

Replace room label and fallback player name:

```tsx
<p className="pixel-label text-pixel-cyan">Phòng {roomCode}</p>
<h1 className="mt-1 truncate text-xl font-black text-pixel-cream sm:text-2xl">{playerName || "Người chơi"}</h1>
```

Replace status badges:

```tsx
<StatusBadge className="justify-center px-2 text-[0.7rem] sm:text-xs" tone={roomStatusTone(roomStatus)}>{roomStatus === "playing" ? "Đang chơi" : roomStatus === "ended" ? "Đã kết thúc" : "Đang chờ"}</StatusBadge>
<StatusBadge className="justify-center px-2 text-[0.7rem] sm:text-xs" tone={isConnected ? "success" : "danger"}>{onlinePlayerCount ?? "--"} online</StatusBadge>
```

- [ ] **Step 4: Translate board regeneration and called-items panel**

Replace regeneration button and helper text:

```tsx
{boardRegenerationsRemaining > 0 ? "Tạo bảng mới" : "Hết lượt đổi bảng"}
```

```tsx
<p className="text-center text-xs font-black text-slate-600">{boardRegenerationsRemaining > 0 ? `Còn ${boardRegenerationsRemaining} lượt đổi bảng` : "Hết lượt đổi bảng"}</p>
```

Replace called-items details:

```tsx
<summary className="pixel-label cursor-pointer text-slate-600">Mục đã gọi ({state?.calledItems.length ?? 0})</summary>
```

Empty state:

```tsx
<p className="font-bold text-slate-600">Các mục đã gọi sẽ xuất hiện ở đây khi host bắt đầu gọi.</p>
```

- [ ] **Step 5: Translate winner popup**

Replace winner popup copy:

```tsx
<p className="pixel-label text-pixel-pink">Người thắng Bingo</p>
<p className="mt-4 font-pixel text-4xl font-black uppercase leading-tight text-pixel-ink sm:text-5xl">{winnerName}</p>
<p className="mt-4 font-bold text-slate-700">Ván chơi đã kết thúc.</p>
<PixelButton className="mt-6 w-full" onClick={closeWinnerPopup} variant="secondary">
  Đóng
</PixelButton>
```

Leave the `BINGO!` button text unchanged because it is the game call-to-action.

- [ ] **Step 6: Verify this task**

Run:

```bash
npm --workspace apps/web run typecheck
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 7: Commit this task**

Only if the user has explicitly requested commits for implementation work, run:

```bash
git add "apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx"
git commit -m "Localize player room UI"
```

---

### Task 6: Translate frontend request fallback and run final checks

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Inspect: `apps/web/src/**/*.{ts,tsx}`

- [ ] **Step 1: Translate `apiFetch` frontend fallback error**

In `apps/web/src/lib/api.ts`, replace both fallback strings:

```tsx
const error = await response.json().catch(() => ({ message: "Yêu cầu thất bại" }));
throw new Error(error.message ?? "Yêu cầu thất bại");
```

- [ ] **Step 2: Search for remaining obvious English UI strings**

Run:

```bash
npm --workspace apps/web run typecheck
```

Expected: command exits successfully with no TypeScript errors.

Run a content search over frontend source for likely remaining English UI words. Use the dedicated Grep tool when implementing; search at least these terms in `apps/web/src`:

```text
Create|Room|Player|Players|Winner|Waiting|Playing|Ended|Upload|Image|Current Call|Last Call|No items|Copy|Close|Start|End|Join|Host|Board|Called|Online|Offline|Request failed
```

Expected: any remaining matches are either non-user-facing identifiers/types/imports, route segment names, `BINGO!`, URLs/examples, or deliberately unchanged API/event/internal names. Translate any remaining user-visible English strings found in `apps/web/src`.

- [ ] **Step 3: Run lint**

Run:

```bash
npm --workspace apps/web run lint
```

Expected: command exits successfully with no ESLint errors.

- [ ] **Step 4: Browser-check the main UI flows**

Start the app if no dev server is already running:

```bash
npm run dev
```

Open the web app and inspect:

- Landing page `/`
- Create page `/create`
- Host page from a created room link
- Player page from the room invite link

Expected:

- Main frontend UI copy appears in Vietnamese.
- Layout remains readable with longer Vietnamese strings.
- Creating a room, opening the host page, joining as a player, and viewing called-item/board UI still work.

- [ ] **Step 5: Final commit if requested**

Only if the user has explicitly requested commits for implementation work, run:

```bash
git add apps/web/src/lib/api.ts
git commit -m "Localize frontend fallback messages"
```

If commits were not requested, leave changes uncommitted and summarize modified files.

---

## Self-Review Notes

- Spec coverage: Tasks cover frontend UI text, shared components, metadata, and frontend fallback errors. Server/API/socket messages and shared validation messages remain out of scope.
- Placeholder scan: No TBD/TODO/fill-in placeholders are present. Implementation steps include exact strings and commands.
- Type consistency: All modified strings preserve existing component props, handlers, API payloads, route names, socket events, and localStorage keys.
