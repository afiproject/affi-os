import BottomNav from "@/components/shared/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      {isDemo && (
        <div className="bg-[var(--color-accent)] px-3 py-1.5 text-center text-xs font-medium text-white">
          🎭 デモモード — データはすべてダミーです
        </div>
      )}
      {children}
      <BottomNav />
    </div>
  );
}
