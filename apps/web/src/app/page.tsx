import Link from "next/link";
import { PageShell, PixelPanel, StatusBadge } from "@/components/PixelUi";
import { JoinRoomByCodeForm } from "./JoinRoomByCodeForm";

export default function HomePage() {
  return (
    <PageShell className="flex items-center py-10 sm:py-16" narrow>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="pixel-panel-dark p-5 sm:p-8 lg:p-10">
          <StatusBadge tone="info">Bingo Realtime</StatusBadge>
          <h1 className="pixel-title mt-6 text-4xl leading-tight sm:text-6xl lg:text-7xl">Tiệc Bingo Pixel</h1>
          <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-pixel-muted sm:text-xl">
            Tạo phòng Bingo thời gian thực cho nhóm đông người: người dẫn gọi từng mục, người chơi đánh dấu bảng trên điện thoại, và màn hình lớn cập nhật như bảng điểm arcade.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link className="pixel-button pixel-button-primary w-full" href="/create">
              Tạo ván mới
            </Link>
            <a className="pixel-button pixel-button-secondary w-full" href="#join">
              Tham gia phòng
            </a>
          </div>
        </section>

        <PixelPanel className="p-5 sm:p-6" id="join">
          <p className="pixel-label text-pixel-pink">Tham gia phòng</p>
          <h2 className="mt-3 font-pixel text-2xl font-black uppercase text-pixel-ink">Nhập mã từ người dẫn</h2>
          <p className="mt-3 font-bold leading-7 text-slate-700">
            Người chơi có thể quét QR, mở link phòng, hoặc nhập mã phòng để vào cùng một phòng Bingo.
          </p>
          <JoinRoomByCodeForm />
          <div className="mt-6 grid gap-4">
            {[
              ["01", "Người dẫn tạo phòng rồi chia sẻ mã QR, đường link hoặc mã phòng."],
              ["02", "Người chơi nhập tên để nhận bảng Bingo riêng."],
              ["03", "Khi thấy bảng đã hoàn chỉnh, bấm BINGO để máy chủ kiểm tra."],
            ].map(([step, text]) => (
              <div className="grid grid-cols-[3.5rem_1fr] gap-3 border-4 border-pixel-ink bg-white p-3 shadow-[4px_4px_0_#10101f]" key={step}>
                <span className="flex min-h-11 items-center justify-center bg-pixel-gold font-pixel text-xl font-black text-pixel-ink">{step}</span>
                <p className="self-center font-bold leading-6 text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </PixelPanel>
      </div>
    </PageShell>
  );
}
