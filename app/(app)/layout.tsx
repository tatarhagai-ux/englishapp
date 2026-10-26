import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main
        className="mx-auto min-h-dvh max-w-xl px-4 pt-6 lg:ml-56 lg:max-w-3xl lg:px-10 lg:pt-10"
        style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
