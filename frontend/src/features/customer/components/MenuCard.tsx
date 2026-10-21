import React from 'react';
import { Button, Tag } from 'antd';
import { Utensils, Coffee, Clock, Gamepad2, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ItemResponse, ItemType } from '@/types/item';

interface MenuCardProps {
  item: ItemResponse;
  onAddToCart?: (item: ItemResponse) => void;
}

const getItemIcon = (type: ItemType) => {
  switch (type) {
    case 'FOOD':
      return <Utensils className="w-5 h-5 text-gold" />;
    case 'DRINK':
      return <Coffee className="w-5 h-5 text-gold" />;
    case 'PLAYTIME':
      return <Clock className="w-5 h-5 text-gold" />;
    case 'SERVICE':
      return <Gamepad2 className="w-5 h-5 text-gold" />;
    default:
      return <Utensils className="w-5 h-5 text-gold" />;
  }
};

const getItemTypeLabel = (type: ItemType): string => {
  switch (type) {
    case 'FOOD':
      return 'Đồ ăn';
    case 'DRINK':
      return 'Nước uống';
    case 'PLAYTIME':
      return 'Giờ chơi';
    case 'SERVICE':
      return 'Dịch vụ';
    default:
      return 'Món';
  }
};

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  const isOutOfStock = !item.available;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(item.price);

  return (
    <GlassCard
      elevated
      glowOnHover={!isOutOfStock}
      className={`relative flex flex-col justify-between p-4 rounded-xl border-mist/15 transition-all duration-300 group ${
        isOutOfStock ? 'opacity-45 pointer-events-none' : 'hover:-translate-y-1'
      }`}
    >
      {/* Out of Stock Overlay Badge */}
      {isOutOfStock && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <Tag color="#EF5350" className="m-0 font-bold text-[10px] uppercase tracking-wider border-0 shadow-sm">
            Hết hàng
          </Tag>
        </div>
      )}

      {/* Top Part: Icon & Category */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-midnight/90 border border-gold/30 flex items-center justify-center shadow-inner group-hover:border-gold transition-colors duration-300">
          {getItemIcon(item.type)}
        </div>
        {!isOutOfStock && (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-mist px-2 py-0.5 rounded bg-slate/40 border border-mist/10">
            {getItemTypeLabel(item.type)}
          </span>
        )}
      </div>

      {/* Middle Part: Name */}
      <div className="mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-sand line-clamp-2 leading-snug group-hover:text-gold transition-colors duration-200">
          {item.name}
        </h3>
      </div>

      {/* Bottom Part: Price & Add Button */}
      <div className="flex items-center justify-between pt-2 border-t border-mist/10">
        <div>
          <span className="text-[10px] text-mist block">Giá tiền</span>
          <span className="text-base font-bold text-gold font-['Space_Grotesk'] tracking-wide">
            {formattedPrice}
          </span>
        </div>

        <Button
          type="primary"
          shape="circle"
          size="middle"
          disabled={isOutOfStock}
          onClick={() => onAddToCart && onAddToCart(item)}
          className="bg-gold/90 hover:bg-gold text-midnight border-0 shadow-md shadow-gold/20 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label={`Thêm ${item.name} vào giỏ`}
        >
          <Plus className="w-4 h-4 text-midnight stroke-[2.5]" />
        </Button>
      </div>
    </GlassCard>
  );
};

export default MenuCard;
