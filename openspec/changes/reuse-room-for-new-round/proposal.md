## Why

Hiện tại khi một ván Bingo kết thúc, host bấm “Ván mới” sẽ đi qua flow tạo phòng mới, làm phát sinh roomCode/link mới và buộc host phải gửi lại link cho người chơi. Điều này gây ma sát không cần thiết cho minigame chơi nhiều ván liên tiếp, trong khi backend đã có nền tảng restart cùng phòng.

## What Changes

- Đổi trải nghiệm sau khi ván kết thúc để host có thể “Chơi lại phòng này” trong cùng roomCode/link hiện tại.
- Khi host restart ván, phòng chuyển về trạng thái `waiting`, các dữ liệu thuộc ván vừa chơi được reset phù hợp, và người chơi đang ở trong phòng nhận realtime event để tiếp tục ván mới mà không cần link mới.
- Giữ lựa chọn “Tạo phòng mới” như hành động riêng khi host muốn đổi bộ item, luật thắng hoặc cấu hình phòng.
- Thêm entry point “Tham gia phòng” bằng mã phòng để người chơi có thể vào lại phòng dễ hơn khi không có link/QR.
- Không thay đổi cơ chế token bảo mật: host/player token vẫn được tạo một lần, lưu hash trên server, và player restore bằng token localStorage theo roomCode.

## Capabilities

### New Capabilities
- `room-restart-flow`: Quy định hành vi chơi lại trong cùng phòng, reset state của ván, realtime update cho host/player, và phân biệt với tạo phòng mới.
- `join-room-by-code`: Quy định entry point cho người chơi nhập mã phòng và chuyển tới flow join hiện có.

### Modified Capabilities

Không có spec hiện hữu trong `openspec/specs/` cần sửa; repository hiện chưa có main spec được lưu tại đây.

## Impact

- Backend Socket.IO restart flow tại `apps/server/src/socket.ts`.
- REST room join/restore behavior tại `apps/server/src/routes/rooms.ts` nếu cần bổ sung dữ liệu trạng thái cho UI.
- Host UI tại `apps/web/src/app/host/[roomCode]/HostRoomClient.tsx`, đặc biệt vùng điều khiển sau khi room `ended`.
- Player UI tại `apps/web/src/app/play/[roomCode]/PlayRoomClient.tsx`, đặc biệt xử lý `game_restarted`, board regeneration và thông báo chờ ván mới.
- Landing/join UI tại `apps/web/src/app/page.tsx` hoặc route mới nếu cần cho “Tham gia phòng”.
- Shared frontend types tại `apps/web/src/lib/types.ts` nếu event/response contract được mở rộng.
- Có thể cần cập nhật test server cho `restart_game` và reset state.