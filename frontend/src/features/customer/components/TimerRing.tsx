import React from 'react';
import type { CountdownResult } from '../hooks/useCountdown';

interface TimerRingProps {
  countdown: CountdownResult;
  size?: number;
}

export const TimerRing: React.FC<TimerRingProps> = ({
  countdown,
  size = 280,
}) => {
  const { formatted, isExpiringSoon, isCritical, isExpired, percentage } = countdown;

  // Cấu hình kích thước SVG
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Tính stroke-dashoffset (từ 0 đến circumference)
  // Khi percentage = 100 => offset = 0 (vòng tròn đầy)
  // Khi percentage = 0 => offset = circumference (vòng tròn rỗng)
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Xác định màu sắc chủ đạo theo trạng thái
  let strokeColor = '#B58863'; // --gold default
  let glowColor = 'rgba(181, 136, 99, 0.3)';
  let statusText = 'ĐANG HOẠT ĐỘNG';
  let statusBadgeClass = 'bg-gold/20 text-gold border-gold/30';
  let pulseClass = '';

  if (isExpired) {
    strokeColor = '#EF5350';
    glowColor = 'rgba(239, 83, 80, 0.4)';
    statusText = 'HẾT GIỜ CHƠI';
    statusBadgeClass = 'bg-danger/20 text-danger border-danger/40';
  } else if (isCritical) {
    strokeColor = '#EF5350';
    glowColor = 'rgba(239, 83, 80, 0.5)';
    statusText = 'SẮP HẾT GIỜ (< 5P)';
    statusBadgeClass = 'bg-danger/20 text-danger border-danger/40';
    pulseClass = 'animate-pulse';
  } else if (isExpiringSoon) {
    strokeColor = '#FFB74D';
    glowColor = 'rgba(255, 183, 77, 0.4)';
    statusText = 'CẢNH BÁO (< 10P)';
    statusBadgeClass = 'bg-warning/20 text-warning border-warning/40';
    pulseClass = 'animate-pulse-gold';
  }

  return (
    <div className={`relative flex items-center justify-center ${pulseClass}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 transition-all duration-500"
      >
        <defs>
          <filter id="timer-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="6"
              floodColor={glowColor}
            />
          </filter>
        </defs>

        {/* Vòng nền mờ (Background track) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(61, 77, 85, 0.4)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Vòng tiến trình sáng (Active animated track) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
          filter="url(#timer-glow)"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Nội dung bên trong tâm đồng hồ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
        <span className="text-[11px] text-mist uppercase tracking-widest font-semibold mb-1">
          THỜI GIAN CÒN LẠI
        </span>

        {/* Đồng hồ số HH:MM:SS */}
        <span
          className="text-4xl sm:text-5xl font-bold tracking-tight font-['Space_Grotesk'] drop-shadow-md"
          style={{ color: strokeColor }}
        >
          {formatted}
        </span>

        {/* Trạng thái đếm ngược */}
        <div
          className={`mt-2.5 px-3 py-0.5 rounded-full border text-[11px] font-semibold tracking-wider ${statusBadgeClass}`}
        >
          {statusText}
        </div>
      </div>
    </div>
  );
};

export default TimerRing;
