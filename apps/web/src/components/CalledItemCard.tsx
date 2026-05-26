import type { BoardCell } from "@bingo/shared";

type CalledItemCardProps = {
  item?: Exclude<BoardCell, { type: "free" }>;
  order?: number;
  emptyText?: string;
  compact?: boolean;
  animate?: boolean;
};

export function CalledItemCard({ item, order, emptyText = "Chưa gọi item nào", compact = false, animate = false }: CalledItemCardProps) {
  const animationClass = animate ? "called-item-enter" : "";
  if (!item) {
    return (
      <div className="rounded-[1.5rem] bg-white p-6 text-slate-950">
        <p className="text-6xl font-black leading-none">—</p>
        <p className="mt-3 font-bold text-slate-500">{emptyText}</p>
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className={`grid gap-4 rounded-[1.5rem] bg-white p-4 text-slate-950 ${animationClass} ${compact ? "sm:grid-cols-[8rem_1fr]" : "sm:grid-cols-[12rem_1fr]"}`}>
        <div className="overflow-hidden rounded-[1.25rem] border-4 border-slate-950 bg-slate-100 shadow-[6px_6px_0_#0f172a]">
          <img className={`${compact ? "h-32" : "h-48"} w-full object-cover`} src={item.value} alt={item.label ?? "Bingo image item"} />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-600">Image item</p>
          <p className={`${compact ? "text-3xl" : "text-5xl"} mt-2 font-black leading-none`}>{item.label ?? "Hình ảnh"}</p>
          <p className="mt-3 break-all text-sm font-bold text-slate-500">{item.value}</p>
          {order ? <p className="mt-3 font-black text-slate-700">Lượt gọi #{order}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[1.5rem] bg-white p-6 text-slate-950 ${animationClass}`}>
      <p className={`${compact ? "text-4xl" : "text-6xl"} font-black leading-none`}>{item.label ?? item.value}</p>
      <p className="mt-3 font-bold text-slate-500">{order ? `Lượt gọi #${order}` : item.type === "number" ? "Number item" : "Text item"}</p>
    </div>
  );
}
