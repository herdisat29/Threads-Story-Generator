import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface border-b border-border-subtle">
      <div className="max-w-[640px] mx-auto px-margin-mobile flex justify-between items-center h-16">
        <div className="flex items-center gap-stack-sm">
          <span className="material-symbols-outlined text-primary">menu</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/screen.png" alt="Threads Story Logo" width={32} height={32} className="rounded-md object-cover" />
          <h1 className="font-display-lg text-[24px] tracking-tighter text-primary font-bold">Threads Story</h1>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle bg-gray-200 flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-500 text-sm">person</span>
        </div>
      </div>
    </header>
  );
}
