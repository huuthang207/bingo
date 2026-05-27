import type { BoardCell } from "@bingo/shared";

type CalledItemCardProps = {
  item?: Exclude<BoardCell, { type: "free" }>;
  order?: number;
  emptyText?: string;
  compact?: boolean;
  animate?: boolean;
};

function CallOrder({ order }: { order?: number }) {
  return (
    <div className="flex min-w-16 flex-col items-center justify-center border-2 border-pixel-ink bg-pixel-paper px-2 py-2 text-pixel-ink shadow-[3px_3px_0_#10101f] sm:min-w-20">
      <span className="font-pixel text-[0.65rem] font-black uppercase tracking-[0.08em] text-slate-600">Call</span>
      <span className="font-pixel text-xl font-black leading-none text-slate-700 sm:text-2xl">{order ?? "--"}</span>
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

export function CalledItemCard({ item, order, emptyText = "No items called yet", compact = false, animate = false }: CalledItemCardProps) {
  const animationClass = animate ? "called-item-enter" : "";

  if (!item) {
    return (
      <div className="pixel-panel grid grid-cols-[auto_1fr] items-center gap-4 p-4 sm:p-5">
        <CallOrder />
        <div>
          <p className="font-pixel text-4xl font-black leading-none text-pixel-ink sm:text-6xl">--</p>
          <p className="mt-2 font-bold text-slate-700">{emptyText}</p>
        </div>
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className={`pixel-panel grid gap-4 p-4 ${animationClass} ${compact ? "grid-cols-[auto_1fr]" : "sm:grid-cols-[auto_13rem_1fr] sm:p-5"}`}>
        <CallOrder order={order} />
        <div className="min-w-0">
          <div className="border-4 border-pixel-ink bg-white p-2 shadow-[4px_4px_0_#10101f]">
            <img className={`${compact ? "h-24 sm:h-32" : "h-44 sm:h-52"} w-full object-cover`} src={item.value} alt={item.label ?? "Bingo image item"} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pixel-panel grid grid-cols-[auto_1fr] items-center gap-4 p-4 ${animationClass} sm:gap-5 sm:p-5`}>
      <CallOrder order={order} />
      <div className="min-w-0">
        <p className="pixel-label text-pixel-pink">{item.type === "number" ? "Number item" : "Text item"}</p>
        <p className={`${calledItemTitleSize(item.type, compact)} mt-1 line-clamp-2 break-words border-4 border-pixel-ink bg-pixel-gold px-3 py-2 text-center font-pixel font-black uppercase leading-tight text-pixel-ink shadow-[4px_4px_0_#10101f]`}>{item.label ?? item.value}</p>
      </div>
    </div>
  );
}
