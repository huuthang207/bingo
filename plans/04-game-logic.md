# Logic game Bingo

## Loại item

Mỗi item trong game có thể là số, chữ hoặc hình ảnh.

```ts
type BingoItem = {
  id: string;
  type: "number" | "text" | "image";
  value: string;
  label?: string | null;
};
```

## Sinh board

Input:

- Danh sách room_items.
- boardSize, ví dụ 5.
- hasFreeCell.

Quy trình:

```text
1. Kiểm tra số lượng item có đủ cho board không.
2. Nếu board 5x5 và có FREE cell, cần tối thiểu 24 item.
3. Nếu không có FREE cell, cần tối thiểu 25 item.
4. Shuffle danh sách item.
5. Chọn số item cần thiết.
6. Điền vào ma trận boardSize x boardSize.
7. Nếu hasFreeCell, đặt ô giữa là FREE.
8. Lưu board_data vào players.board_data.
```

Ví dụ ô FREE:

```json
{
  "type": "free",
  "value": "FREE",
  "label": "FREE"
}
```

## Gọi item

Host gọi item tiếp theo bằng event call_next_item.

Server xử lý:

```text
1. Xác thực host token.
2. Kiểm tra room đang ở trạng thái playing.
3. Lấy danh sách item chưa gọi.
4. Random một item hoặc lấy theo thứ tự đã shuffle trước.
5. Lưu vào called_items.
6. Broadcast item_called tới room.
```

Khuyến nghị MVP:

- Random từ danh sách chưa gọi tại thời điểm gọi.
- Không cần pre-generate thứ tự gọi.

## Mark cell

Player đánh dấu ô trên board.

Server xử lý:

```text
1. Xác thực player token.
2. Kiểm tra player thuộc room.
3. Kiểm tra room đang playing.
4. Kiểm tra row và col nằm trong board.
5. Lấy item trong ô tương ứng.
6. Nếu là FREE cell, cho phép mark.
7. Nếu không phải FREE, kiểm tra item đã nằm trong called_items.
8. Nếu hợp lệ, cập nhật marked_cells.
9. Gửi cell_marked cho player.
```

Không cho phép player mark item chưa được gọi.

## Claim Bingo

Player bấm Bingo.

Server xử lý:

```text
1. Xác thực player token.
2. Load board_data của player.
3. Load marked_cells của player.
4. Load called_items của room.
5. Tự tính lại các ô hợp lệ được mark.
6. Kiểm tra theo win rules của room.
7. Tạo bingo_claims với status valid hoặc invalid.
8. Nếu valid, có thể set players.is_winner = true.
9. Gửi bingo_claimed cho host.
10. Nếu muốn công bố ngay, gửi bingo_verified cho cả room.
```

## Kiểm tra luật thắng

Input:

```ts
type CheckWinInput = {
  board: BoardCell[][];
  markedCells: MarkedCell[];
  winRules: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
  };
};
```

Output:

```ts
type CheckWinResult = {
  valid: boolean;
  pattern?: {
    type: "horizontal" | "vertical" | "diagonal";
    cells: { row: number; col: number }[];
  };
};
```

## Hàng ngang

Với từng row:

```text
Nếu tất cả col trong row đều marked hoặc là FREE cell -> thắng horizontal.
```

## Hàng dọc

Với từng col:

```text
Nếu tất cả row trong col đều marked hoặc là FREE cell -> thắng vertical.
```

## Đường chéo

Có hai đường chéo:

```text
1. Từ trên trái xuống dưới phải.
2. Từ trên phải xuống dưới trái.
```

Nếu host bật diagonal và một trong hai đường chéo hoàn tất, player thắng.

## Chống gian lận

Server không tin client ở các điểm sau:

- Client gửi marked_cells đầy đủ.
- Client tự báo ô đã được gọi.
- Client tự báo kết quả Bingo.
- Client sửa board trong localStorage.

Server luôn kiểm tra bằng state trong database:

- board_data từ players.
- called_items từ database.
- win_rules từ rooms.
- marked_cells đã được server chấp nhận.

## Trường hợp đặc biệt

### Hết item để gọi

Nếu không còn item chưa gọi:

```text
Server trả error_message code NO_ITEMS_LEFT.
```

### Player reconnect

Khi reconnect:

```text
1. Client gửi playerToken.
2. Server xác thực.
3. Server gửi lại room_state hoặc client gọi REST player-state.
```

### Host refresh

Host link có token trong URL.

Khi refresh:

```text
1. Frontend đọc token từ query string.
2. Gọi host-state.
3. Kết nối lại Socket.IO bằng host_join_room.
```
