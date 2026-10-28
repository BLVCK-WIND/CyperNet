import React from 'react';
import { useZoneMap } from '@/hooks/useZoneMap';
import type { ComputerZone } from '@/types/computer';

export interface ZoneBadgeProps {
  zone?: ComputerZone | string | null;
  colorCode?: string; // Optional override
  name?: string;      // Optional override
  short?: boolean;    // Default true: STANDARD -> STD, VIP -> VIP, custom code -> CODE
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const ZoneBadge: React.FC<ZoneBadgeProps> = ({
  zone = 'STANDARD',
  colorCode: explicitColor,
  name: explicitName,
  short = true,
  size = 'sm',
  showDot = true,
  className = '',
}) => {
  const { getZoneColor, getZoneShortLabel, getZoneFullName } = useZoneMap();
  const code = (zone || 'STANDARD').toUpperCase();

  // Lấy màu thực tế do Admin cấu hình cho Zone trong cơ sở dữ liệu
  const safeColor = explicitColor || getZoneColor(code);

  // Hiển thị tên viết tắt (STD, VIP, ARENA, VAL) hoặc tên đầy đủ
  const label = explicitName || (short ? getZoneShortLabel(code) : getZoneFullName(code));

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-bold tracking-wider',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-bold tracking-wider',
    lg: 'text-sm px-3 py-1 gap-2 font-bold tracking-wider',
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center uppercase rounded-full border shadow-sm backdrop-blur-md select-none transition-all ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `${safeColor}18`,
        borderColor: `${safeColor}55`,
        color: safeColor, // Màu chữ trùng khớp 100% với màu Admin đã chọn
      }}
    >
      {showDot && (
        <span
          className={`${dotSizes} rounded-full shrink-0`}
          style={{
            backgroundColor: safeColor,
            boxShadow: `0 0 6px ${safeColor}90`,
          }}
        />
      )}
      <span className="truncate">
        {label}
      </span>
    </span>
  );
};
