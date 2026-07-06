## 1. Backend restart behavior

- [x] 1.1 Cập nhật `restart_game` trong `apps/server/src/socket.ts` để reset đầy đủ current-round state: called items, marked cells, winner flags, endedAt, boardRegenerationCount và current claims.
- [x] 1.2 Đảm bảo `restart_game` vẫn chỉ chấp nhận host token hợp lệ và room status `ended`, đồng thời không thay đổi roomCode, room items, board config hoặc win rules.
- [x] 1.3 Mở rộng hoặc chuẩn hóa payload realtime khi restart để client có đủ thông tin reset UI về `waiting`, called items rỗng, marked cells rỗng và lượt đổi bảng mới.
- [x] 1.4 Thêm/cập nhật server tests cho restart thành công, restart bị từ chối khi status không phải `ended`, token invalid, reset claims và reset boardRegenerationCount.

## 2. Host replay UI

- [x] 2.1 Cập nhật `apps/web/src/app/host/[roomCode]/HostRoomClient.tsx` để host có nút “Chơi lại phòng này” emit `restart_game` khi room đã `ended`.
- [x] 2.2 Giữ hành động “Tạo phòng mới” riêng biệt trỏ tới `/create` cho trường hợp host muốn đổi item/rule/config.
- [x] 2.3 Cập nhật handler `game_restarted` của host để clear error, called items, claims, winner flags và set room status về `waiting`.
- [x] 2.4 Cập nhật frontend types trong `apps/web/src/lib/types.ts` nếu payload restart được mở rộng.

## 3. Player restart experience

- [x] 3.1 Cập nhật handler `game_restarted` trong `apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx` để clear error/success/winner popup, called items, marked cells và set room status về `waiting`.
- [x] 3.2 Đảm bảo player nhận lại board-regeneration allowance sau restart và có thể dùng “Tạo bảng mới” khi phòng đang chờ.
- [x] 3.3 Đảm bảo player reload/reconnect sau restart restore được state hiện tại bằng token cũ qua existing player-state flow.

## 4. Join by room code

- [x] 4.1 Thêm UI “Tham gia phòng” trên landing page hoặc component client tương ứng để nhập roomCode.
- [x] 4.2 Normalize roomCode bằng trim + uppercase trước khi điều hướng tới `/play/{roomCode}`.
- [x] 4.3 Hiển thị validation message nếu roomCode trống hoặc chỉ có whitespace.
- [x] 4.4 Cập nhật copy trên home page để giải thích người chơi có thể join bằng link/QR hoặc mã phòng.

## 5. Verification

- [x] 5.1 Chạy server tests liên quan hoặc toàn bộ `npm --workspace apps/server run test`.
- [x] 5.2 Chạy `npm run typecheck` để xác nhận shared/web/server types hợp lệ.
- [x] 5.3 Chạy `npm run build` hoặc các build workspace cần thiết nếu typecheck/tests chưa đủ bao phủ.
- [ ] 5.4 Kiểm thử thủ công flow chính: tạo phòng, player join, start/end game, host chơi lại cùng phòng, player không cần link mới, join bằng mã phòng.