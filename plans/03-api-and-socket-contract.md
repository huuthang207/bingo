# API và Socket.IO contract

## REST API

REST API dùng cho các thao tác tạo dữ liệu ban đầu, join phòng, upload ảnh và lấy state khi refresh.

## POST /rooms

Tạo phòng mới.

### Request

```json
{
  "title": "Bingo công ty",
  "boardSize": 5,
  "hasFreeCell": true,
  "winRules": {
    "horizontal": true,
    "vertical": true,
    "diagonal": true
  },
  "items": [
    { "type": "number", "value": "1" },
    { "type": "text", "value": "React" }
  ]
}
```

### Response

```json
{
  "roomCode": "ABC123",
  "hostToken": "plain-host-token-returned-once",
  "hostUrl": "/host/ABC123?token=plain-host-token-returned-once",
  "playerUrl": "/play/ABC123"
}
```

## GET /rooms/:roomCode

Lấy thông tin public của phòng.

### Response

```json
{
  "roomCode": "ABC123",
  "title": "Bingo công ty",
  "status": "waiting",
  "boardSize": 5,
  "hasFreeCell": true,
  "winRules": {
    "horizontal": true,
    "vertical": true,
    "diagonal": true
  }
}
```

## POST /rooms/:roomCode/join

Người chơi tham gia phòng.

### Request

```json
{
  "name": "Nguyen Van A"
}
```

### Response

```json
{
  "playerId": "uuid",
  "playerToken": "plain-player-token-returned-once",
  "board": []
}
```

## GET /rooms/:roomCode/player-state

Khôi phục state người chơi khi refresh.

### Headers

```text
Authorization: Bearer <playerToken>
```

### Response

```json
{
  "playerId": "uuid",
  "name": "Nguyen Van A",
  "board": [],
  "markedCells": [],
  "calledItems": [],
  "roomStatus": "playing"
}
```

## GET /rooms/:roomCode/host-state

Lấy state cho host.

### Headers

```text
Authorization: Bearer <hostToken>
```

### Response

```json
{
  "roomCode": "ABC123",
  "status": "waiting",
  "players": [],
  "calledItems": [],
  "claims": []
}
```

## POST /uploads

Dùng ở giai đoạn hỗ trợ hình ảnh.

### Request

Multipart form data:

```text
file: image file
```

### Response

```json
{
  "url": "/uploads/image-name.webp",
  "label": "Tên ảnh nếu có"
}
```

## Socket.IO events

## Client gửi lên server

### host_join_room

Host kết nối vào phòng.

```json
{
  "roomCode": "ABC123",
  "hostToken": "plain-host-token"
}
```

### join_room

Player kết nối vào phòng.

```json
{
  "roomCode": "ABC123",
  "playerToken": "plain-player-token"
}
```

### start_game

Host bắt đầu game.

```json
{
  "roomCode": "ABC123",
  "hostToken": "plain-host-token"
}
```

### call_next_item

Host gọi item tiếp theo.

```json
{
  "roomCode": "ABC123",
  "hostToken": "plain-host-token"
}
```

### mark_cell

Player đánh dấu một ô.

```json
{
  "roomCode": "ABC123",
  "playerToken": "plain-player-token",
  "row": 1,
  "col": 3
}
```

### claim_bingo

Player báo Bingo.

```json
{
  "roomCode": "ABC123",
  "playerToken": "plain-player-token"
}
```

### verify_bingo

Host xác nhận hoặc xử lý claim.

```json
{
  "roomCode": "ABC123",
  "hostToken": "plain-host-token",
  "claimId": "uuid",
  "status": "valid"
}
```

### end_game

Host kết thúc game.

```json
{
  "roomCode": "ABC123",
  "hostToken": "plain-host-token"
}
```

## Server gửi xuống client

### room_state

Gửi state ban đầu theo role.

```json
{
  "roomCode": "ABC123",
  "status": "playing",
  "calledItems": []
}
```

### player_joined

Thông báo cho host khi có player mới.

```json
{
  "playerId": "uuid",
  "name": "Nguyen Van A"
}
```

### player_left

Thông báo player mất kết nối.

```json
{
  "playerId": "uuid"
}
```

### game_started

Thông báo game bắt đầu.

```json
{
  "roomCode": "ABC123",
  "startedAt": "2026-05-26T00:00:00.000Z"
}
```

### item_called

Thông báo item mới được gọi.

```json
{
  "item": {
    "id": "uuid",
    "type": "text",
    "value": "React",
    "label": null
  },
  "calledOrder": 7
}
```

### cell_marked

Gửi riêng cho player sau khi server chấp nhận mark cell.

```json
{
  "row": 1,
  "col": 3,
  "markedCells": []
}
```

### bingo_claimed

Gửi cho host khi có player báo Bingo.

```json
{
  "claimId": "uuid",
  "playerId": "uuid",
  "playerName": "Nguyen Van A",
  "status": "valid",
  "winningPattern": {}
}
```

### bingo_verified

Gửi cho room khi Bingo được xác nhận.

```json
{
  "claimId": "uuid",
  "playerId": "uuid",
  "playerName": "Nguyen Van A",
  "status": "valid"
}
```

### game_ended

Thông báo game kết thúc.

```json
{
  "roomCode": "ABC123",
  "endedAt": "2026-05-26T00:00:00.000Z"
}
```

### error_message

Thông báo lỗi cho client.

```json
{
  "code": "INVALID_TOKEN",
  "message": "Token không hợp lệ."
}
```

## Quy tắc payload

- Không gửi board của player này cho player khác.
- Host không cần nhận toàn bộ board của tất cả player trong MVP.
- Event realtime nên nhỏ, chỉ gửi phần thay đổi.
- Khi refresh, client gọi REST API để lấy lại state đầy đủ.
