import React from 'react';
import { LayoutGrid, Utensils, Coffee, Clock, Gamepad2 } from 'lucide-react';
import type { ItemType } from '@/types/item';

export type FilterCategory = 'ALL' | ItemType;

interface MenuFilterTabsProps {
  activeTab: FilterCategory;
  onTabChange: (tab: FilterCategory) => void;
  counts?: Partial<Record<FilterCategory, number>>;
}

interface TabItem {
  key: FilterCategory;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { key: 'ALL', label: 'Tất cả', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { key: 'FOOD', label: 'Đồ ăn', icon: <Utensils className="w-3.5 h-3.5" /> },
  { key: 'DRINK', label: 'Đồ uống', icon: <Coffee className="w-3.5 h-3.5" /> },
  { key: 'PLAYTIME', label: 'Giờ chơi', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'SERVICE', label: 'Dịch vụ', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
];

export const MenuFilterTabs: React.FC<MenuFilterTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts?.[tab.key];

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-gold text-midnight shadow-md shadow-gold/20 scale-[1.02]'
                : 'bg-slate/60 text-sand hover:bg-slate border border-mist/15 hover:border-gold/30'
            }`}
          >
            <span className={isActive ? 'text-midnight' : 'text-gold'}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-midnight/20 text-midnight' : 'bg-midnight text-mist'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MenuFilterTabs;
