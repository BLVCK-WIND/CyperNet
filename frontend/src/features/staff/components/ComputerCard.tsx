import React from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  User,
  Clock,
  Wrench,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import type { FloorMapComputerItem } from '@/types/computer';

interface ComputerCardProps {
  computer: FloorMapComputerItem;
  isSelected?: boolean;
  onSelect: (computer: FloorMapComputerItem) => void;
}

export const ComputerCard: React.FC<ComputerCardProps> = ({
  computer,
  isSelected = false,
  onSelect,
}) => {
  const { code, zone, status, pricePerHour, activeSession } = computer;

  // Định dạng tiền tệ VNĐ
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(pricePerHour);

  // Định dạng số phút còn lại (hoặc đếm ngược)
  const remainingMinutes = activeSession?.remainingMinutesUntilExpiry ?? 0;
  const isCriticalExpiring = status === 'IN_USE' && remainingMinutes > 0 && remainingMinutes <= 5;
  const isExpiringSoon = status === 'IN_USE' && remainingMinutes > 0 && remainingMinutes <= 15;

  // Cấu hình hiển thị theo trạng thái với độ tương phản cao (Status Hierarchy)
  const statusConfigMap = {
    AVAILABLE: {
      badgeText: 'SẴN SÀNG',
      badgeClass: 'bg-success/20 text-[#4ADE80] border-success/40 shadow-[0_0_12px_rgba(74,222,128,0.25)]',
      borderClass: isSelected
        ? 'border-gold shadow-[0_0_24px_rgba(189,152,117,0.5)] ring-2 ring-gold'
        : 'border-success/45 hover:border-success/90 hover:shadow-[0_4px_24px_rgba(76,175,80,0.25)] bg-gradient-to-br from-slate/75 to-success/10',
      dotClass: 'bg-success shadow-[0_0_10px_rgba(76,175,80,0.9)] animate-pulse',
      iconContainer: 'bg-success/20 text-[#4ADE80] border border-success/40 shadow-[0_0_10px_rgba(76,175,80,0.3)]',
    },
    IN_USE: {
      badgeText: 'ĐANG CHƠI',
      badgeClass: isCriticalExpiring
        ? 'bg-danger/25 text-danger border-danger/60 animate-pulse shadow-[0_0_14px_rgba(239,83,80,0.5)]'
        : isExpiringSoon
        ? 'bg-warning/25 text-warning border-warning/60 shadow-[0_0_12px_rgba(255,183,77,0.35)]'
        : 'bg-info/25 text-[#85C1DC] border-info/50 shadow-[0_0_12px_rgba(91,143,168,0.25)]',
      borderClass: isSelected
        ? 'border-gold shadow-[0_0_24px_rgba(189,152,117,0.5)] ring-2 ring-gold'
        : isCriticalExpiring
        ? 'border-danger shadow-[0_0_24px_rgba(239,83,80,0.5)] ring-2 ring-danger/80 animate-pulse bg-gradient-to-br from-slate/85 to-danger/20'
        : isExpiringSoon
        ? 'border-warning/80 hover:border-warning hover:shadow-[0_4px_24px_rgba(255,183,77,0.35)] animate-pulse bg-gradient-to-br from-slate/80 to-warning/15'
        : 'border-info/50 hover:border-info/90 hover:shadow-[0_4px_24px_rgba(91,143,168,0.3)] bg-gradient-to-br from-slate/80 to-info/10',
      dotClass: isCriticalExpiring
        ? 'bg-danger shadow-[0_0_12px_rgba(239,83,80,1)] animate-ping'
        : isExpiringSoon
        ? 'bg-warning shadow-[0_0_10px_rgba(255,183,77,0.9)] animate-pulse'
        : 'bg-[#5B8FA8] shadow-[0_0_8px_rgba(91,143,168,0.8)]',
      iconContainer: 'bg-info/20 text-[#85C1DC] border border-info/40',
    },
    MAINTENANCE: {
      badgeText: 'BẢO TRÌ',
      badgeClass: 'bg-danger/20 text-danger border-danger/40',
      borderClass: isSelected
        ? 'border-gold shadow-[0_0_24px_rgba(189,152,117,0.5)] ring-2 ring-gold'
        : 'border-danger/40 hover:border-danger/70 bg-gradient-to-br from-midnight/90 to-danger/10',
      dotClass: 'bg-danger shadow-[0_0_8px_rgba(239,83,80,0.8)]',
      iconContainer: 'bg-danger/20 text-danger border border-danger/40',
    },
  };
  const statusConfig = statusConfigMap[status] || statusConfigMap.AVAILABLE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="h-full"
    >
      <GlassCard
        onClick={() => onSelect(computer)}
        className={`group relative p-4.5 rounded-2xl cursor-pointer transition-colors duration-300 select-none border h-full flex flex-col justify-between ${statusConfig.borderClass} ${
          status === 'MAINTENANCE' ? 'opacity-65 hover:opacity-85' : ''
        }`}
      >
        {/* 1. Header: Mã Máy & Badge Zone */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${statusConfig.iconContainer}`}
            >
              {status === 'MAINTENANCE' ? (
                <Wrench className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="font-heading font-black text-lg tracking-wide text-sand group-hover:text-gold transition-colors block leading-tight whitespace-nowrap truncate">
                {code}
              </span>
              <span className="text-[11px] font-mono text-mist block truncate">
                {computer.ipAddress}
              </span>
            </div>
          </div>

          {/* Zone Badge (Dynamic Short Code + Admin Color) */}
          <ZoneBadge zone={zone} size="sm" />
        </div>

        {/* 2. Body: Trạng thái & Thông tin khách chơi (nếu có) */}
        <div className="min-h-[64px] py-2 border-t border-mist/15 flex flex-col justify-center">
          {status === 'IN_USE' ? (
            activeSession ? (
              <div className="space-y-1.5">
                {/* Tên khách */}
                <div className="flex items-center gap-1.5 text-sm text-sand font-bold truncate">
                  <User className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="truncate">{activeSession.accountName || 'Khách chơi'}</span>
                </div>

                {/* Thời gian còn lại */}
                <div className="flex items-center justify-between gap-1">
                  <div
                    className={`flex items-center gap-1.5 font-mono text-sm font-extrabold ${
                      isCriticalExpiring
                        ? 'text-danger animate-pulse'
                        : isExpiringSoon
                        ? 'text-warning'
                        : 'text-gold'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Còn {remainingMinutes > 0 ? `${remainingMinutes}p` : 'Hết giờ'}
                    </span>
                  </div>
                  {isCriticalExpiring ? (
                    <span className="text-[10px] uppercase tracking-wider text-danger px-2 py-0.5 rounded-full bg-danger/25 font-bold border border-danger/50 animate-pulse">
                      &le; 5P
                    </span>
                  ) : isExpiringSoon ? (
                    <span className="text-[10px] uppercase tracking-wider text-warning px-2 py-0.5 rounded-full bg-warning/20 font-bold border border-warning/40">
                      GẤP
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-warning font-semibold py-1">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning" />
                </span>
                <span className="truncate">Kẹt trạng thái (Bấm để gỡ)</span>
              </div>
            )
          ) : status === 'AVAILABLE' ? (
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-[#4ADE80] tracking-wide uppercase mb-0.5">
                ● Sẵn sàng đón khách
              </span>
              <span className="text-sm font-extrabold font-mono text-gold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {formattedPrice}/giờ
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-danger font-semibold">
              <Wrench className="w-4 h-4 shrink-0" />
              <span>Tạm ngưng phục vụ</span>
            </div>
          )}
        </div>

        {/* 3. Footer: Status Badge & Pulse Indicator */}
        <div className="flex items-center justify-between pt-2.5 border-t border-mist/15 mt-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            <span className={`pill-badge text-[10px] font-extrabold tracking-wider ${statusConfig.badgeClass}`}>
              {statusConfig.badgeText}
            </span>
          </div>

          <span className="text-[11px] text-mist/80 group-hover:text-gold transition-colors font-semibold flex items-center gap-1">
            Chi tiết <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
};
