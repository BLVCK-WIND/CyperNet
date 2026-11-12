export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: VIETNAM_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function vietnamDate(date = new Date()): string {
  const parts = dateFormatter.formatToParts(date);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)!.value).join('-');
}

export function vietnamTime(timestamp: number): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(timestamp);
}

// The backend sends ISO timestamps in Vietnam wall time without an offset.
export function vietnamTimestamp(timestamp: string): number {
  const localTime = timestamp.replace(/(\.\d{3})\d+$/, '$1');
  return Date.parse(`${localTime}+07:00`);
}
