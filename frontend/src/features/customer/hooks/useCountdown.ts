import { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface UseCountdownOptions {
  serverTime?: string;
  expiresAt?: string;
  startedAt?: string;
  onExpire?: () => void;
}

export interface CountdownResult {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isExpiringSoon: boolean; // < 10 phút
  isCritical: boolean;     // < 5 phút
  isExpired: boolean;
  percentage: number;      // 0 to 100
}

export function useCountdown({
  serverTime,
  expiresAt,
  startedAt,
  onExpire,
}: UseCountdownOptions): CountdownResult {
  const [tick, setTick] = useState(0);
  const onExpireCalledRef = useRef(false);

  // 1. Tính độ lệch đồng hồ máy khách so với máy chủ (Clock Drift Offset tính bằng mili-giây)
  const clientClockOffsetMs = useMemo(() => {
    if (!serverTime) return 0;
    try {
      const serverNow = dayjs.tz(serverTime, 'Asia/Ho_Chi_Minh');
      return Date.now() - serverNow.valueOf();
    } catch {
      return 0;
    }
  }, [serverTime]);

  const expireTimeMs = useMemo(() => {
    if (!expiresAt) return null;
    try {
      return dayjs.tz(expiresAt, 'Asia/Ho_Chi_Minh').valueOf();
    } catch {
      return null;
    }
  }, [expiresAt]);

  const startTimeMs = useMemo(() => {
    if (!startedAt) return null;
    try {
      return dayjs.tz(startedAt, 'Asia/Ho_Chi_Minh').valueOf();
    } catch {
      return null;
    }
  }, [startedAt]);

  // Bộ đếm thời gian 1 giây cập nhật re-render
  useEffect(() => {
    onExpireCalledRef.current = false;
    if (!expireTimeMs) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [expireTimeMs, clientClockOffsetMs]);

  // Tính toán đồng bộ số giây còn lại ngay trong lần render hiện tại (tránh stale state = 0 làm kích hoạt flash modal)
  const totalSeconds = useMemo(() => {
    if (!expireTimeMs) return 0;
    const currentAdjustedServerTime = Date.now() - clientClockOffsetMs;
    const remainingMs = expireTimeMs - currentAdjustedServerTime;
    return Math.max(0, Math.floor(remainingMs / 1000));
  }, [expireTimeMs, clientClockOffsetMs, tick]);

  // Gọi callback khi hết giờ
  useEffect(() => {
    if (expireTimeMs && totalSeconds <= 0 && !onExpireCalledRef.current) {
      onExpireCalledRef.current = true;
      if (onExpire) {
        onExpire();
      }
    }
  }, [totalSeconds, expireTimeMs, onExpire]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');

  // Tính phần trăm thời gian còn lại
  const percentage = useMemo(() => {
    if (!startTimeMs || !expireTimeMs || expireTimeMs <= startTimeMs) {
      return 100;
    }
    const totalDurationMs = expireTimeMs - startTimeMs;
    const currentAdjustedServerTime = Date.now() - clientClockOffsetMs;
    const remainingMs = Math.max(0, expireTimeMs - currentAdjustedServerTime);
    const ratio = (remainingMs / totalDurationMs) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  }, [startTimeMs, expireTimeMs, clientClockOffsetMs, totalSeconds]);

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    formatted,
    isExpiringSoon: totalSeconds > 0 && totalSeconds <= 600, // < 10 phút
    isCritical: totalSeconds > 0 && totalSeconds <= 300,     // < 5 phút
    isExpired: totalSeconds <= 0 && Boolean(expireTimeMs),
    percentage,
  };
}
