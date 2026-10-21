import React from 'react';
import { Clock, DollarSign, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface SessionStatsProps {
  playedMinutes: number;
  pricePerHour: number;
  computerZone: 'STANDARD' | 'VIP';
}

export const SessionStats: React.FC<SessionStatsProps> = ({
  playedMinutes,
  pricePerHour,
  computerZone,
}) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(pricePerHour);

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full">
      {/* 1. Đã chơi */}
      <GlassCard className="p-3 text-center flex flex-col items-center justify-center border-mist/15">
        <div className="p-1.5 rounded-md bg-midnight text-gold mb-1 border border-gold/20">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-[10px] sm:text-xs text-mist uppercase tracking-wider block font-medium">
          Đã dùng
        </span>
        <span className="text-sm sm:text-base font-bold text-sand font-['Space_Grotesk'] mt-0.5">
          {playedMinutes} <span className="text-[10px] text-mist font-normal">phút</span>
        </span>
      </GlassCard>

      {/* 2. Tiền giờ */}
      <GlassCard className="p-3 text-center flex flex-col items-center justify-center border-mist/15">
        <div className="p-1.5 rounded-md bg-midnight text-gold mb-1 border border-gold/20">
          <DollarSign className="w-4 h-4" />
        </div>
        <span className="text-[10px] sm:text-xs text-mist uppercase tracking-wider block font-medium">
          Tiền giờ
        </span>
        <span className="text-xs sm:text-sm font-bold text-gold font-['Space_Grotesk'] mt-0.5 truncate max-w-full">
          {formattedPrice}
        </span>
      </GlassCard>

      {/* 3. Phân khu */}
      <GlassCard className="p-3 text-center flex flex-col items-center justify-center border-mist/15">
        <div className="p-1.5 rounded-md bg-midnight text-gold mb-1 border border-gold/20">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-[10px] sm:text-xs text-mist uppercase tracking-wider block font-medium">
          Phân khu
        </span>
        <span
          className={`text-xs sm:text-sm font-bold font-['Space_Grotesk'] mt-0.5 ${
            computerZone === 'VIP' ? 'text-gold' : 'text-slate-300'
          }`}
        >
          {computerZone}
        </span>
      </GlassCard>
    </div>
  );
};

export default SessionStats;
