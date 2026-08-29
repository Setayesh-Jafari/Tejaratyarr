import React from 'react';
import { InventoryUnit } from '../types';
import { Warehouse, Ship, Hourglass, Coins } from 'lucide-react';
import { StatCard } from './ui/Chrome';
import { fmtBillion } from '../lib/format';

interface MetricsOverviewProps {
  inventory: InventoryUnit[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ inventory }) => {
  const totalClearedUnits = inventory
    .filter((i) => i.status === 'موجود در انبار (ترخیص شده)' || i.status === 'رزرو مشتری / پیش‌فروش')
    .reduce((acc, item) => acc + item.stockQty, 0);

  const totalInTransitOrCustoms = inventory
    .filter((i) => i.status === 'در گمرک (در حال ترخیص)' || i.status === 'در حال ترانزیت بین‌المللی')
    .reduce((acc, item) => acc + item.stockQty, 0);

  const totalAwaitingFx = inventory.filter(
    (i) => i.status === 'در انتظار تخصیص ارز و ثبت سفارش' || i.complianceGate === 'در حال بازرسی استاندارد (COI)'
  ).length;

  const totalInventoryValueToman = inventory.reduce((acc, item) => {
    return acc + item.landedCostToman * (item.unit.includes('تن') || item.unit.includes('کیسه') ? Math.min(item.stockQty, 10) : item.stockQty);
  }, 0);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
      <StatCard
        label="کالاهای ترخیص‌شده در انبار"
        value={totalClearedUnits.toLocaleString('fa-IR')}
        unit="واحد"
        badge={{ text: 'آماده فروش', tone: 'emerald' }}
        icon={<Warehouse className="w-3.5 h-3.5" />}
      />
      <StatCard
        label="در گمرک و ترانزیت بین‌المللی"
        value={totalInTransitOrCustoms.toLocaleString('fa-IR')}
        unit="واحد فعال"
        badge={{ text: 'در حال ترخیص', tone: 'blue' }}
        icon={<Ship className="w-3.5 h-3.5" />}
      />
      <StatCard
        label="صف تخصیص ارز و بازرسی استاندارد"
        value={totalAwaitingFx.toLocaleString('fa-IR')}
        unit="پرونده صمت"
        badge={{ text: 'در انتظار', tone: 'amber' }}
        icon={<Hourglass className="w-3.5 h-3.5" />}
      />
      <StatCard
        label="ارزش بهای تمام‌شده سبد"
        value={fmtBillion(totalInventoryValueToman)}
        unit="میلیارد ت"
        badge={{ text: 'سرمایه درگیر', tone: 'violet' }}
        icon={<Coins className="w-3.5 h-3.5" />}
      />
    </section>
  );
};
