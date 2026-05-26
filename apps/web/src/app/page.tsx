import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Bingo Realtime</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Tạo phòng Bingo cho nhóm đông người</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Host tạo phòng, người chơi nhập tên và tham gia bằng link. Game được đồng bộ realtime bằng Socket.IO.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700" href="/create">
            Tạo game mới
          </Link>
          <a className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700" href="#join">
            Nhập mã phòng
          </a>
        </div>
      </div>
    </main>
  );
}
