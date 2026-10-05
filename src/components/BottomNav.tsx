'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Home, ListFilter, QrCode, FileText, Coffee } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { label: t('nav_home'), href: '/', icon: Home },
    { label: t('nav_results'), href: '/results', icon: ListFilter },
    { label: t('nav_scan'), href: '/scan', icon: QrCode, isCenter: true },
    { label: t('nav_claims'), href: '/info', icon: FileText },
    { label: t('nav_support'), href: '/support', icon: Coffee }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FCFBF8]/95 backdrop-blur-md border-t border-[#DDD9CE] shadow-lg pb-safe">
      <div className="max-w-md mx-auto px-4 flex items-center justify-around h-16 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                id="bottom-nav-scan-cta"
                className="relative -top-4 flex flex-col items-center group"
                aria-label={item.label}
              >
                <div className="w-13 h-13 rounded-full bg-[#C9A227] hover:bg-[#b8911f] flex items-center justify-center text-[#1C1404] font-bold shadow-lg shadow-[#C9A227]/30 border-3 border-[#FCFBF8] group-hover:scale-105 group-active:scale-95 transition-all">
                  <Icon className="w-6 h-6 text-[#1C1404]" />
                </div>
                <span className="text-[10px] font-bold text-[#8B5E0D] mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
                isActive
                  ? 'text-[#8B5E0D] font-bold'
                  : 'text-[#6A655C] hover:text-[#1D2821]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

