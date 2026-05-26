-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "room_code" TEXT NOT NULL,
    "host_token_hash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "board_size" INTEGER NOT NULL DEFAULT 5,
    "has_free_cell" BOOLEAN NOT NULL DEFAULT true,
    "win_horizontal" BOOLEAN NOT NULL DEFAULT true,
    "win_vertical" BOOLEAN NOT NULL DEFAULT true,
    "win_diagonal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_items" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "player_token_hash" TEXT NOT NULL,
    "board_data" JSONB NOT NULL,
    "marked_cells" JSONB NOT NULL DEFAULT '[]',
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "called_items" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "room_item_id" TEXT NOT NULL,
    "called_order" INTEGER NOT NULL,
    "called_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "called_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_claims" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "winning_pattern" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "bingo_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_code_key" ON "rooms"("room_code");

-- CreateIndex
CREATE INDEX "room_items_room_id_idx" ON "room_items"("room_id");

-- CreateIndex
CREATE INDEX "players_room_id_idx" ON "players"("room_id");

-- CreateIndex
CREATE INDEX "called_items_room_id_idx" ON "called_items"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "called_items_room_id_room_item_id_key" ON "called_items"("room_id", "room_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "called_items_room_id_called_order_key" ON "called_items"("room_id", "called_order");

-- CreateIndex
CREATE INDEX "bingo_claims_room_id_idx" ON "bingo_claims"("room_id");

-- CreateIndex
CREATE INDEX "bingo_claims_player_id_idx" ON "bingo_claims"("player_id");

-- AddForeignKey
ALTER TABLE "room_items" ADD CONSTRAINT "room_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "called_items" ADD CONSTRAINT "called_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "called_items" ADD CONSTRAINT "called_items_room_item_id_fkey" FOREIGN KEY ("room_item_id") REFERENCES "room_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_claims" ADD CONSTRAINT "bingo_claims_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_claims" ADD CONSTRAINT "bingo_claims_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
