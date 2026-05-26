import type { BoardCell, MarkedCell } from "@bingo/shared";

type BingoBoardProps = {
  board: BoardCell[][];
  markedCells: MarkedCell[];
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
};

function isMarked(markedCells: MarkedCell[], row: number, col: number) {
  return markedCells.some((cell) => cell.row === row && cell.col === col);
}

function renderCell(cell: BoardCell) {
  if (cell.type === "free") {
    return <span className="text-lg font-black tracking-[0.24em] text-amber-950">FREE</span>;
  }

  if (cell.type === "image") {
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-2">
        <img className="h-10 w-10 rounded-xl object-cover shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl" src={cell.value} alt={cell.label ?? "Bingo item"} />
        {cell.label ? <span className="line-clamp-2 text-[0.65rem] font-bold leading-tight sm:text-xs">{cell.label}</span> : null}
      </span>
    );
  }

  return <span className="line-clamp-3 text-xs font-black leading-tight sm:text-base">{cell.value}</span>;
}

export function BingoBoard({ board, markedCells, onCellClick, disabled = false }: BingoBoardProps) {
  return (
    <div className="grid gap-1.5 rounded-[1.25rem] border-2 border-slate-950 bg-slate-950 p-1.5 shadow-[6px_6px_0_#0f172a] sm:gap-2 sm:rounded-[2rem] sm:border-4 sm:p-3 sm:shadow-[12px_12px_0_#0f172a]" style={{ gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))` }}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const marked = cell.type === "free" || isMarked(markedCells, rowIndex, colIndex);

          return (
            <button
              className={`relative aspect-square overflow-hidden rounded-xl border-2 border-slate-950 p-1 text-center transition duration-150 sm:rounded-2xl sm:p-2 ${
                marked
                  ? "scale-[0.98] bg-amber-300 text-slate-950 shadow-[inset_0_0_0_4px_rgba(15,23,42,0.12),0_0_0_4px_rgba(250,204,21,0.35)]"
                  : "bg-white text-slate-900 hover:-translate-y-0.5 hover:bg-cyan-50"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              disabled={disabled || cell.type === "free"}
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick?.(rowIndex, colIndex)}
              type="button"
            >
              {marked ? <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-lime-300 text-[0.65rem] font-black sm:right-1 sm:top-1 sm:h-6 sm:w-6 sm:text-xs">✓</span> : null}
              {renderCell(cell)}
            </button>
          );
        }),
      )}
    </div>
  );
}
