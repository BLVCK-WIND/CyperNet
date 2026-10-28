import React, { useState } from 'react';
import { Drawer, Button, Tag, Skeleton, Popconfirm, App } from 'antd';
import {
  Monitor,
  User,
  Wrench,
  Zap,
  Globe,
  PlayCircle,
  Square,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  Phone,
  Coins,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { sessionApi } from '@/api/sessionApi';
import { computerApi } from '@/api/computerApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import type { FloorMapComputerItem, ComputerStatus } from '@/types/computer';
import type { SessionResponse } from '@/types/auth';

interface ComputerDetailDrawerProps {
  open: boolean;
  computer: FloorMapComputerItem | null;
  onClose: () => void;
  onComputerUpdated?: () => void;
  onStartSession?: (computer: FloorMapComputerItem) => void;
  onEndSession?: (computer: FloorMapComputerItem) => void;
  onTransferSession?: (computer: FloorMapComputerItem) => void;
  onSellTime?: (computer: FloorMapComputerItem) => void;
}

export const ComputerDetailDrawer: React.FC<ComputerDetailDrawerProps> = ({
  open,
  computer,
  onClose,
  onComputerUpdated,
  onStartSession,
  onEndSession,
  onTransferSession,
  onSellTime,
}) => {
  const { message } = App.useApp();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Tra cứu 5 phiên chơi gần nhất của máy này
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['computer-sessions-history', computer?.id],
    queryFn: () => {
      if (!computer?.id) throw new Error('Không có ID máy trạm');
      return sessionApi.getSessionsByComputerId(computer.id, { page: 0, size: 5 });
    },
    enabled: Boolean(open && computer?.id),
  });

  if (!computer) return null;

  const { code, zone, status, pricePerHour, ipAddress, activeSession } = computer;

  // Format đơn giá phòng VNĐ
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(pricePerHour);

  // Đổi trạng thái máy (Bảo trì <-> Sẵn sàng)
  const handleToggleMaintenance = async (targetStatus: ComputerStatus) => {
    setUpdatingStatus(true);
    try {
      await computerApi.updateComputer(computer.id, {
        code: computer.code,
        pricePerHour: computer.pricePerHour,
        status: targetStatus,
        ipAddress: computer.ipAddress,
        zone: computer.zone,
      });

      message.success(
        targetStatus === 'MAINTENANCE'
          ? `Máy ${code} đã được chuyển sang chế độ Bảo trì.`
          : `Máy ${code} đã khôi phục hoạt động sẵn sàng!`
      );

      if (onComputerUpdated) {
        onComputerUpdated();
      }
    } catch {
      message.error('Cập nhật trạng thái máy thất bại!');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const recentSessions: SessionResponse[] = historyData?.content || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={false}
      size={440}
      styles={{
        body: {
          padding: 0,
          backgroundColor: '#202332',
          color: '#f0ebe5',
          overflowX: 'hidden',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <div className="flex flex-col h-full bg-midnight select-none">
        {/* 1. Header Drawer */}
        <div className="flex items-center justify-between p-5 border-b border-mist/20 bg-midnight/90 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                status === 'AVAILABLE'
                  ? 'bg-success/15 text-success border border-success/30'
                  : status === 'IN_USE'
                  ? 'bg-info/15 text-info border border-info/30'
                  : 'bg-danger/15 text-danger border border-danger/30'
              }`}
            >
              <Monitor className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-xl text-sand tracking-wide">
                  {code}
                </h2>
                <ZoneBadge zone={zone} size="sm" />
              </div>
              <span className="text-xs text-mist font-mono">{ipAddress}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-mist hover:text-sand hover:bg-slate/40 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Body Drawer Content */}
        <div className="flex-1 p-5 space-y-6 overflow-y-auto">
          {/* A. Thẻ Tổng Quan Thông Số Máy */}
          <GlassCard className="p-4 rounded-2xl border border-mist/20 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-mist flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-gold" />
                Đơn giá giờ chơi:
              </span>
              <span className="font-bold font-mono text-gold text-sm">
                {formattedPrice}/h
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-mist flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-mist" />
                Địa chỉ IP:
              </span>
              <span className="font-mono text-sand">{ipAddress}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-mist/15">
              <span className="text-mist">Trạng thái:</span>
              <Tag
                bordered={false}
                className={`m-0 font-medium text-xs px-2.5 py-0.5 rounded-full ${
                  status === 'AVAILABLE'
                    ? 'bg-success/15 text-success border border-success/30'
                    : status === 'IN_USE'
                    ? 'bg-info/20 text-[#85C1DC] border border-info/40'
                    : 'bg-danger/15 text-danger border border-danger/30'
                }`}
              >
                {status === 'AVAILABLE'
                  ? '🟢 Sẵn sàng'
                  : status === 'IN_USE'
                  ? '🔵 Đang sử dụng'
                  : '🔴 Đang bảo trì'}
              </Tag>
            </div>
          </GlassCard>

          {/* B. Ngữ cảnh Thao tác theo Trạng thái (AVAILABLE / IN_USE / MAINTENANCE) */}
          {status === 'IN_USE' && activeSession ? (
            <GlassCard className="p-4.5 rounded-2xl border border-info/30 bg-gradient-to-br from-slate/50 to-midnight/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sand tracking-wide uppercase flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gold" />
                  Phiên Đang Hoạt Động (#{activeSession.id})
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-info" />
                </span>
              </div>

              {/* Thông tin khách */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-midnight/60 border border-mist/15">
                  <span className="text-mist block text-[11px]">Khách hàng</span>
                  <span className="font-bold text-sand truncate block">
                    {activeSession.accountName || 'Khách vãng lai'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-midnight/60 border border-mist/15">
                  <span className="text-mist block text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gold" />
                    Số điện thoại
                  </span>
                  <span className="font-mono text-sand truncate block">
                    {activeSession.accountPhone}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-midnight/60 border border-mist/15">
                  <span className="text-mist block text-[11px]">Bắt đầu chơi</span>
                  <span className="font-mono text-sand block">
                    {dayjs(activeSession.startedAt).format('HH:mm • DD/MM')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-midnight/60 border border-mist/15">
                  <span className="text-mist block text-[11px]">Thời gian còn</span>
                  <span className="font-mono text-gold font-bold block">
                    {activeSession.remainingMinutesUntilExpiry} phút
                  </span>
                </div>
              </div>

              {/* Nút hành động cho máy IN_USE */}
              <div className="space-y-2 pt-1">
                <Button
                  icon={<Coins className="w-3.5 h-3.5 text-gold" />}
                  onClick={() => {
                    if (onSellTime) onSellTime(computer);
                    else message.info(`Nạp thêm giờ cho khách tại máy ${code}`);
                  }}
                  className="w-full rounded-xl h-10 font-bold text-xs bg-gradient-to-r from-gold/20 to-gold/10 hover:from-gold/30 hover:to-gold/20 border border-gold/40 text-sand hover:text-gold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Nạp thêm giờ cho khách này
                </Button>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    danger
                    icon={<Square className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (onEndSession) onEndSession(computer);
                      else message.info(`Sẵn sàng kết thúc phiên máy ${code} (MS-2.6)`);
                    }}
                    className="rounded-xl h-10 font-medium text-xs bg-danger/10 border-danger/40 hover:bg-danger hover:text-white"
                  >
                    Kết thúc phiên
                  </Button>

                  <Button
                    icon={<ArrowRightLeft className="w-3.5 h-3.5 text-gold" />}
                    onClick={() => {
                      if (onTransferSession) onTransferSession(computer);
                      else message.info(`Sẵn sàng chuyển máy ${code} sang máy khác (MS-2.6)`);
                    }}
                    className="rounded-xl h-10 font-medium text-xs bg-slate/40 border-gold/40 text-sand hover:text-gold hover:border-gold"
                  >
                    Chuyển máy
                  </Button>
                </div>
              </div>
            </GlassCard>
          ) : status === 'IN_USE' && !activeSession ? (
            <GlassCard className="p-4.5 rounded-2xl border border-warning/40 bg-gradient-to-br from-slate/50 to-midnight/80 space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Máy Bị Kẹt Trạng Thái (Không Có Phiên)
                </span>
              </div>
              <p className="text-xs text-mist leading-relaxed">
                Hệ thống ghi nhận máy tính đang có cờ sử dụng nhưng không tìm thấy phiên chơi nào hoạt động trong cơ sở dữ liệu. Bấm nút bên dưới để giải phóng máy về trạng thái sẵn sàng đón khách ngay.
              </p>

              <Button
                type="primary"
                loading={updatingStatus}
                icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
                onClick={() => handleToggleMaintenance('AVAILABLE')}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold text-xs border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer"
              >
                GIẢI PHÓNG MÁY VỀ SẴN SÀNG
              </Button>
            </GlassCard>
          ) : status === 'AVAILABLE' ? (
            <GlassCard className="p-4.5 rounded-2xl border border-success/30 bg-gradient-to-br from-slate/40 to-midnight/80 space-y-4">
              <div>
                <span className="text-xs font-semibold text-success block mb-1">
                  🟢 MÁY ĐANG TRỐNG
                </span>
                <p className="text-xs text-mist leading-relaxed">
                  Máy sẵn sàng đón khách chơi. Nhân viên có thể mở phiên chơi ngay tại quầy bằng tài khoản khách hàng.
                </p>
              </div>

              {/* Nút Lớn: Mở Phiên Chơi Mới */}
              <Button
                type="primary"
                size="large"
                icon={<PlayCircle className="w-4 h-4" />}
                onClick={() => {
                  if (onStartSession) onStartSession(computer);
                  else message.info(`Sẵn sàng mở modal mở phiên máy ${code} (MS-2.5)`);
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold tracking-wide border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer"
              >
                MỞ PHIÊN CHƠI MỚI
              </Button>

              {/* Nút Đưa vào Bảo trì */}
              <Popconfirm
                title="Xác nhận đưa máy vào bảo trì?"
                description={`Khách sẽ không thể đăng nhập vào máy ${code} cho đến khi mở lại.`}
                okText="Đưa vào bảo trì"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleToggleMaintenance('MAINTENANCE')}
              >
                <Button
                  loading={updatingStatus}
                  icon={<Wrench className="w-3.5 h-3.5 text-danger" />}
                  className="w-full h-9 rounded-xl text-xs text-mist hover:text-danger hover:border-danger/40 bg-transparent border-mist/20"
                >
                  Đưa máy vào bảo trì
                </Button>
              </Popconfirm>
            </GlassCard>
          ) : (
            <GlassCard className="p-4.5 rounded-2xl border border-danger/30 bg-gradient-to-br from-slate/40 to-midnight/80 space-y-3">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Máy đang bảo trì
                </span>
              </div>
              <p className="text-xs text-mist leading-relaxed">
                Máy tính đang trong quá trình bảo trì phần cứng hoặc phần mềm. Bấm nút bên dưới để khôi phục trạng thái sẵn sàng đón khách.
              </p>

              <Button
                type="primary"
                loading={updatingStatus}
                icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
                onClick={() => handleToggleMaintenance('AVAILABLE')}
                className="w-full h-10 rounded-xl bg-success hover:bg-success/90 text-midnight font-bold text-xs border-none shadow-[0_4px_16px_rgba(76,175,80,0.3)] cursor-pointer"
              >
                KHÔI PHỤC HOẠT ĐỘNG (SẴN SÀNG)
              </Button>
            </GlassCard>
          )}

          {/* C. Lịch Sử 5 Phiên Chơi Gần Nhất */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-sand uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-gold" />
                Lịch Sử Phiên Gần Đây (5 phiên)
              </h3>
              <Button
                type="text"
                size="small"
                onClick={() => refetchHistory()}
                className="text-[11px] text-mist hover:text-gold p-0 h-auto"
              >
                Làm mới
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} active paragraph={{ rows: 2 }} />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <GlassCard className="p-6 text-center rounded-xl border border-mist/15">
                <span className="text-xs text-mist">Chưa có lịch sử phiên chơi nào</span>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((ses) => (
                  <div
                    key={ses.id}
                    className="p-3 rounded-xl bg-slate/40 border border-mist/15 hover:border-gold/30 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sand flex items-center gap-1">
                        <User className="w-3 h-3 text-gold" />
                        {ses.accountName || 'Khách chơi'}
                      </span>
                      <Tag
                        bordered={false}
                        className={`m-0 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          ses.status === 'ACTIVE'
                            ? 'bg-success/20 text-success'
                            : 'bg-mist/20 text-mist'
                        }`}
                      >
                        {ses.status === 'ACTIVE' ? 'Đang chơi' : 'Đã kết thúc'}
                      </Tag>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-mist/80 font-mono">
                      <span>{dayjs(ses.startedAt).format('HH:mm DD/MM')}</span>
                      <span>
                        {ses.endedAt
                          ? `→ ${dayjs(ses.endedAt).format('HH:mm')}`
                          : `Hết hạn: ${dayjs(ses.expiresAt).format('HH:mm')}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
