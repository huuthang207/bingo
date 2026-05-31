import Link from "next/link";
import { PageShell, PixelPanel, StatusBadge } from "@/components/PixelUi";

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
              Cách tham gia
            </a>
          </div>
        </section>

        <PixelPanel className="p-5 sm:p-6" id="join">
          <p className="pixel-label text-pixel-pink">Cách chơi</p>
          <div className="mt-5 grid gap-4">
            {[
              ["01", "Người dẫn tạo phòng rồi chia sẻ mã QR hoặc đường link."],
              ["02", "Người chơi nhập tên để nhận bảng Bingo riêng."],
              ["03", "Khi thấy bảng đã hoàn chỉnh, bấm BINGO để máy chủ kiểm tra."],
            ].map(([step, text]) => (
              <div className="grid grid-cols-[3.5rem_1fr] gap-3 border-4 border-pixel-ink bg-white p-3 shadow-[4px_4px_0_#10101f]" key={step}>
                <span className="flex min-h-11 items-center justify-center bg-pixel-gold font-pixel text-xl font-black text-pixel-ink">{step}</span>
                <p className="self-center font-bold leading-6 text-slate-700">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 border-4 border-pixel-ink bg-pixel-cyan p-4 font-black text-pixel-ink shadow-[4px_4px_0_#10101f]">
            Đã có link phòng? Mở link người chơi từ người dẫn để vào thẳng bảng Bingo của bạn.
          </p>
        </PixelPanel>
      </div>
    </PageShell>
  );
}
