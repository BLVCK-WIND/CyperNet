import React, { useState, useMemo } from 'react';
import { Input, Button, Skeleton, Segmented } from 'antd';
import {
  Monitor,
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
  PlayCircle,
  AlertOctagon,
  Filter,
  Coins,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ComputerCard } from '../components/ComputerCard';
import { ComputerDetailDrawer } from '../components/ComputerDetailDrawer';
import { StartSessionModal } from '../components/StartSessionModal';
import { EndSessionModal } from '../components/EndSessionModal';
import { TransferSessionModal } from '../components/TransferSessionModal';
import { SellTimeModal } from '../components/SellTimeModal';
import { useFloorMap } from '../hooks/useFloorMap';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { FloorMapComputerItem } from '@/types/computer';

export const FloorMapPage: React.FC = () => {
  useDocumentTitle('Sơ đồ máy trạm (Floor Map) • CyberNet');

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedComputer, setSelectedComputer] = useState<FloorMapComputerItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [modalTargetComputer, setModalTargetComputer] = useState<FloorMapComputerItem | null>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sessionActionComputer, setSessionActionComputer] = useState<FloorMapComputerItem | null>(null);
  const [isSellTimeModalOpen, setIsSellTimeModalOpen] = useState(false);
  const [sellTimeAccountId, setSellTimeAccountId] = useState<number | null>(null);
  const [sellTimeTargetComputer, setSellTimeTargetComputer] = useState<FloorMapComputerItem | null>(null);

  const {
    computers,
    allComputers,
    stats,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useFloorMap({
    statusFilter,
    zoneFilter,
    searchKeyword,
  });

  const availableComputers = useMemo(
    () => allComputers.filter((c) => c.status === 'AVAILABLE'),
    [allComputers]
  );

  const handleSelectComputer = (computer: FloorMapComputerItem) => {
    setSelectedComputer(computer);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-sand flex items-center gap-2.5">
            <Monitor className="w-6 h-6 text-gold" />
            Sơ đồ phòng máy (Floor Map)
          </h1>
          <p className="text-xs text-mist mt-1">
            Theo dõi trạng thái máy và thời gian chơi thời gian thực (Tự động cập nhật mỗi 10 giây).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PlayCircle className="w-4 h-4" />}
            onClick={() => {
              setModalTargetComputer(null);
              setIsStartModalOpen(true);
            }}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer"
          >
            <span className="text-xs">Mở máy nhanh</span>
          </Button>

          <Button
            icon={<Coins className="w-4 h-4 text-gold" />}
            onClick={() => {
              setSellTimeAccountId(null);
              setSellTimeTargetComputer(null);
              setIsSellTimeModalOpen(true);
            }}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl twinkle-btn-secondary border-gold/30 cursor-pointer"
          >
            <span className="text-xs font-semibold">Nạp giờ (POS)</span>
          </Button>

          <Button
            type="text"
            icon={<RefreshCw className={`w-4 h-4 text-gold ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl twinkle-btn-secondary cursor-pointer"
          >
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Stats Bar — Thống kê nhanh số lượng máy (Liquid Glass 3D Telemetry Strip) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Tổng máy: Vàng cát ngà & Xám slate */}
        <div className="liquid-glass-sand flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gold-light" />
                Tổng số máy
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_10px_rgba(189,152,117,0.8)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#f0ebe5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-tight">
              {stats.total}{' '}
              <span className="text-xs font-normal text-mist font-sans">máy trạm</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1">
            <span className="text-mist">STD: <strong className="text-sand">{stats.standardCount}</strong></span>
            <span className="text-mist">VIP: <strong className="text-gold">{stats.vipCount}</strong></span>
          </div>
        </div>

        {/* Sẵn sàng: Xanh Lục Ngọc Bích & Mint Gaming */}
        <div className="liquid-glass-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                Máy sẵn sàng
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] shadow-[0_0_10px_rgba(74,222,128,0.9)] animate-pulse" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#4ADE80] drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)] tracking-tight">
              {stats.availableCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">máy trống</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Trạng thái:</span>
            <span className="text-[#34d399] font-bold">Sẵn sàng đón khách</span>
          </div>
        </div>

        {/* Đang chơi: Xanh Cyan Điện Tử */}
        <div className="liquid-glass-cyan flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
                Đang hoạt động
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#38bdf8] drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)] tracking-tight">
              {stats.inUseCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">máy online</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Công suất:</span>
            <span className="text-[#38bdf8] font-bold">
              {stats.total > 0 ? Math.round((stats.inUseCount / stats.total) * 100) : 0}% phòng
            </span>
          </div>
        </div>

        {/* Đang bảo trì: Đỏ Ruby San Hô */}
        <div className="liquid-glass-ruby flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-[#f87171]" />
                Máy bảo trì
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#f87171] drop-shadow-[0_2px_8px_rgba(225,29,72,0.5)] tracking-tight">
              {stats.maintenanceCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">máy khóa</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Kỹ thuật:</span>
            <span className={stats.maintenanceCount > 0 ? 'text-[#f87171] font-bold' : 'text-[#34d399] font-bold'}>
              {stats.maintenanceCount > 0 ? 'Cần xử lý' : 'Bình thường'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search (Thanh tiêu đề chính - Twinkle Major Flow) */}
      <div className="p-4 rounded-2xl twinkle-major-flow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Bộ lọc Trạng thái (Segmented tabs) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-sand flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-gold" />
            Lọc:
          </span>
          <Segmented
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as string)}
            options={[
              { label: `Tất cả (${stats.total})`, value: 'ALL' },
              { label: `Trống (${stats.availableCount})`, value: 'AVAILABLE' },
              { label: `Đang chơi (${stats.inUseCount})`, value: 'IN_USE' },
              { label: `Bảo trì (${stats.maintenanceCount})`, value: 'MAINTENANCE' },
            ]}
            className="bg-midnight/70 p-1 rounded-xl text-xs font-medium text-sand"
          />

          <Segmented
            value={zoneFilter}
            onChange={(val) => setZoneFilter(val as string)}
            options={[
              { label: 'Toàn bộ khu', value: 'ALL' },
              { label: `Standard (${stats.standardCount})`, value: 'STANDARD' },
              { label: `VIP (${stats.vipCount})`, value: 'VIP' },
            ]}
            className="bg-midnight/70 p-1 rounded-xl text-xs font-medium text-sand hidden sm:inline-flex"
          />
        </div>

        {/* Ô Tìm kiếm nhanh */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Tìm mã máy, tên khách, SĐT..."
            prefix={<Search className="w-4 h-4 text-mist mr-1" />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            className="bg-midnight/80 border-mist/20 text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-10"
          />
        </div>
      </div>

      {/* 4. Grid Sơ Đồ Máy Trạm */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <GlassCard key={idx} className="p-4.5 rounded-2xl border border-mist/15">
              <Skeleton active paragraph={{ rows: 3 }} />
            </GlassCard>
          ))}
        </div>
      ) : isError ? (
        <GlassCard className="p-8 text-center border border-danger/30 rounded-2xl">
          <p className="text-danger font-medium mb-3">Không thể tải dữ liệu sơ đồ phòng máy!</p>
          <Button onClick={() => refetch()} className="bg-gold text-midnight border-none font-bold rounded-xl">
            Thử lại
          </Button>
        </GlassCard>
      ) : computers.length === 0 ? (
        <GlassCard className="p-12 text-center border border-mist/20 rounded-2xl">
          <Monitor className="w-12 h-12 text-mist/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-sand mb-1">Không tìm thấy máy trạm phù hợp</h3>
          <p className="text-xs text-mist">
            Vui lòng thử điều chỉnh bộ lọc trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4.5">
          {computers.map((comp) => (
            <ComputerCard
              key={comp.id}
              computer={comp}
              isSelected={selectedComputer?.id === comp.id}
              onSelect={handleSelectComputer}
            />
          ))}
        </div>
      )}

      {/* 5. Drawer Chi Tiết Máy Trạm (Slide-in) */}
      <ComputerDetailDrawer
        open={isDetailOpen}
        computer={selectedComputer}
        onClose={() => setIsDetailOpen(false)}
        onComputerUpdated={() => refetch()}
        onStartSession={(comp) => {
          setIsDetailOpen(false);
          setModalTargetComputer(comp);
          setIsStartModalOpen(true);
        }}
        onEndSession={(comp) => {
          setIsDetailOpen(false);
          setSessionActionComputer(comp);
          setIsEndModalOpen(true);
        }}
        onTransferSession={(comp) => {
          setIsDetailOpen(false);
          setSessionActionComputer(comp);
          setIsTransferModalOpen(true);
        }}
        onSellTime={(comp) => {
          setIsDetailOpen(false);
          setSellTimeAccountId(comp.activeSession?.accountId || null);
          setSellTimeTargetComputer(comp);
          setIsSellTimeModalOpen(true);
        }}
      />

      {/* 6. Modal Mở Phiên Chơi Tại Quầy (Phương án A) */}
      <StartSessionModal
        open={isStartModalOpen}
        computer={modalTargetComputer}
        availableComputers={availableComputers}
        onClose={() => setIsStartModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* 7. Modal Kết Thúc Phiên Chơi (Phương án A - Hoàn giờ tự động) */}
      <EndSessionModal
        open={isEndModalOpen}
        computer={sessionActionComputer}
        onClose={() => setIsEndModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* 8. Modal Chuyển Máy Trạm */}
      <TransferSessionModal
        open={isTransferModalOpen}
        computer={sessionActionComputer}
        availableComputers={availableComputers}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* 9. Modal Nạp Giờ Chơi Tại Quầy POS */}
      <SellTimeModal
        open={isSellTimeModalOpen}
        initialAccountId={sellTimeAccountId}
        targetComputer={sellTimeTargetComputer}
        onClose={() => setIsSellTimeModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};
