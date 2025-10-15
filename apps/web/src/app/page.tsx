"use client";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 md:px-10 lg:px-16 lg:py-16">
        <header className="flex w-full items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-white/90 md:text-xl">TimeMarket</span>
          <WalletMultiButton />
        </header>

        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 md:space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Đặt lịch với Web3
            </span>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Đặt lịch số thông minh
            </h1>
            <p className="max-w-xl text-base text-white/70 md:text-lg">
              Quản lý lịch hẹn, chia sẻ quyền truy cập và nhận thanh toán liền mạch cùng các Creator yêu thích.
              Tất cả được bảo chứng bởi Solana.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#explore-creators"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 md:px-8 md:py-3.5 md:text-base"
              >
                Khám phá Creator
              </a>
              <a
                href="#become-creator"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:text-white md:px-8 md:py-3.5 md:text-base"
              >
                Trở thành Creator
              </a>
            </div>
          </div>

          <div className="relative grid gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_-30px_rgba(15,118,110,0.7)] backdrop-blur">
              <div className="flex items-center justify-between text-sm font-medium text-white/80">
                <span>Lịch của bạn</span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">Tháng 10</span>
              </div>
              <div className="mt-6 space-y-4 text-white/80">
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">NFT Workshop</p>
                    <span className="text-xs text-white/60">T2 • 19:00 - 20:30</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300">Đã xác nhận</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">1:1 Coaching</p>
                    <span className="text-xs text-white/60">T4 • 09:00 - 10:00</span>
                  </div>
                  <span className="text-xs font-semibold text-white/60">Đang chờ</span>
                </div>
              </div>
            </div>

            <div className="ml-auto w-full max-w-[280px] rounded-3xl border border-white/10 bg-emerald-500/10 p-6 text-white shadow-[0_16px_40px_-28px_rgba(59,130,246,0.6)] backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Creator nổi bật</p>
              <div className="mt-4 space-y-1">
                <p className="text-lg font-semibold text-white">Linh DAO</p>
                <span className="text-sm text-white/70">Productivity Coach</span>
              </div>
              <div className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
                “Chỉ cần gửi lịch, phần còn lại đã có TimeMarket lo.”
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
