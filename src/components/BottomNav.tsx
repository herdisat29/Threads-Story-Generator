import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface/90 backdrop-blur-md border-t border-border-subtle">
      <div className="max-w-[640px] mx-auto flex justify-around items-center h-16 px-gutter">
        <Link href="/" className="flex items-center justify-center text-primary scale-110 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        </Link>
        <Link href="/history" className="flex items-center justify-center text-on-secondary-container opacity-50 active:scale-90 transition-all duration-200 hover:opacity-100">
          <span className="material-symbols-outlined">history</span>
        </Link>
        <Link href="/" className="flex items-center justify-center text-on-secondary-container opacity-50 active:scale-90 transition-all duration-200 hover:opacity-100">
          <span className="material-symbols-outlined">add_circle</span>
        </Link>
        <Link href="/" className="flex items-center justify-center text-on-secondary-container opacity-50 active:scale-90 transition-all duration-200 hover:opacity-100">
          <span className="material-symbols-outlined">person</span>
        </Link>
      </div>
    </nav>
  );
}
