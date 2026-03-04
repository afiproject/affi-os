import BottomNav from "@/components/shared/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
