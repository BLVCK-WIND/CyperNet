import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Clock, ArrowRight } from 'lucide-react';

export const SellTimePage: React.FC = () => {
  useDocumentTitle('Bán giờ chơi (Sell Time POS) • CyberNet');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-sand flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-gold" />
            Bán giờ chơi (Sell Time POS)
          </h1>
          <p className="text-sm text-mist mt-1">
            Nạp giờ chơi cho tài khoản hội viên và khách vãng lai trực tiếp tại quầy.
          </p>
        </div>
      </div>

      <GlassCard className="p-8 border border-[rgba(181,136,99,0.2)] bg-gradient-to-br from-[rgba(61,77,85,0.4)] to-[rgba(16,35,42,0.8)] shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-center">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto py-8">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(181,136,99,0.15)] text-gold flex items-center justify-center mb-4 border border-[rgba(181,136,99,0.3)] shadow-[0_0_24px_rgba(181,136,99,0.2)]">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-sand mb-2">
            Hệ Thống Bán Giờ & Nạp Giờ Chơi
          </h2>
          <p className="text-sm text-mist leading-relaxed mb-6">
            Module <strong className="text-gold">MS-2.9</strong> sẽ cho phép nhân viên tìm kiếm tài khoản theo SĐT, chọn gói giờ nạp, tính tiền và in biên lai giao dịch quầy.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(181,136,99,0.12)] text-gold text-xs font-medium border border-[rgba(181,136,99,0.25)]">
            <span>Tiến độ tiếp theo: MS-2.9 (Sell Time POS)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
