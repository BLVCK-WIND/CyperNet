import { useEffect, useState } from 'react';
import { vietnamDate } from '@/utils/vietnamTime';

export function useVietnamDate(): string {
  const [date, setDate] = useState(vietnamDate);
  useEffect(() => {
    const update = () => setDate(vietnamDate());
    const timer = setInterval(update, 1000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  return date;
}
