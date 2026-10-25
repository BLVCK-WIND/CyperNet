import React, { useState } from 'react';
import { Input, Button, Skeleton, Segmented } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
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
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(181,136,99,0.3)] cursor-pointer"
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
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[rgba(61,77,85,0.4)] hover:bg-[rgba(181,136,99,0.18)] border border-gold/30 text-sand hover:text-gold cursor-pointer"
          >
            <span className="text-xs font-semibold">Nạp giờ (POS)</span>
          </Button>

          <Button
            type="text"
            icon={<RefreshCw className={`w-4 h-4 text-gold ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[rgba(61,77,85,0.4)] hover:bg-[rgba(181,136,99,0.18)] border border-[rgba(167,158,156,0.15)] text-sand hover:text-gold cursor-pointer"
          >
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Stats Bar — Thống kê nhanh số lượng máy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tổng máy */}
        <GlassCard className="p-3.5 rounded-2xl flex items-center gap-3 border border-[rgba(167,158,156,0.15)]">
          <div className="w-10 h-10 rounded-xl bg-[rgba(181,136,99,0.15)] text-gold flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-mist block">Tổng số máy</span>
            <span className="text-xl font-heading font-extrabold text-sand">
              {stats.total}
            </span>
          </div>
        </GlassCard>

        {/* Sẵn sàng */}
        <GlassCard className="p-3.5 rounded-2xl flex items-center gap-3 border border-success/20">
          <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-mist block">Máy sẵn sàng</span>
            <span className="text-xl font-heading font-extrabold text-success">
              {stats.availableCount}
            </span>
          </div>
        </GlassCard>

        {/* Đang chơi */}
        <GlassCard className="p-3.5 rounded-2xl flex items-center gap-3 border border-info/20">
          <div className="w-10 h-10 rounded-xl bg-info/15 text-[#85C1DC] flex items-center justify-center shrink-0">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-mist block">Đang hoạt động</span>
            <span className="text-xl font-heading font-extrabold text-[#85C1DC]">
              {stats.inUseCount}
            </span>
          </div>
        </GlassCard>

        {/* Đang bảo trì */}
        <GlassCard className="p-3.5 rounded-2xl flex items-center gap-3 border border-danger/20">
          <div className="w-10 h-10 rounded-xl bg-danger/15 text-danger flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-mist block">Máy bảo trì</span>
            <span className="text-xl font-heading font-extrabold text-danger">
              {stats.maintenanceCount}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* 3. Filter Bar & Search */}
      <GlassCard className="p-4 rounded-2xl border border-[rgba(167,158,156,0.15)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Bộ lọc Trạng thái (Segmented tabs) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-mist flex items-center gap-1 mr-1">
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
            className="bg-midnight/80 border-[rgba(167,158,156,0.2)] text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-10"
          />
        </div>
      </GlassCard>

      {/* 4. Grid Sơ Đồ Máy Trạm */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <GlassCard key={idx} className="p-4 rounded-2xl border border-[rgba(167,158,156,0.1)]">
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
        <GlassCard className="p-12 text-center border border-[rgba(167,158,156,0.15)] rounded-2xl">
          <Monitor className="w-12 h-12 text-mist/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-sand mb-1">Không tìm thấy máy trạm phù hợp</h3>
          <p className="text-xs text-mist">
            Vui lòng thử điều chỉnh bộ lọc trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {computers.map((comp) => (
              <ComputerCard
                key={comp.id}
                computer={comp}
                isSelected={selectedComputer?.id === comp.id}
                onSelect={handleSelectComputer}
              />
            ))}
          </AnimatePresence>
        </motion.div>
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
        availableComputers={allComputers.filter((c) => c.status === 'AVAILABLE')}
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
        availableComputers={allComputers.filter((c) => c.status === 'AVAILABLE')}
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
