'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu, X, Award, FileSearch, GraduationCap, Settings, BookOpen, Users, HelpCircle } from 'lucide-react';
import { WalletButton } from './WalletButton';

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/verify', label: 'Verify', icon: FileSearch },
    { href: '/issuer', label: 'Issuer Portal', icon: Award },
    { href: '/student', label: 'Student Vault', icon: GraduationCap },
    { href: '/admin', label: 'Admin', icon: Settings },
    { href: '/how-it-works', label: 'How it Works', icon: HelpCircle },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/docs', label: 'Docs', icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="border-b border-card-border bg-card/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">
              ChainCert
            </span>
            <span className="ml-2 hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
              DApp v1.0
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'text-white bg-white/10 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Wallet connect & Mobile menu toggle */}
        <div className="flex items-center gap-3">
          <WalletButton />

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-card-border bg-card/95 px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-brand-600/15 text-brand-300 font-semibold'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
