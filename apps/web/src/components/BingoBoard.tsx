import type { BoardCell, MarkedCell } from "@bingo/shared";

type BingoBoardProps = {
  board: BoardCell[][];
  markedCells: MarkedCell[];
  calledItemIds?: Set<string>;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
};

function isMarked(markedCells: MarkedCell[], row: number, col: number) {
  return markedCells.some((cell) => cell.row === row && cell.col === col);
}

function renderCell(cell: BoardCell) {
  if (cell.type === "free") {
    return <span className="font-pixel text-sm font-black uppercase tracking-[0.12em] text-pixel-ink sm:text-lg">FREE</span>;
  }

  if (cell.type === "image") {
    return (
      <span className="flex h-full w-full items-center justify-center">
        <span className="block border-2 border-pixel-ink bg-white p-0.5 shadow-[2px_2px_0_#10101f]">
          <img className="h-12 w-12 object-cover sm:h-16 sm:w-16" src={cell.value} alt={cell.label ?? "Bingo item"} />
        </span>
      </span>
    );
  }

  if (cell.type === "number") {
    return <span className="line-clamp-2 font-pixel text-xl font-black leading-none sm:text-4xl md:text-5xl">{cell.label ?? cell.value}</span>;
  }

  return <span className="line-clamp-4 text-xs font-black leading-tight sm:text-base md:text-lg">{cell.label ?? cell.value}</span>;
}

export function BingoBoard({ board, markedCells, calledItemIds, onCellClick, disabled = false }: BingoBoardProps) {
  return (
    <div className="w-full overflow-hidden border-4 border-pixel-cream/90 bg-pixel-ink p-1.5 shadow-pixel sm:p-3" style={{ imageRendering: "pixelated" }}>
      <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))` }}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const marked = cell.type === "free" || isMarked(markedCells, rowIndex, colIndex);
            const callable = cell.type === "free" || calledItemIds?.has(cell.id) === true;
            const interactive = !disabled && callable && !marked;

            return (
              <button
                aria-disabled={!interactive}
                data-sound="card"
                aria-pressed={marked}
                className={`relative flex aspect-square min-h-12 items-center justify-center overflow-hidden border-2 p-1 text-center transition duration-150 sm:min-h-20 sm:border-4 sm:p-2 ${
                  marked
                    ? "border-pixel-ink bg-pixel-gold text-pixel-ink shadow-[inset_0_0_0_3px_rgba(16,16,31,0.18)]"
                    : "border-pixel-ink bg-pixel-paper text-pixel-ink"
                } ${interactive ? "cursor-pointer hover:bg-white active:translate-x-0.5 active:translate-y-0.5" : "cursor-default"}`}
                disabled={!interactive}
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onCellClick?.(rowIndex, colIndex)}
                type="button"
              >
                <span className={marked ? "opacity-90" : ""}>{renderCell(cell)}</span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
