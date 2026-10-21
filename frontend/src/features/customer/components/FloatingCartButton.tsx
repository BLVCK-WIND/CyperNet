import React from 'react';
import { Badge } from 'antd';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const FloatingCartButton: React.FC = () => {
  const { getTotalCount, setIsOpen } = useCartStore();
  const totalCount = getTotalCount();

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-18 sm:bottom-12 right-5 sm:right-6 z-40 animate-slide-up">
      <Badge
        count={totalCount}
        overflowCount={99}
        color="#EF5350"
        offset={[-4, 4]}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gold text-midnight shadow-xl shadow-gold/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-pulse-gold border-2 border-midnight"
          aria-label={`Giỏ hàng có ${totalCount} món`}
        >
          <ShoppingBag className="w-6 h-6 text-midnight stroke-[2.2]" />
        </button>
      </Badge>
    </div>
  );
};

export default FloatingCartButton;
