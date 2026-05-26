# Roadmap phát triển

## Giai đoạn 1: MVP chơi được

Mục tiêu: có thể tạo phòng, join phòng và chơi Bingo realtime với item dạng số/từ khóa.

Tính năng:

- Khởi tạo monorepo.
- Cấu hình Next.js frontend.
- Cấu hình Node.js backend.
- Cấu hình PostgreSQL + Prisma.
- Tạo Prisma schema ban đầu.
- API tạo room.
- API join room.
- Sinh board riêng cho player.
- Logic check win ngang/dọc/chéo.
- Socket.IO kết nối room.
- Host start game.
- Host call next item.
- Player mark cell.
- Player claim Bingo.
- Server validate Bingo.
- Host xem claim.
- End game.

Tiêu chí hoàn thành:

- Có thể mở nhiều tab giả lập nhiều player.
- Host gọi item và tất cả player nhận realtime.
- Player chỉ mark được item đã gọi.
- Claim Bingo hợp lệ được server xác nhận.
- Refresh player page vẫn khôi phục được board và marked cells.

## Giai đoạn 2: Hỗ trợ hình ảnh

Mục tiêu: host có thể thêm item dạng ảnh.

Tính năng:

- API upload ảnh.
- Validate file type và file size.
- Preview ảnh trong create page.
- Lưu item image trong room_items.
- Board hiển thị ảnh.
- Item called hiển thị ảnh.

Tiêu chí hoàn thành:

- Host upload được ảnh khi tạo game.
- Player thấy ảnh trên board.
- Item ảnh được gọi realtime như number/text.

## Giai đoạn 3: Nâng cấp trải nghiệm

Mục tiêu: game dễ dùng hơn khi chơi thật với nhiều người.

Tính năng:

- Copy invite link.
- QR code join phòng.
- Trạng thái online/offline.
- Reconnect UX tốt hơn.
- Animation khi gọi item.
- Âm thanh khi item mới được gọi.
- Màn hình display riêng cho host chiếu lên màn hình lớn.
- Responsive mobile hoàn chỉnh.

Tiêu chí hoàn thành:

- Người chơi mobile thao tác dễ.
- Host có thể điều khiển game rõ ràng.
- Mất mạng ngắn hạn không làm mất state.

## Giai đoạn 4: Production hardening

Mục tiêu: triển khai ổn định cho người dùng thật.

Tính năng:

- Rate limiting.
- Logging chuẩn hơn.
- Error tracking.
- Cleanup room cũ.
- Cleanup ảnh cũ.
- Health check endpoint.
- Dockerfile nếu cần.
- CI kiểm tra lint/type/test.

Tiêu chí hoàn thành:

- Backend có health check.
- Dữ liệu cũ được dọn định kỳ.
- Lỗi production có thể theo dõi.

## Giai đoạn 5: Scale nhiều phòng hoặc nhiều instance

Mục tiêu: hỗ trợ lượng người dùng lớn hơn MVP.

Tính năng:

- Redis.
- @socket.io/redis-adapter.
- Chạy nhiều backend instance.
- Load balancer.
- Object storage cho ảnh như S3/R2.
- Metrics cho số socket, room, latency.

Tiêu chí hoàn thành:

- Nhiều backend instance vẫn broadcast đúng room.
- Không phụ thuộc state local memory cho logic game quan trọng.
