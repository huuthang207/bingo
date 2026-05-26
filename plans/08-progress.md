# Tiến độ dự án

Ngày khởi tạo kế hoạch: 2026-05-26

## Trạng thái tổng quan

```text
Planning: Done
Implementation: Started
MVP: In progress
Image support: Not started
Production hardening: Not started
```

## Checklist kế hoạch

- [x] Xác định stack kỹ thuật.
- [x] Xác định yêu cầu host.
- [x] Xác định yêu cầu player.
- [x] Xác định luật thắng ban đầu.
- [x] Lập kiến trúc tổng thể.
- [x] Thiết kế database sơ bộ.
- [x] Thiết kế REST API.
- [x] Thiết kế Socket.IO events.
- [x] Lập kế hoạch game logic.
- [x] Lập kế hoạch UI pages.
- [x] Lập kế hoạch bảo mật và validation.
- [x] Lập roadmap phát triển.

## Checklist triển khai giai đoạn 1: MVP

- [x] Khởi tạo monorepo.
- [x] Tạo app Next.js.
- [x] Tạo app Node.js backend.
- [x] Cài Socket.IO server/client.
- [x] Cài Prisma.
- [x] Cấu hình PostgreSQL.
- [x] Viết Prisma schema.
- [x] Tạo migration đầu tiên.
- [x] Viết shared types.
- [x] Viết validation schema.
- [x] Viết logic generate board.
- [x] Viết logic check win.
- [x] Viết API tạo room.
- [x] Viết API join room.
- [x] Viết API player-state.
- [x] Viết API host-state.
- [x] Viết Socket.IO host_join_room.
- [x] Viết Socket.IO join_room.
- [x] Viết Socket.IO start_game.
- [x] Viết Socket.IO call_next_item.
- [x] Viết Socket.IO mark_cell.
- [x] Viết Socket.IO claim_bingo.
- [x] Viết Socket.IO end_game.
- [x] Tạo trang chủ.
- [x] Tạo trang create room.
- [x] Tạo trang host dashboard.
- [x] Tạo trang player join/play.
- [x] Test bằng nhiều tab local.
- [x] Fix lỗi realtime/reconnect cơ bản.

## Checklist giai đoạn 2: hình ảnh

- [x] Thiết kế upload endpoint.
- [x] Validate file type.
- [x] Validate file size.
- [x] Lưu ảnh local hoặc object storage.
- [x] Thêm image item vào create page.
- [x] Render image item trên board.
- [x] Render image item khi được gọi.
- [x] Test game có item hình ảnh.

## Checklist giai đoạn 3: UX

- [x] Thêm copy invite link.
- [x] Thêm QR code.
- [x] Thêm trạng thái online/offline.
- [x] Thêm animation item called.
- [x] Thêm âm thanh.
- [x] Thêm display page cho màn hình lớn.
- [x] Tối ưu mobile layout.

## Checklist giai đoạn 4: production

- [x] Thêm rate limiting.
- [x] Thêm logging.
- [x] Dùng logging/error handler hiện có thay cho error tracking vendor ngoài ở thời điểm hiện tại.
- [x] Thêm cleanup room cũ.
- [x] Thêm cleanup ảnh cũ.
- [x] Thêm health check.
- [x] Thêm Dockerfile nếu cần.
- [x] Thêm CI lint/type/test.

## Ghi chú quyết định

- Stack đã chốt: Next.js + Node.js + Socket.IO + PostgreSQL.
- Người chơi không cần đăng nhập, chỉ nhập tên.
- Host dùng link/token.
- Host được chọn luật thắng ngang/dọc/chéo.
- Host có thể chọn nội dung Bingo gồm số, từ khóa, hình ảnh hoặc hỗn hợp.
- MVP nên làm number/text trước, image để giai đoạn 2 nếu muốn giảm rủi ro.

## Kiểm tra gần nhất

- 2026-05-26: `npm install` hoàn tất, còn 2 cảnh báo audit mức moderate.
- 2026-05-26: `npm run typecheck` pass.
- 2026-05-26: `npm run build` pass.
- 2026-05-26: Thêm API `player-state`, `host-state`, Socket.IO events MVP và `docker-compose.yml` cho PostgreSQL local.
- 2026-05-26: PostgreSQL local chạy trên host port `5433`; migration đầu tiên `20260526111509_init` đã apply thành công.
- 2026-05-26: Thêm form create room thật, form join player và component render Bingo board; `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Kết nối frontend với Socket.IO, hoàn thiện host dashboard, player gửi `mark_cell` và `claim_bingo`; `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Test nhiều tab local thành công: tạo phòng, player join, host start/call item, player nhận realtime, mark cell, claim invalid hiển thị trên host. Đã sửa lỗi player state sau join và host player list realtime.
- 2026-05-26: Thêm copy invite link trên host dashboard và cải thiện visual ô đã mark bằng badge check; `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Thêm QR code join phòng trên host dashboard và hỗ trợ tạo image item bằng cú pháp `image|url|label`; `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Thêm `CalledItemCard` để render image/text/number khi được gọi trên host/player; test browser game có image item thành công; `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Thêm `POST /uploads` lưu ảnh local, validate jpg/png/webp tối đa 2MB và UI upload ảnh trên create page; `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Browser test upload ảnh thành công: file png được thêm vào danh sách item, file txt bị reject, tạo phòng với image item thành công và URL `/uploads` trả `image/png`.
- 2026-05-26: Thêm `npm test` chạy Node test qua `tsx` cho `generateBoard` và `checkWin`; 9 test pass, `npm run typecheck` và `npm run build` pass.
- 2026-05-26: Thêm animation pop/glow cho item mới nhất khi host gọi item, áp dụng trên host và player, có `prefers-reduced-motion`; `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Thêm trạng thái online/offline cho danh sách player trên host: server emit `player_joined`/`player_left`, host cập nhật badge và last seen; `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Tối ưu mobile layout cho create/host/player và Bingo board: giảm padding/shadow trên mobile, board cell nhỏ gọn hơn; `npm test`, `npm run typecheck`, `npm run build` pass, Chrome viewport 390x844 hiển thị create page ổn.
- 2026-05-26: Thêm script `cleanup:uploads` dry-run mặc định để dọn ảnh upload cũ theo `--max-age-days`, chỉ xoá khi truyền `--apply`; dry-run pass, `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Thêm GitHub Actions CI tại `.github/workflows/ci.yml` chạy `npm ci`, `npm test`, `npm run typecheck`, `npm run build` trên Node 22; các lệnh CI pass local.
- 2026-05-26: Thêm rate limiting in-memory cho create room, join room và upload; `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Thêm nút bật/tắt âm thanh trên host và player, phát beep ngắn khi item mới được gọi; `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Thêm trang `/display/:roomCode` cho màn hình lớn, state công khai và socket `join_display_room`; browser test realtime start/call item pass, `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Thêm script `cleanup:rooms` dry-run mặc định để dọn phòng đã kết thúc cũ theo `--max-age-days`, chỉ xoá khi truyền `--apply`; dry-run pass, `npm test`, `npm run typecheck`, `npm run build` pass.
- 2026-05-26: Thêm JSON logger có redaction token, request logging, error handler tập trung, Socket.IO event logging an toàn và health check DB-backed.
- 2026-05-27: Chốt chưa tích hợp error tracking vendor ngoài; tạm dùng JSON logger, request logging và error handler hiện có cho production hardening ban đầu.
- 2026-05-27: Thêm `Dockerfile` production và `.dockerignore` cho monorepo, build bằng Node 22 và chạy server từ `apps/server/dist`.
- 2026-05-27: `npm test` pass 10/10, `npm run typecheck` pass, `npm run build` pass, `npm run lint` pass sạch warning, `npm run cleanup:uploads` dry-run pass.
- 2026-05-27: Cập nhật web lint script sang `eslint .`, thêm `apps/web/eslint.config.mjs` cho Next.js 15, tắt rule `@next/next/no-img-element` vì item ảnh dùng URL upload/URL host nhập động, và sửa `postcss.config.js` để tránh anonymous default export.
- 2026-05-27: `npm run cleanup:rooms` và `docker build -t bingo-app .` đã được chạy thành công sau khi bật PostgreSQL local và Docker daemon.
- 2026-05-27: Thêm script `prisma:deploy` cho production database migration trên Railway/Vercel workflow.

## Việc tiếp theo đề xuất

Bước tiếp theo nên là chuẩn bị các quyết định trước khi deploy production thực tế:

```text
1. Chọn môi trường deploy và cấu hình biến môi trường production.
2. Khi deploy nhiều instance, chuyển upload local và rate limit in-memory sang storage/shared store phù hợp.
3. Nếu cần quan sát lỗi tập trung, chọn vendor error tracking/log aggregation và tích hợp sau.
```
