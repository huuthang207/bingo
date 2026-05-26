# Bảo mật và validation

## Nguyên tắc chính

- Server là nguồn sự thật.
- Không tin dữ liệu client gửi lên nếu ảnh hưởng đến kết quả game.
- Không lưu token dạng plain text trong database.
- Validate dữ liệu ở boundary: REST API, Socket.IO event, upload file.
- Giới hạn kích thước payload để tránh abuse.

## Host token

Khi tạo room:

```text
1. Tạo host token random đủ dài.
2. Trả token plain cho host một lần.
3. Hash token trước khi lưu database.
4. Host dùng token trong URL hoặc Authorization header.
```

Host token được dùng cho:

- Xem host dashboard.
- Start game.
- Call next item.
- Verify Bingo.
- End game.

## Player token

Khi player join:

```text
1. Tạo player token random.
2. Trả token plain cho frontend.
3. Frontend lưu localStorage.
4. Backend hash token trước khi lưu database.
```

Player token được dùng cho:

- Khôi phục state sau refresh.
- Mark cell.
- Claim Bingo.
- Reconnect Socket.IO.

## Validation REST API

Nên dùng Zod hoặc thư viện tương tự.

Validate khi tạo room:

- title không rỗng.
- boardSize nằm trong giới hạn cho phép, ví dụ 3 đến 7.
- winRules phải bật ít nhất một luật.
- items đủ số lượng cho board.
- item type chỉ là number, text hoặc image.
- value không rỗng.
- giới hạn số lượng item.

Validate khi join room:

- room tồn tại.
- room chưa ended.
- name không rỗng.
- name có độ dài tối đa, ví dụ 40 ký tự.

## Validation Socket.IO

Mỗi event cần validate payload.

Ví dụ mark_cell:

- roomCode hợp lệ.
- playerToken tồn tại.
- row và col là integer.
- row và col nằm trong board size.

Ví dụ call_next_item:

- roomCode hợp lệ.
- hostToken hợp lệ.
- room đang playing.
- còn item chưa gọi.

## Chống gian lận trong game

### Khi mark cell

Server chỉ chấp nhận nếu:

- Player token hợp lệ.
- Player thuộc room.
- Room đang playing.
- Ô nằm trong board của player.
- Item trong ô đã được gọi hoặc là FREE cell.

### Khi claim Bingo

Server tự kiểm tra:

- Board từ database.
- Marked cells từ database.
- Called items từ database.
- Win rules từ database.

Client không được tự quyết định thắng.

## Upload ảnh

Giai đoạn hỗ trợ hình ảnh cần validate:

- Chỉ cho phép jpg, png, webp.
- Giới hạn dung lượng, ví dụ 2MB mỗi ảnh.
- Giới hạn số ảnh mỗi phòng.
- Không dùng filename gốc làm filename lưu trữ.
- Tạo filename random.
- Không cho upload file thực thi.

Nếu lưu local:

- Serve ảnh từ thư mục public/uploads hoặc endpoint tĩnh được kiểm soát.
- Không cho truy cập path tùy ý.

Nếu dùng object storage:

- Dùng signed upload hoặc backend proxy upload.
- Chỉ lưu storage key hoặc public URL đã kiểm soát.

## Rate limiting

Nên có rate limit cho:

- Tạo room.
- Join room.
- Upload ảnh.
- Socket event mark_cell.
- Socket event claim_bingo.

MVP có thể rate limit đơn giản theo IP và room.

## XSS

Item text và player name do user nhập.

Frontend cần:

- Render text bằng React bình thường, không dùng dangerouslySetInnerHTML.
- Escape nội dung nếu cần khi xuất ra HTML.
- Giới hạn độ dài input.

## Room code

Room code nên:

- Đủ ngắn để nhập tay, ví dụ 6 ký tự.
- Không dễ đoán toàn bộ nếu có nhiều phòng.
- Chỉ chứa chữ số/chữ cái dễ đọc.

Ví dụ:

```text
ABCD12
K7P9QX
```

## Cleanup dữ liệu

Sau này nên có job dọn:

- Room đã ended quá lâu.
- Room không hoạt động quá lâu.
- Ảnh upload không còn dùng.

## Logging

Không log token plain.

Có thể log:

- roomCode.
- playerId.
- event name.
- lỗi validation.

Không log:

- hostToken.
- playerToken.
- dữ liệu nhạy cảm khác.
