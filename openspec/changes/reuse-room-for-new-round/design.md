## Context

Ứng dụng hiện là realtime Bingo room với ba trạng thái `waiting | playing | ended`. Host tạo phòng nhận `hostToken` và `playerUrl`; player join qua `/play/{roomCode}` và token player được lưu trong `localStorage` theo roomCode. Khi ván kết thúc, UI host hiện có nút “Ván mới” trỏ về `/create`, khiến host tạo roomCode/link mới dù người chơi vừa tham gia phòng cũ.

Backend đã có Socket.IO event `restart_game` trong `apps/server/src/socket.ts`: chỉ host hợp lệ, room phải `ended`, sau đó xóa called items, reset marked cells/winner state, đưa room về `waiting`, và emit `game_restarted`. Frontend host/player cũng đã có listener `game_restarted`, nhưng host UI chưa gọi event này và reset client state chưa đầy đủ cho claims/board-regeneration UX.

## Goals / Non-Goals

**Goals:**

- Cho phép host chơi ván mới trong cùng roomCode/link sau khi ván hiện tại đã `ended`.
- Giữ người chơi trong phòng cũ: player đang online nhận realtime restart; player refresh vẫn restore bằng token cũ.
- Làm rõ UX giữa “Chơi lại phòng này” và “Tạo phòng mới”.
- Reset state thuộc ván vừa chơi để ván mới bắt đầu sạch: called items, marked cells, winner flags, claims hiển thị, và lượt đổi bảng phù hợp.
- Thêm entry point nhập mã phòng ở web để player có thể vào `/play/{roomCode}` khi không có link/QR.
- Giữ nguyên token security model và server-authoritative game rules.

**Non-Goals:**

- Không thêm data model `Round`/`GameSession` trong change này.
- Không thêm leaderboard hoặc lịch sử nhiều ván.
- Không cho host chỉnh item/rule trong cùng room restart; nếu cần đổi cấu hình, host tạo phòng mới.
- Không thay đổi endpoint join để cho player join khi room đang `playing` hoặc `ended`.
- Không thay đổi giới hạn upload/image flow.

## Decisions

### 1. Dùng `restart_game` để reuse cùng `Room`, không tạo model `Round`

Chọn triển khai ngắn hạn bằng cách hoàn thiện flow `restart_game` hiện có. Room tiếp tục là đơn vị lobby + current game state. Restart đưa room về `waiting` và dùng cùng `roomCode`, `hostToken`, player tokens.

**Rationale:**

- Phù hợp nhất với pain hiện tại: không phải gửi lại link.
- Ít migration và ít rủi ro hơn so với thêm `Round` table.
- Code đã có nền Socket.IO event và frontend listener.

**Alternatives considered:**

- Tạo room mới nhưng thêm trang “Tham gia phòng” bằng mã: chỉ giảm ma sát nhập link, không giải quyết việc host vẫn phải báo mã mới.
- Thêm `Round` model ngay: thiết kế sạch hơn cho lịch sử/leaderboard, nhưng scope lớn hơn đáng kể và chưa cần cho MVP.

### 2. Host UI tách hai hành động: “Chơi lại phòng này” và “Tạo phòng mới”

Nút hiện tại “Ván mới” trong host dashboard sẽ không nên chỉ dẫn mặc định về `/create` sau khi ván kết thúc. UI cần có hành động restart trong cùng phòng, chỉ enabled khi room `ended`; đồng thời vẫn giữ link tạo phòng mới cho trường hợp đổi item/rule.

Gợi ý copy:

- `Chơi lại phòng này`: emit `restart_game`.
- `Tạo phòng mới`: navigate `/create`.

**Rationale:** Người dùng cần hiểu restart giữ nguyên link/cấu hình/người chơi, còn tạo phòng mới là flow khác.

### 3. Restart reset dữ liệu ván hiện tại; không giữ claim history trong MVP

Khi restart, backend nên reset dữ liệu current-game gồm:

- `CalledItem` của room.
- `Player.markedCells` về `[]`.
- `Player.isWinner` về `false`.
- `Room.status` về `waiting`, `Room.endedAt` về `null`.
- `BingoClaim` của room được xóa hoặc không còn xuất hiện trong host current-state.
- `Player.boardRegenerationCount` reset về `0` để mỗi ván có lại số lượt đổi bảng.

**Rationale:** Không có model `Round`, nên giữ claims cũ trong same room sẽ làm host UI lẫn lộn giữa ván cũ và ván mới. Reset board-regeneration theo ván cũng hợp lý hơn cho minigame nhiều ván; nếu giữ theo phòng, người chơi sẽ hết lượt đổi sau vài ván.

**Alternative considered:** Giữ claims làm lịch sử. Cách này cần thêm UI phân biệt ván/round hoặc timestamp grouping; nếu không sẽ gây hiểu nhầm.

### 4. Không tự regenerate board cho tất cả player khi restart

Restart không bắt buộc server tạo board mới cho mọi player. Board cũ vẫn tồn tại, marked cells được clear, và khi phòng ở `waiting`, player có thể bấm “Tạo bảng mới” theo giới hạn lượt đổi của ván mới.

**Rationale:**

- Ít bất ngờ; player có quyền giữ board nếu muốn.
- Tránh server tự đổi board của player offline mà họ không nhận biết ngay.
- Giữ gần với cơ chế `regenerate_board` hiện có.

**Alternative considered:** Auto-regenerate tất cả boards khi restart. Điều này tạo cảm giác “ván mới” rõ hơn nhưng có thể gây bất ngờ, tốn xử lý, và yêu cầu cập nhật realtime board cho từng player.

### 5. `game_restarted` nên đủ dữ liệu để client reset UI nhất quán

Event `game_restarted` hiện chỉ có `roomCode` và `restartedAt`. Client có thể reset local state nhưng cần đảm bảo host/player không còn stale claims/winner/called items/marked cells. Có hai cách:

- Mở rộng `game_restarted` payload với status/calledItems/markedCells/boardRegenerationsRemaining tối thiểu.
- Hoặc sau event, client gọi lại REST state endpoints để hydrate đầy đủ.

Khuyến nghị: event payload vẫn nhỏ nhưng client state reset rõ ràng; nếu cần dữ liệu per-player như `boardRegenerationCount`, server có thể emit riêng qua `room_state` khi player re-joins hoặc include common reset values (`status: "waiting"`, `calledItems: []`, `markedCells: []`, `boardRegenerationCount: 0`, `boardRegenerationsRemaining: 3`).

### 6. “Tham gia phòng” bằng mã dùng route `/play/{roomCode}` hiện có

Landing page nên có form nhập mã phòng, normalize uppercase/trim, rồi điều hướng đến `/play/{roomCode}`. Không cần API mới nếu chỉ chuyển route; trang play hiện đã xử lý nhập tên/join và hiển thị lỗi từ `/rooms/{roomCode}/join`.

**Rationale:** Tận dụng flow join hiện có, giảm backend surface area, dễ test.

## Risks / Trade-offs

- **[Không có `Round` model nên mất lịch sử claims khi restart]** → Chấp nhận cho MVP; nếu sau này cần leaderboard/lịch sử nhiều ván thì tạo change riêng thêm `Round`.
- **[Player offline không nhận `game_restarted` ngay]** → Khi quay lại/refresh, `player-state` trả trạng thái hiện tại từ DB; token cũ vẫn restore được.
- **[Board cũ có thể bị dùng lại giữa các ván]** → Đây là quyết định có chủ ý; UI vẫn cho player đổi board khi room `waiting`, và reset lượt đổi bảng theo ván.
- **[Host có thể restart nhầm ngay sau khi ván kết thúc]** → Copy nút cần rõ “Chơi lại phòng này”; có thể cân nhắc confirm nếu sau này có nhiều hành động nguy hiểm, nhưng không bắt buộc trong MVP.
- **[Race condition restart/start]** → Server status checks phải đảm bảo chỉ restart room `ended` và chỉ start room `waiting`; transaction restart phải reset dữ liệu trước khi emit event.

## Migration Plan

- Không cần Prisma migration nếu chọn xóa claims hiện có và reset fields trên các model hiện tại.
- Triển khai backend trước để `restart_game` reset đầy đủ và emit state nhất quán.
- Triển khai frontend host/player để gọi và xử lý restart.
- Triển khai join-by-code UI trên landing page hoặc route nhỏ.
- Rollback đơn giản: ẩn nút restart trên host UI; backend event hiện có vẫn không ảnh hưởng nếu không được gọi.