'use client';

import { usePathname } from 'next/navigation';
import { ChartLineUp, ClockCounterClockwise, House, Notebook } from '@phosphor-icons/react';
import { Dock } from '@/components/dock/dock';
import { CLIENT_TABS, clientTabIndex } from '@/lib/client-tabs';

/** Sekmelerin ikonları (Phosphor, tasarım §0); sıra ve adlar `client-tabs.ts`'te. */
const ICONS: Record<(typeof CLIENT_TABS)[number]['href'], React.ReactNode> = {
  '/me': <House />,
  '/me/gecmis': <ClockCounterClockwise />,
  '/me/ilerleme': <ChartLineUp />,
  '/me/programlar': <Notebook />,
};

/**
 * Danışan gezinmesi: PT'ninkiyle aynı dock (`components/dock/dock.tsx`, `dashboard/nav.tsx`), yalnız
 * telefon: ikonun altında kısa etiket, öğe ≥ 44 px, altta güvenli alan. Ayarlar ve çıkış dock'ta değil,
 * sağ üstteki avatar menüsünde (`client-menu.tsx`); Ayarlar'da hiçbir sekme etkin görünmez.
 */
export function ClientDock({ demo }: { demo?: { active: 0 | 1 | 2 | 3; navigate: (tab: 0 | 1 | 2 | 3) => void } }) {
  const active = clientTabIndex(usePathname());
  return (
    <div onClickCapture={demo ? (event) => {
      const href = (event.target as HTMLElement).closest('a')?.getAttribute('href');
      const index = CLIENT_TABS.findIndex(tab => tab.href === href);
      if (index < 0) return;
      event.preventDefault();
      demo.navigate(index as 0 | 1 | 2 | 3);
    } : undefined}>
      <Dock ariaLabel="Ana menü" items={CLIENT_TABS.map((tab, index) => ({ ...tab, icon: ICONS[tab.href], active: index === (demo ? demo.active : active) }))} />
    </div>
  );
}
