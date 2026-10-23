import React, { useState } from 'react';
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
  const [imgError, setImgError] = useState(false);
  const isOutOfStock = !item.available;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(item.price);

  const hasValidImage = Boolean(item.imageUrl) && !imgError;

  return (
    <GlassCard
      elevated
      glowOnHover={!isOutOfStock}
      className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border-mist/15 transition-all duration-300 group ${
        isOutOfStock ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1'
      }`}
    >
      {/* Top Part: Thumbnail Image or Fallback Icon */}
      <div className="relative w-full h-32 sm:h-36 rounded-lg overflow-hidden mb-3 bg-midnight/80 border border-mist/10 flex items-center justify-center">
        {hasValidImage ? (
          <>
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Subtle Gradient Shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-midnight/40 to-slate/40">
            <div className="w-11 h-11 rounded-xl bg-midnight/90 border border-gold/30 flex items-center justify-center shadow-inner group-hover:border-gold transition-colors duration-300">
              {getItemIcon(item.type)}
            </div>
          </div>
        )}

        {/* Floating Category Tag */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-sand px-2 py-0.5 rounded bg-midnight/85 backdrop-blur-md border border-gold/25 shadow-sm">
            {getItemTypeLabel(item.type)}
          </span>
        </div>

        {/* Out of Stock Overlay Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-obsidian/75 backdrop-blur-[2px] flex items-center justify-center">
            <Tag color="#EF5350" className="m-0 font-bold text-xs uppercase tracking-wider border-0 shadow-md">
              Hết hàng
            </Tag>
          </div>
        )}
      </div>

      {/* Middle Part: Name */}
      <div className="mb-3 flex-1">
        <h3 className="text-sm sm:text-base font-semibold text-sand line-clamp-2 leading-snug group-hover:text-gold transition-colors duration-200">
          {item.name}
        </h3>
      </div>

      {/* Bottom Part: Price & Add Button */}
      <div className="flex items-center justify-between pt-2 border-t border-mist/10 mt-auto">
        <div>
          <span className="text-[10px] text-mist block">Giá tiền</span>
          <span className="text-base sm:text-lg font-bold text-gold font-['Space_Grotesk'] tracking-wide">
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
