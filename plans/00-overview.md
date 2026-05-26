# Tổng quan dự án website Bingo realtime

## Mục tiêu

Xây dựng website chơi Bingo realtime cho khoảng 100 người chơi cùng lúc trong một phòng.

Website cho phép host tạo phòng, cấu hình nội dung Bingo, chọn luật thắng, chia sẻ link cho người chơi và điều khiển game theo thời gian thực.

## Stack đã chọn

- Frontend: Next.js + React + Tailwind CSS
- Backend: Node.js + Socket.IO
- Database: PostgreSQL
- ORM: Prisma
- Authentication: không dùng tài khoản, dùng host token và player token

## Yêu cầu chính

### Host

Host có thể:

- Tạo phòng Bingo.
- Chọn nội dung Bingo gồm số truyền thống, từ khóa, hình ảnh hoặc kết hợp nhiều loại.
- Chọn kích thước board, ưu tiên MVP là 5x5.
- Chọn luật thắng:
  - Hàng ngang.
  - Hàng dọc.
  - Đường chéo.
- Chia sẻ link phòng cho người chơi.
- Bắt đầu game.
- Gọi item tiếp theo.
- Xem danh sách người chơi.
- Xem người báo Bingo.
- Xác nhận hoặc xem kết quả kiểm tra Bingo.
- Kết thúc game.

### Người chơi

Người chơi có thể:

- Vào phòng bằng link hoặc mã phòng.
- Nhập tên, không cần đăng nhập.
- Nhận board riêng.
- Theo dõi item được gọi realtime.
- Đánh dấu ô hợp lệ trên board.
- Báo Bingo khi đủ điều kiện thắng.
- Refresh trang và tiếp tục chơi nhờ player token lưu ở localStorage.

## Phạm vi MVP

MVP nên tập trung vào:

- Tạo phòng.
- Host token qua link.
- Người chơi nhập tên.
- Player token lưu localStorage.
- Item dạng number và text.
- Board 5x5.
- Có thể bật/tắt FREE cell.
- Luật thắng ngang, dọc, chéo do host chọn.
- Socket.IO realtime.
- Server-side validation khi mark cell và claim Bingo.

## Ngoài phạm vi MVP ban đầu

Các tính năng nên để giai đoạn sau:

- Upload hình ảnh.
- QR code tham gia phòng.
- Âm thanh và animation.
- Tài khoản host.
- Dashboard quản lý.
- Template game.
- Redis adapter để scale nhiều backend instance.
- Object storage production cho ảnh.

## Nguyên tắc thiết kế

- Server là nguồn sự thật.
- Không tin trạng thái từ client nếu liên quan đến kết quả game.
- Không broadcast toàn bộ state nếu chỉ cần event nhỏ.
- Board của từng player chỉ gửi cho chính player đó.
- Host token và player token không lưu plain text trong database.
- Kiến trúc phải đủ đơn giản cho MVP nhưng không chặn hướng mở rộng sau này.
