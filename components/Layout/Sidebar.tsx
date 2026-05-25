'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Film } from 'lucide-react';

const links = [
  { href: '/', label: 'Visão Geral', Icon: LayoutDashboard },
  { href: '/segmento', label: 'Por Segmento', Icon: Users },
  { href: '/criativo', label: 'Por Criativo', Icon: Film },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-56 shrink-0 border-r border-[#262626] bg-[#0a0a0a] flex flex-col py-6 gap-1 min-h-screen">
      {links.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
              active
                ? 'bg-[#1c1c1c] text-[#fafafa]'
                : 'text-[#737373] hover:text-[#a3a3a3] hover:bg-[#141414]'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
