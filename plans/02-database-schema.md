# Thiết kế database

## Tổng quan

Database dùng PostgreSQL và Prisma ORM.

Các bảng chính:

- rooms
- room_items
- players
- called_items
- bingo_claims

## rooms

Lưu thông tin phòng Bingo.

```text
id                  uuid primary key
room_code           text unique not null
host_token_hash     text not null
title               text not null
status              text not null    waiting | playing | ended
board_size          integer not null default 5
has_free_cell       boolean not null default true
win_horizontal      boolean not null default true
win_vertical        boolean not null default true
win_diagonal        boolean not null default true
created_at          timestamp not null
updated_at          timestamp not null
ended_at            timestamp nullable
```

## room_items

Lưu toàn bộ item có thể xuất hiện trong game.

```text
id                  uuid primary key
room_id             uuid not null references rooms(id)
type                text not null    number | text | image
value               text not null
label               text nullable
metadata            jsonb nullable
created_at          timestamp not null
```

Ý nghĩa:

- type = number: value là số dạng chuỗi, ví dụ "42".
- type = text: value là từ khóa hoặc câu ngắn.
- type = image: value là URL hoặc storage key của ảnh, label là mô tả ngắn.

## players

Lưu người chơi và board riêng của họ.

```text
id                  uuid primary key
room_id             uuid not null references rooms(id)
name                text not null
player_token_hash   text not null
board_data          jsonb not null
marked_cells        jsonb not null default '[]'
is_winner           boolean not null default false
joined_at           timestamp not null
last_seen_at        timestamp not null
```

Ví dụ board_data:

```json
[
  [
    { "itemId": "item-1", "type": "text", "value": "React", "label": null },
    { "itemId": "item-2", "type": "number", "value": "42", "label": null }
  ]
]
```

Ví dụ marked_cells:

```json
[
  { "row": 0, "col": 1 },
  { "row": 2, "col": 2 }
]
```

## called_items

Lưu các item đã được host gọi.

```text
id                  uuid primary key
room_id             uuid not null references rooms(id)
room_item_id        uuid not null references room_items(id)
called_order        integer not null
called_at           timestamp not null
```

Ràng buộc nên có:

```text
unique(room_id, room_item_id)
unique(room_id, called_order)
```

## bingo_claims

Lưu các lần người chơi báo Bingo.

```text
id                  uuid primary key
room_id             uuid not null references rooms(id)
player_id           uuid not null references players(id)
status              text not null    pending | valid | invalid
winning_pattern     jsonb nullable
created_at          timestamp not null
reviewed_at         timestamp nullable
```

Ví dụ winning_pattern:

```json
{
  "type": "horizontal",
  "cells": [
    { "row": 1, "col": 0 },
    { "row": 1, "col": 1 },
    { "row": 1, "col": 2 },
    { "row": 1, "col": 3 },
    { "row": 1, "col": 4 }
  ]
}
```

## Index đề xuất

```text
rooms(room_code)
room_items(room_id)
players(room_id)
called_items(room_id)
bingo_claims(room_id)
bingo_claims(player_id)
```

## Lưu token

Không lưu host_token hoặc player_token dạng plain text.

Quy trình:

```text
Tạo token random
  -> gửi token plain cho client đúng một lần
  -> hash token
  -> lưu token hash vào database
```

Khi client gửi token lên:

```text
Nhận token plain
  -> hash hoặc verify bằng hàm so sánh bảo mật
  -> xác thực với hash đã lưu
```
