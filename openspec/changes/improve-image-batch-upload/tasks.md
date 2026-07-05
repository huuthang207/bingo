## 1. Backend batch upload contract

- [x] 1.1 Cập nhật `apps/server/src/routes/uploads.ts` để nhận multipart batch upload qua field `files` thay cho single-file upload tuần tự
- [x] 1.2 Đổi giới hạn upload sang 10MB mỗi ảnh, tối đa 10 ảnh mỗi batch, và cập nhật các thông báo lỗi tương ứng cho size/file-count/MIME validation
- [x] 1.3 Cập nhật response upload để trả `items` theo danh sách `{ url, label }` đúng thứ tự file đã nhận
- [x] 1.4 Điều chỉnh upload rate limit sang 10 batch/phút/IP cho contract mới

## 2. Atomicity và cleanup

- [x] 2.1 Theo dõi các file đã được ghi xuống disk trong một batch upload để có thể cleanup khi request thất bại
- [x] 2.2 Bảo đảm mọi nhánh lỗi của batch upload xóa file đã ghi trong batch trước khi trả response lỗi

## 3. Frontend create-room flow

- [x] 3.1 Cập nhật `apps/web/src/app/create/CreateRoomClient.tsx` để gửi một `FormData` chứa toàn bộ file đã chọn trong một request
- [x] 3.2 Cập nhật logic frontend để đọc response batch upload và append toàn bộ image items trong một lần thành công
- [x] 3.3 Thêm validation phía client để chặn upload khi `parsedItems.length + selectedFiles.length` vượt `MAX_ROOM_ITEMS` và hiển thị thông báo còn có thể thêm bao nhiêu ảnh
- [x] 3.4 Cập nhật helper text, progress, và error messaging trên UI cho giới hạn 10MB mỗi ảnh và 10 ảnh mỗi batch

## 4. Verification

- [x] 4.1 Kiểm tra thủ công các luồng upload thành công, ảnh vượt 10MB, vượt 10 file, sai MIME, và vượt `MAX_ROOM_ITEMS` trong create-room flow
- [x] 4.2 Chạy test/typecheck phù hợp để xác nhận thay đổi upload không làm hỏng backend và frontend build/type safety
