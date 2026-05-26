# Kế hoạch dự án Bingo realtime

Thư mục này lưu các file kế hoạch để xây dựng website Bingo realtime cho khoảng 100 người chơi cùng lúc.

## Danh sách tài liệu

1. [00-overview.md](00-overview.md) — Tổng quan mục tiêu, phạm vi MVP và nguyên tắc thiết kế.
2. [01-architecture.md](01-architecture.md) — Kiến trúc frontend/backend/database và cấu trúc thư mục đề xuất.
3. [02-database-schema.md](02-database-schema.md) — Thiết kế database PostgreSQL/Prisma.
4. [03-api-and-socket-contract.md](03-api-and-socket-contract.md) — REST API và Socket.IO event contract.
5. [04-game-logic.md](04-game-logic.md) — Logic sinh board, gọi item, mark cell và check Bingo.
6. [05-ui-pages.md](05-ui-pages.md) — Kế hoạch các trang UI và component chính.
7. [06-security-and-validation.md](06-security-and-validation.md) — Bảo mật, token, validation và chống gian lận.
8. [07-roadmap.md](07-roadmap.md) — Roadmap theo giai đoạn phát triển.
9. [08-progress.md](08-progress.md) — File theo dõi tiến độ dự án.

## Cách sử dụng

- Đọc `00-overview.md` trước để nắm mục tiêu.
- Dùng `08-progress.md` để cập nhật tiến độ sau mỗi phần đã triển khai.
- Khi bắt đầu code, nên đi theo roadmap trong `07-roadmap.md`.
- Khi cần triển khai backend, tham chiếu `02-database-schema.md`, `03-api-and-socket-contract.md` và `04-game-logic.md`.
- Khi cần triển khai frontend, tham chiếu `05-ui-pages.md`.
