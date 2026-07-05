## Why

Tính năng upload ảnh khi tạo room hiện bị giới hạn 2MB mỗi ảnh và frontend upload từng file bằng request riêng, nên host dễ gặp lỗi khi dùng ảnh lớn hơn hoặc chọn nhiều ảnh cùng lúc. Việc này gây trải nghiệm không ổn định, dễ dính rate limit, và có thể tạo file upload rời rạc khi quá trình bị lỗi giữa chừng.

## What Changes

- Tăng giới hạn kích thước ảnh upload từ 2MB lên 10MB cho mỗi ảnh.
- Đổi luồng upload ảnh từ single-file request tuần tự sang batch upload nhiều ảnh trong một request.
- Thêm validation rõ ràng cho batch upload: giới hạn loại file, kích thước mỗi ảnh, số ảnh tối đa mỗi batch, và tổng số item còn có thể thêm vào room.
- Trả về kết quả upload theo danh sách ảnh đã xử lý để frontend có thể thêm toàn bộ image item sau một lần upload thành công.
- Cải thiện thông báo lỗi cho các tình huống như vượt giới hạn ảnh mỗi batch, vượt giới hạn item của room, và rate limit.
- Bảo đảm cleanup các file đã ghi tạm nếu batch upload thất bại để tránh tạo orphan upload files.

## Capabilities

### New Capabilities
- `room-image-batch-upload`: Hỗ trợ host upload nhiều ảnh cho room creation bằng một batch request với giới hạn 10MB mỗi ảnh và xử lý lỗi/cleanup nhất quán.

### Modified Capabilities
- Không có.

## Impact

- Backend upload route tại `apps/server/src/routes/uploads.ts` và cấu hình rate limit liên quan.
- Frontend create room flow tại `apps/web/src/app/create/CreateRoomClient.tsx`.
- API contract của upload endpoint và dữ liệu response cho frontend.
- Validation và UX quanh giới hạn `MAX_ROOM_ITEMS` khi thêm image items.
