import React, { useState, useMemo } from 'react';
import { Input, Button, Tag, Skeleton, Empty, Pagination, Tooltip, App } from 'antd';
import {
  History,
  Monitor,
  Search,
  RefreshCw,
  PlayCircle,
  Clock,
  ArrowRightLeft,
  Square,
  Coins,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
} from 'lucide-react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { sessionApi } from '@/api/sessionApi';
import { computerApi } from '@/api/computerApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { StartSessionModal } from '../components/StartSessionModal';
import { EndSessionModal } from '../components/EndSessionModal';
import { TransferSessionModal } from '../components/TransferSessionModal';
import { SellTimeModal } from '../components/SellTimeModal';
import type { FloorMapComputerItem } from '@/types/computer';
import type { SessionResponse } from '@/types/auth';

type StatusTab = 'ACTIVE' | 'ENDED' | 'ALL';

export const SessionManagerPage: React.FC = () => {
  useDocumentTitle('Quản lý phiên chơi • CyberNet');
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<StatusTab>('ACTIVE');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Modal states
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSellTimeModalOpen, setIsSellTimeModalOpen] = useState(false);
  const [selectedSessionItem, setSelectedSessionItem] = useState<FloorMapComputerItem | null>(null);
  const [sellTimeAccountId, setSellTimeAccountId] = useState<number | null>(null);

  // 1. Lấy danh sách máy trạm (để phục vụ chuyển máy & kiểm tra máy trống)
  const { data: computersData } = useQuery({
    queryKey: ['staff-computers-list'],
    queryFn: () => computerApi.getComputers({ size: 100, sort: 'id,asc' }),
    refetchInterval: 10000,
  });

  const rawComputers = computersData?.content || [];
  const availableComputers: FloorMapComputerItem[] = useMemo(() => {
    return rawComputers
      .filter((c) => c.status === 'AVAILABLE')
      .map((c) => ({ ...c, activeSession: null }));
  }, [rawComputers]);

  // 2. Lấy danh sách phiên chơi theo status và pagination
  const {
    data: sessionsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['staff-sessions-page', activeTab, page, pageSize],
    queryFn: () =>
      sessionApi.getSessions({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page: page - 1,
        size: pageSize,
        sort: 'id,desc',
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
  });

  // Lấy riêng số lượng phiên ACTIVE để hiện badge chính xác trên tab
  const { data: activeSessionsCountData } = useQuery({
    queryKey: ['staff-active-sessions-count'],
    queryFn: () => sessionApi.getSessions({ status: 'ACTIVE', size: 1 }),
    refetchInterval: 10000,
  });

  const allSessions: SessionResponse[] = sessionsData?.content || [];
  const totalElements = sessionsData?.totalElements || 0;
  const activeCount = activeSessionsCountData?.totalElements || 0;

  // Lọc client-side nếu có search keyword (Mã máy, tên khách, số điện thoại)
  const filteredSessions = useMemo(() => {
    if (!searchKeyword.trim()) return allSessions;
    const kw = searchKeyword.toLowerCase().trim();
    return allSessions.filter(
      (s) =>
        s.computerCode?.toLowerCase().includes(kw) ||
        s.accountName?.toLowerCase().includes(kw) ||
        s.accountPhone?.toLowerCase().includes(kw)
    );
  }, [allSessions, searchKeyword]);

  // Chuyển session thành FloorMapComputerItem để tương thích với các modal hiện có
  const createComputerItemFromSession = (session: SessionResponse): FloorMapComputerItem => {
    return {
      id: session.computerId,
      code: session.computerCode,
      zone: session.computerZone,
      pricePerHour: session.pricePerHour,
      ipAddress: '',
      status: 'IN_USE',
      activeSession: session,
    };
  };

  // Hành động mở modal nạp thêm giờ
  const handleOpenSellTime = (session: SessionResponse) => {
    setSelectedSessionItem(createComputerItemFromSession(session));
    setSellTimeAccountId(session.accountId);
    setIsSellTimeModalOpen(true);
  };

  // Hành động mở modal chuyển máy
  const handleOpenTransfer = (session: SessionResponse) => {
    setSelectedSessionItem(createComputerItemFromSession(session));
    setIsTransferModalOpen(true);
  };

  // Hành động mở modal kết thúc phiên
  const handleOpenEnd = (session: SessionResponse) => {
    setSelectedSessionItem(createComputerItemFromSession(session));
    setIsEndModalOpen(true);
  };

  // Refresh toàn bộ cache sau khi thao tác modal thành công
  const handleActionSuccess = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['staff-sessions-page'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-active-sessions-count'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-computers-list'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-floormap-data'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-heading text-sand flex items-center gap-2.5">
              <History className="w-6 h-6 text-gold" />
              Quản lý phiên chơi
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-mist mt-1">
            Theo dõi phiên thực tế, nạp thêm giờ, chuyển máy trạm hoặc kết thúc phiên hoàn tiền tự động.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            loading={isFetching}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
            className="h-10 px-3.5 rounded-xl twinkle-btn-secondary text-xs cursor-pointer"
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            onClick={() => setIsStartModalOpen(true)}
            icon={<PlayCircle className="w-4 h-4 text-midnight" />}
            className="h-10 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] text-xs cursor-pointer"
          >
            Mở máy tại quầy
          </Button>
        </div>
      </div>

      {/* 2. Quick Overview Stats Cards (Liquid Glass 3D Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Thẻ 1: Phiên đang hoạt động (Xanh Cyan Điện Tử) */}
        <div className="liquid-glass-cyan flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#38bdf8]" />
                Phiên đang hoạt động
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#38bdf8] drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)] tracking-tight">
              {activeCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">phiên online</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Trạng thái sàn:</span>
            <span className="text-[#38bdf8] font-bold">Khách đang chơi trực tiếp</span>
          </div>
        </div>

        {/* Thẻ 2: Máy trạm sẵn sàng (Xanh Lục Ngọc Bích) */}
        <div className="liquid-glass-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                Máy trạm sẵn sàng
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#4ADE80] drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)] tracking-tight">
              {availableComputers.length}{' '}
              <span className="text-xs font-normal text-mist font-sans">máy trống</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Đón khách:</span>
            <span className="text-[#34d399] font-bold">Sẵn sàng mở phiên ngay</span>
          </div>
        </div>

        {/* Thẻ 3: Tổng lượt phiên (Hổ Phách Đậm & Kem Sữa) */}
        <div className="liquid-glass-amber flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#e0a96d]" />
                Tổng phiên ghi nhận
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e0a96d] shadow-[0_0_10px_rgba(224,169,109,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-sand drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-tight">
              <span className="text-[#f5d0a9]">{totalElements}</span>{' '}
              <span className="text-xs font-normal text-mist font-sans">lượt phiên</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Đang lọc:</span>
            <span className="text-gold font-bold">
              {activeTab === 'ACTIVE' ? 'Đang chơi' : activeTab === 'ENDED' ? 'Đã trả máy' : 'Toàn bộ'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Status Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-midnight/80 border border-mist/20">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ACTIVE');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-gold/20 text-gold shadow-sm border border-gold/40'
                : 'text-mist hover:text-sand'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Đang chơi
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gold/30 text-gold font-mono ml-0.5">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ENDED');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ENDED'
                ? 'bg-gold/20 text-gold shadow-sm border border-gold/40'
                : 'text-mist hover:text-sand'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch sử kết thúc
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-gold/20 text-gold shadow-sm border border-gold/40'
                : 'text-mist hover:text-sand'
            }`}
          >
            Tất cả phiên
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80">
          <Input
            prefix={<Search className="w-4 h-4 text-mist" />}
            placeholder="Tìm theo máy, tên khách, SĐT..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            className="rounded-xl bg-midnight/80 border-mist/20 text-sand placeholder:text-mist/50 h-10"
          />
        </div>
      </div>

      {/* 4. Session Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <GlassCard key={idx} className="p-5 rounded-2xl border border-mist/15">
              <Skeleton active paragraph={{ rows: 4 }} />
            </GlassCard>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <GlassCard className="p-12 text-center rounded-2xl border border-mist/20 bg-midnight/50">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1">
                <p className="text-sand font-medium">Không tìm thấy phiên chơi nào</p>
                <p className="text-xs text-mist">
                  {searchKeyword
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc.'
                    : activeTab === 'ACTIVE'
                    ? 'Hiện tại không có máy trạm nào đang có phiên hoạt động.'
                    : 'Chưa có dữ liệu phiên chơi.'}
                </p>
              </div>
            }
          />
        </GlassCard>
      ) : activeTab === 'ACTIVE' ? (
        /* TAB 1: Danh sách Card phiên đang chạy (Interactive) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const remainingMinutes = session.remainingMinutesUntilExpiry ?? 0;
            const playedMinutes = session.playedMinutes ?? 0;
            const isWarning = remainingMinutes <= 15;
            const totalEstMinutes = Math.max(1, playedMinutes + remainingMinutes);
            const progressPercent = Math.min(100, Math.round((playedMinutes / totalEstMinutes) * 100));

            return (
              <GlassCard
                key={session.id}
                className="p-4.5 rounded-2xl border border-mist/20 bg-midnight/80 hover:border-gold/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header: Computer Code, Zone & Live Dot */}
                <div className="flex items-center justify-between pb-3 border-b border-mist/15">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-base text-sand tracking-wide">
                      {session.computerCode}
                    </span>
                    <Tag
                      color={session.computerZone === 'VIP' ? 'gold' : 'blue'}
                      className="m-0 text-[10px] font-bold px-1.5 py-0.2 rounded"
                    >
                      {session.computerZone}
                    </Tag>
                    <span className="text-[11px] font-mono text-mist">
                      {new Intl.NumberFormat('vi-VN').format(session.pricePerHour)}đ/h
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Body: Customer Details */}
                <div className="bg-midnight/60 p-3 rounded-xl border border-mist/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-sand font-bold">
                      <User className="w-3.5 h-3.5 text-gold" />
                      <span>{session.accountName}</span>
                    </div>
                    <span className="text-[11px] text-mist font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-mist/70" />
                      {session.accountPhone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-mist/15">
                    <span className="text-mist">Số dư tài khoản:</span>
                    <span className="font-mono text-gold font-bold">
                      {session.accountRemainingMinutes} phút
                    </span>
                  </div>
                </div>

                {/* Time & Countdown Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sand" />
                      Bắt đầu:
                    </span>
                    <span className="font-mono text-sand font-medium">
                      {dayjs(session.startedAt).format('HH:mm DD/MM')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist">Đã chơi:</span>
                    <span className="font-mono text-mist">
                      {playedMinutes} phút (~{(playedMinutes / 60).toFixed(1)}h)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist">Thời gian còn lại:</span>
                    <span
                      className={`font-mono font-bold flex items-center gap-1 ${
                        isWarning ? 'text-warning animate-pulse' : 'text-gold'
                      }`}
                    >
                      {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                      {remainingMinutes} phút
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isWarning ? 'bg-warning' : 'bg-gold'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Actions: Nạp giờ, Chuyển máy, Kết thúc */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-mist/15">
                  <Tooltip title="Nạp thêm tiền giờ tại quầy">
                    <Button
                      size="small"
                      onClick={() => handleOpenSellTime(session)}
                      icon={<Coins className="w-3.5 h-3.5 text-gold" />}
                      className="h-8 rounded-lg text-xs bg-gold/15 border-gold/30 text-sand hover:text-white cursor-pointer"
                    >
                      Nạp giờ
                    </Button>
                  </Tooltip>

                  <Tooltip title="Chuyển phiên sang máy trạm khác">
                    <Button
                      size="small"
                      onClick={() => handleOpenTransfer(session)}
                      icon={<ArrowRightLeft className="w-3.5 h-3.5 text-[#85C1DC]" />}
                      className="h-8 rounded-lg text-xs bg-slate/40 border-mist/20 text-sand hover:text-white cursor-pointer"
                    >
                      Chuyển máy
                    </Button>
                  </Tooltip>

                  <Tooltip title="Kết thúc phiên và tự động hoàn trả phút dư">
                    <Button
                      size="small"
                      danger
                      onClick={() => handleOpenEnd(session)}
                      icon={<Square className="w-3.5 h-3.5 text-danger" />}
                      className="h-8 rounded-lg text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 cursor-pointer"
                    >
                      Kết thúc
                    </Button>
                  </Tooltip>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        /* TAB 2 & 3: Danh sách Lịch sử / Tất cả phiên (Table/Row format) */
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <GlassCard
              key={session.id}
              className="p-4 rounded-xl border border-mist/20 bg-midnight/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Cột 1: Thông tin phiên & máy */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="w-10 h-10 rounded-xl bg-slate/40 border border-mist/20 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5 text-sand" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-sm text-sand">
                      {session.computerCode}
                    </span>
                    <Tag
                      color={session.computerZone === 'VIP' ? 'gold' : 'blue'}
                      className="m-0 text-[10px] font-bold px-1.5 py-0.2 rounded"
                    >
                      {session.computerZone}
                    </Tag>
                  </div>
                  <div className="text-[11px] font-mono text-mist">
                    Mã phiên: #{session.id} • {new Intl.NumberFormat('vi-VN').format(session.pricePerHour)}đ/h
                  </div>
                </div>
              </div>

              {/* Cột 2: Khách hàng */}
              <div className="min-w-[180px]">
                <div className="text-xs font-bold text-sand flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gold" />
                  {session.accountName}
                </div>
                <div className="text-[11px] text-mist font-mono mt-0.5">
                  {session.accountPhone}
                </div>
              </div>

              {/* Cột 3: Thời gian chơi & kết thúc */}
              <div className="text-xs text-mist space-y-0.5 min-w-[200px]">
                <div>
                  Bắt đầu:{' '}
                  <span className="font-mono text-sand">
                    {dayjs(session.startedAt).format('HH:mm DD/MM/YYYY')}
                  </span>
                </div>
                <div>
                  Kết thúc:{' '}
                  <span className="font-mono text-sand">
                    {session.endedAt
                      ? dayjs(session.endedAt).format('HH:mm DD/MM/YYYY')
                      : 'Đang hoạt động'}
                  </span>
                </div>
              </div>

              {/* Cột 4: Tổng phút chơi */}
              <div className="text-right min-w-[120px]">
                <div className="text-[11px] text-mist">Đã sử dụng</div>
                <div className="text-sm font-bold font-mono text-gold">
                  {session.playedMinutes} phút
                </div>
                <div className="text-[10px] text-mist/70">
                  ~{(session.playedMinutes / 60).toFixed(1)} giờ
                </div>
              </div>

              {/* Cột 5: Trạng thái & Action */}
              <div className="flex items-center gap-2">
                {session.status === 'ACTIVE' ? (
                  <>
                    <Tag color="success" className="m-0 text-xs font-bold px-2 py-0.5 rounded">
                      ĐANG CHƠI
                    </Tag>
                    <Button
                      size="small"
                      danger
                      onClick={() => handleOpenEnd(session)}
                      className="rounded-lg text-xs cursor-pointer"
                    >
                      Dừng
                    </Button>
                  </>
                ) : (
                  <Tag className="m-0 text-xs font-bold px-2 py-0.5 rounded bg-slate/40 text-mist border-mist/20">
                    ĐÃ KẾT THÚC
                  </Tag>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 5. Phân trang (Pagination) */}
      {totalElements > pageSize && (
        <div className="flex justify-end pt-4">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={totalElements}
            onChange={(newPage) => setPage(newPage)}
            showSizeChanger={false}
            className="staff-pagination"
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS INTEGRATION                                        */}
      {/* ========================================================= */}

      {/* 1. Modal mở máy tại quầy */}
      <StartSessionModal
        open={isStartModalOpen}
        computer={null}
        availableComputers={availableComputers}
        onClose={() => setIsStartModalOpen(false)}
        onSuccess={() => {
          handleActionSuccess();
          message.success('Đã mở máy thành công!');
        }}
      />

      {/* 2. Modal nạp thêm giờ */}
      <SellTimeModal
        open={isSellTimeModalOpen}
        initialAccountId={sellTimeAccountId}
        targetComputer={selectedSessionItem}
        onClose={() => {
          setIsSellTimeModalOpen(false);
          setSelectedSessionItem(null);
          setSellTimeAccountId(null);
        }}
        onSuccess={() => {
          handleActionSuccess();
        }}
      />

      {/* 3. Modal chuyển máy */}
      <TransferSessionModal
        open={isTransferModalOpen}
        computer={selectedSessionItem}
        availableComputers={availableComputers}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedSessionItem(null);
        }}
        onSuccess={() => {
          handleActionSuccess();
          message.success('Đã chuyển máy trạm thành công!');
        }}
      />

      {/* 4. Modal kết thúc phiên */}
      <EndSessionModal
        open={isEndModalOpen}
        computer={selectedSessionItem}
        onClose={() => {
          setIsEndModalOpen(false);
          setSelectedSessionItem(null);
        }}
        onSuccess={() => {
          handleActionSuccess();
          message.success('Đã kết thúc phiên chơi và hoàn tiền thành công!');
        }}
      />
    </div>
  );
};
