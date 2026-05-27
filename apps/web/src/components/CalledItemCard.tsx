import type { BoardCell } from "@bingo/shared";

type CalledItemCardProps = {
  item?: Exclude<BoardCell, { type: "free" }>;
  previousItem?: Exclude<BoardCell, { type: "free" }>;
  emptyText?: string;
  compact?: boolean;
  animate?: boolean;
};

function itemDisplayValue(item?: Exclude<BoardCell, { type: "free" }>) {
  if (!item) return "--";
  if (item.type === "image") return "Image";
  return item.label ?? item.value;
}

function PreviousCall({ item }: { item?: Exclude<BoardCell, { type: "free" }> }) {
  return (
    <div className="flex aspect-square items-center justify-center self-start border-4 border-pixel-ink bg-white px-2 py-1 text-center text-pixel-ink shadow-[3px_3px_0_#10101f]">
      <p className="line-clamp-2 break-words font-pixel text-3xl font-black uppercase leading-tight sm:text-4xl">{itemDisplayValue(item)}</p>
    </div>
  );
}

function calledItemTitleSize(itemType: "number" | "text" | "image", compact: boolean) {
  if (itemType === "number") {
    return compact ? "text-6xl sm:text-7xl" : "text-7xl sm:text-9xl";
  }

  if (itemType === "image") {
    return compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl";
  }

  return compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl";
}

export function CalledItemCard({ item, previousItem, emptyText = "No items called yet", compact = false, animate = false }: CalledItemCardProps) {
  const animationClass = animate ? "called-item-enter" : "";

  if (!item) {
    return (
      <div className="pixel-panel grid gap-2 p-4 sm:p-5">
        <div className="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[7.25rem_1fr]">
          <p className="pixel-label text-pixel-pink">Last Call</p>
          <p className="pixel-label text-pixel-pink">Current Call</p>
        </div>
        <div className="grid grid-cols-[6rem_1fr] items-stretch gap-3 sm:grid-cols-[7.25rem_1fr]">
          <PreviousCall item={previousItem} />
          <div className="min-w-0">
            <p className="font-pixel text-4xl font-black leading-none text-pixel-ink sm:text-6xl">--</p>
            <p className="mt-2 font-bold text-slate-700">{emptyText}</p>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className={`pixel-panel grid gap-2 p-4 ${animationClass} sm:p-5`}>
        <div className="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[7.25rem_1fr]">
          <p className="pixel-label text-pixel-pink">Last Call</p>
          <p className="pixel-label text-pixel-pink">Current Call</p>
        </div>
        <div className="grid grid-cols-[6rem_1fr] items-stretch gap-3 sm:grid-cols-[7.25rem_1fr]">
          <PreviousCall item={previousItem} />
          <div className="min-w-0">
            <div className="border-4 border-pixel-ink bg-white p-2 shadow-[4px_4px_0_#10101f]">
              <img className={`${compact ? "h-24 sm:h-32" : "h-44 sm:h-52"} w-full object-cover`} src={item.value} alt={item.label ?? "Bingo image item"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pixel-panel grid gap-2 p-4 ${animationClass} sm:p-5`}>
      <div className="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[7.25rem_1fr]">
        <p className="pixel-label text-pixel-pink">Last Call</p>
        <p className="pixel-label text-pixel-pink">Current Call</p>
      </div>
      <div className="grid grid-cols-[6rem_1fr] items-stretch gap-3 sm:grid-cols-[7.25rem_1fr]">
        <PreviousCall item={previousItem} />
        <div className="min-w-0">
          <p className={`${calledItemTitleSize(item.type, compact)} line-clamp-2 break-words border-4 border-pixel-ink bg-pixel-gold px-3 py-2 text-center font-pixel font-black uppercase leading-tight text-pixel-ink shadow-[4px_4px_0_#10101f]`}>{item.label ?? item.value}</p>
        </div>
      </div>
    </div>
  );
}
