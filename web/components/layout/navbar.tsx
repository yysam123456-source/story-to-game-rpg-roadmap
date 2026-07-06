'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, Library, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: '首页', icon: BookOpen },
  { href: '/instant', label: '即时体验', icon: Sparkles },
  { href: '/library', label: '作品库', icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg">
          <BookOpen className="h-6 w-6" />
          <span>Story to Game</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
