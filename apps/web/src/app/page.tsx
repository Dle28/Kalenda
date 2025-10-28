import dynamic from "next/dynamic";

const Reveal = dynamic(() => import("@/components/Reveal").then((mod) => mod.default), { ssr: false });
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white page-enter">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 md:px-10 lg:px-16 lg:py-16">
        <header className="flex w-full items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-white/90 md:text-xl">TimeMarket</span>
          <WalletMultiButton />
        </header>
      </div>
    </main>
  );
}
