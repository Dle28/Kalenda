import dynamic from "next/dynamic";

const Reveal = dynamic(() => import("@/components/Reveal").then((mod) => mod.default), { ssr: false });
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);
const Calendar = dynamic(() => import("@/src/components/Calendar").then((mod) => mod.default), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white page-enter">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 md:px-10 lg:px-16 lg:py-16">
        <header className="flex w-full items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-white/90 md:text-xl">TimeMarket</span>
          <WalletMultiButton />
        </header>

        {/* ...existing code... */}

        {/* Add Calendar Section */}
        <section id="explore-creators" className="space-y-6">
          <Reveal as="div">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Khám phá lịch Creator
            </h2>
            <p className="mt-2 text-white/70">
              Xem lịch trống và đặt chỗ với Creator yêu thích của bạn
            </p>
          </Reveal>
          
          <Reveal as="div" delay={100}>
            <Calendar />
          </Reveal>
        </section>
      </div>
    </main>
  );
}