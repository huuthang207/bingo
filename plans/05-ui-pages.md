# Kế hoạch UI và các trang

## Nguyên tắc UI

- Mobile-first, vì nhiều người chơi có thể dùng điện thoại.
- Host dashboard rõ ràng, ưu tiên thao tác nhanh.
- Board của player phải dễ bấm, ô đủ lớn.
- Item mới được gọi phải nổi bật.
- Trạng thái kết nối realtime cần dễ nhận biết.

## Trang chủ

Route:

```text
/
```

Chức năng:

- Nút tạo game mới.
- Ô nhập mã phòng để tham gia.
- Mô tả ngắn cách chơi.

Thành phần:

- Hero section.
- Create game button.
- Join room form.

## Trang tạo phòng

Route:

```text
/create
```

Chức năng:

- Nhập tên game.
- Chọn kích thước board.
- Bật/tắt FREE cell.
- Chọn luật thắng:
  - Ngang.
  - Dọc.
  - Chéo.
- Chọn kiểu item:
  - Số truyền thống.
  - Từ khóa.
  - Hình ảnh.
  - Hỗn hợp.
- Nhập danh sách item dạng text/number.
- Upload ảnh ở giai đoạn 2.
- Tạo phòng.

MVP input đề xuất:

```text
Textarea mỗi dòng một item.
Nếu item là số thì type number.
Nếu không phải số thì type text.
```

Sau khi tạo phòng:

- Hiển thị host link.
- Hiển thị player link.
- Nút copy link.
- Nút đi đến host dashboard.

## Trang host

Route:

```text
/host/[roomCode]?token=...
```

Chức năng:

- Hiển thị tên game.
- Hiển thị mã phòng.
- Hiển thị link mời player.
- Copy link.
- Xem số lượng player.
- Xem danh sách player.
- Start game.
- Call next item.
- Xem item mới nhất.
- Xem danh sách item đã gọi.
- Xem Bingo claims.
- End game.

Layout đề xuất:

```text
Header:
  Tên game, mã phòng, trạng thái kết nối

Main:
  Cột trái: điều khiển game
  Cột giữa: item mới nhất và item đã gọi
  Cột phải: player list và bingo claims
```

Trạng thái nút:

- Khi room waiting: hiện Start Game.
- Khi room playing: hiện Call Next Item và End Game.
- Khi room ended: disable các hành động điều khiển.

## Trang người chơi

Route:

```text
/play/[roomCode]
```

Trạng thái 1: Chưa join

- Hiển thị tên phòng.
- Form nhập tên.
- Nút tham gia.

Trạng thái 2: Đã join, game waiting

- Hiển thị board của player.
- Hiển thị thông báo chờ host bắt đầu.
- Hiển thị danh sách player hoặc số người chơi nếu cần.

Trạng thái 3: Game playing

- Hiển thị item mới nhất được gọi.
- Hiển thị board.
- Cho phép bấm ô hợp lệ.
- Hiển thị item đã gọi.
- Nút Bingo.

Trạng thái 4: Game ended

- Hiển thị kết quả.
- Hiển thị người thắng nếu có.

## Component chính

### BingoBoard

Props:

```ts
{
  board: BoardCell[][];
  markedCells: MarkedCell[];
  onCellClick?: (row: number, col: number) => void;
  readonly?: boolean;
}
```

Nhiệm vụ:

- Render board theo kích thước.
- Hiển thị number/text/image.
- Highlight ô đã mark.
- Disable ô không hợp lệ nếu cần.

### CalledItems

Hiển thị:

- Item mới nhất.
- Danh sách item đã gọi.

### HostControls

Hiển thị:

- Start Game.
- Call Next Item.
- End Game.
- Trạng thái room.

### PlayerList

Hiển thị:

- Tên player.
- Online/offline nếu có.
- Winner badge nếu thắng.

### BingoClaims

Hiển thị:

- Claim mới.
- Player name.
- Status valid/invalid/pending.
- Winning pattern nếu có.

## Responsive

### Mobile player

- Board chiếm phần lớn màn hình.
- Item mới nhất nằm trên board.
- Nút Bingo cố định gần cuối màn hình.

### Desktop host

- Dashboard nhiều cột.
- Item mới nhất lớn, dễ nhìn khi chiếu màn hình.

## Giai đoạn 2 UI cho hình ảnh

Thêm:

- Image uploader.
- Image preview grid.
- Crop hoặc validate aspect ratio nếu cần.
- Board cell hiển thị ảnh tối ưu.
- Modal xem ảnh lớn hơn khi item được gọi.
