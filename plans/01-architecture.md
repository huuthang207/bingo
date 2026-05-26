# Kiến trúc hệ thống

## Mô hình tổng thể

```text
Next.js frontend
  |
  | REST API
  | Socket.IO client
  v
Node.js backend + Socket.IO
  |
  | Prisma
  v
PostgreSQL
```

## Thành phần chính

### Frontend

Frontend dùng Next.js để xây dựng giao diện cho host và người chơi.

Các nhiệm vụ chính:

- Hiển thị trang tạo phòng.
- Hiển thị trang host điều khiển game.
- Hiển thị trang người chơi.
- Kết nối Socket.IO tới backend.
- Lưu player token trong localStorage.
- Gửi request REST cho các hành động không realtime hoặc cần tạo dữ liệu ban đầu.

### Backend

Backend dùng Node.js và Socket.IO.

Các nhiệm vụ chính:

- Cung cấp REST API tạo phòng, join phòng, upload ảnh sau này.
- Xử lý kết nối realtime.
- Xác thực host token và player token.
- Quản lý state game.
- Broadcast event tới đúng room.
- Kiểm tra logic Bingo ở server.
- Ghi state quan trọng vào PostgreSQL.

### Database

PostgreSQL lưu:

- Phòng chơi.
- Item của từng phòng.
- Người chơi.
- Board của người chơi.
- Cell đã đánh dấu.
- Item đã gọi.
- Claim Bingo.

## Cấu trúc thư mục đề xuất

```text
bingo/
  apps/
    web/
      src/
        app/
          page.tsx
          create/
            page.tsx
          host/
            [roomCode]/
              page.tsx
          play/
            [roomCode]/
              page.tsx
        components/
          BingoBoard.tsx
          CalledItems.tsx
          HostControls.tsx
          PlayerJoinForm.tsx
          PlayerList.tsx
        lib/
          api.ts
          socket.ts

    server/
      src/
        index.ts
        app.ts
        socket.ts
        routes/
          rooms.ts
          players.ts
          uploads.ts
        services/
          roomService.ts
          playerService.ts
          gameService.ts
        bingo/
          generateBoard.ts
          checkWin.ts
        middleware/
          authHost.ts
          authPlayer.ts
        prisma/
          schema.prisma

  packages/
    shared/
      src/
        types.ts
        validation.ts
        constants.ts
```

## Luồng tạo phòng

```text
Host mở /create
  -> nhập cấu hình game
  -> frontend gửi POST /rooms
  -> backend tạo room_code và host_token
  -> backend hash host_token trước khi lưu database
  -> backend trả về host link và player link
```

## Luồng join phòng

```text
Player mở /play/[roomCode]
  -> nhập tên
  -> frontend gửi POST /rooms/:roomCode/join
  -> backend tạo player_token
  -> backend sinh board riêng
  -> backend hash player_token trước khi lưu database
  -> frontend lưu player_token ở localStorage
```

## Luồng realtime

```text
Client kết nối Socket.IO
  -> gửi join_room hoặc host_join_room
  -> backend xác thực token nếu cần
  -> socket.join(room theo roomCode)
  -> server gửi room_state phù hợp với role
```

## Phân tách room Socket.IO

```text
room:{roomCode}      Tất cả client trong phòng
host:{roomCode}      Host của phòng
player:{playerId}    Kênh riêng của từng player
```

## Nguyên tắc mở rộng

MVP có thể chạy một backend instance.

Khi cần scale nhiều instance:

- Thêm Redis.
- Dùng @socket.io/redis-adapter.
- Lưu toàn bộ state quan trọng trong PostgreSQL.
- Không phụ thuộc vào memory local của process cho dữ liệu game quan trọng.
