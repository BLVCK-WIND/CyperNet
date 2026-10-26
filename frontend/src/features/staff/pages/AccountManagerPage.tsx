import React, { useState, useMemo } from 'react';
import {
  Table,
  Input,
  Button,
  Tag,
  Modal,
  App,
  Select,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  ClockPlus,
  PlayCircle,
  KeyRound,
  Shield,
  Clock,
  Phone,
  Zap,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { accountApi } from '@/api/accountApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { RegisterCustomerModal } from '../components/RegisterCustomerModal';
import { SellTimeModal } from '../components/SellTimeModal';
import { StartSessionModal } from '../components/StartSessionModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/store/authStore';
import type { Account, Role } from '@/types/auth';

export const AccountManagerPage: React.FC = () => {
  useDocumentTitle('Quản lý tài khoản hội viên • CyberNet');
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const currentUserRole = useAuthStore((state) => state.role);
  const isAdmin = currentUserRole === 'ADMIN';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');

  // Modal states
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [sellTimeModalOpen, setSellTimeModalOpen] = useState(false);
  const [startSessionModalOpen, setStartSessionModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Selected account for quick action
  const [targetAccount, setTargetAccount] = useState<Account | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Query accounts
  const {
    data: accountsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['staff-accounts-list'],
    queryFn: () => accountApi.getAccounts({ size: 200, sort: 'id,desc' }),
    refetchInterval: 15000,
  });

  const allAccounts: Account[] = accountsData?.content || [];

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      const matchRole = roleFilter === 'ALL' || acc.role === roleFilter;
      const cleanSearch = searchTerm.trim().toLowerCase();
      const matchSearch =
        !cleanSearch ||
        acc.phone.toLowerCase().includes(cleanSearch) ||
        acc.name.toLowerCase().includes(cleanSearch);
      return matchRole && matchSearch;
    });
  }, [allAccounts, searchTerm, roleFilter]);

  // Telemetry KPIs
  const totalCustomers = allAccounts.filter((a) => a.role === 'CUSTOMER').length;
  const totalPlayableMinutes = allAccounts.reduce((sum, a) => sum + (a.remainingMinutes || 0), 0);
  const totalPlayableHours = (totalPlayableMinutes / 60).toFixed(0);

  // Handlers for quick actions
  const handleOpenSellTime = (account: Account) => {
    setTargetAccount(account);
    setSellTimeModalOpen(true);
  };

  const handleOpenStartSession = (account: Account) => {
    setTargetAccount(account);
    setStartSessionModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setTargetAccount(account);
    setEditName(account.name);
    setEditPassword('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!targetAccount) return;
    if (!isAdmin && targetAccount.role !== 'CUSTOMER') {
      message.error('Nhân viên chỉ có quyền cập nhật và đổi mật khẩu cho tài khoản Hội viên!');
      return;
    }
    if (!editName.trim()) {
      message.warning('Tên khách hàng không được để trống!');
      return;
    }
    if (editPassword && editPassword.length < 4) {
      message.warning('Mật khẩu mới phải từ 4 ký tự trở lên!');
      return;
    }

    setEditSubmitting(true);
    try {
      await accountApi.updateAccount(targetAccount.id, {
        name: editName.trim(),
        password: editPassword ? editPassword.trim() : undefined,
        role: targetAccount.role,
      });
      message.success(`Đã cập nhật thông tin tài khoản ${targetAccount.phone}!`);
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff-accounts-list'] });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Không thể cập nhật thông tin tài khoản!');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Ant Design Table Columns
  const columns: ColumnsType<Account> = [
    {
      title: 'HỘI VIÊN',
      key: 'name',
      render: (_, record) => {
        const isCustomer = record.role === 'CUSTOMER';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-heading font-black text-sm shrink-0">
              {record.name?.charAt(0) || 'K'}
            </div>
            <div>
              <div className="font-heading font-bold text-sand text-sm flex items-center gap-2">
                <span>{record.name}</span>
                {isCustomer ? (
                  <Tag className="m-0 text-[10px] font-bold bg-gold/15 text-gold border-gold/30 px-2 py-0.5 rounded-full">
                    HỘI VIÊN
                  </Tag>
                ) : record.role === 'ADMIN' ? (
                  <Tag className="m-0 text-[10px] font-bold bg-danger/15 text-danger border-danger/30 px-2 py-0.5 rounded-full">
                    ADMIN
                  </Tag>
                ) : (
                  <Tag className="m-0 text-[10px] font-bold bg-info/15 text-info border-info/30 px-2 py-0.5 rounded-full">
                    STAFF
                  </Tag>
                )}
              </div>
              <span className="text-xs text-mist font-mono flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-mist/70" />
                {record.phone}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'SỐ DƯ GIỜ CHƠI',
      dataIndex: 'remainingMinutes',
      key: 'remainingMinutes',
      sorter: (a, b) => a.remainingMinutes - b.remainingMinutes,
      render: (mins: number) => {
        const hours = (mins / 60).toFixed(1);
        const isZero = mins <= 0;
        return (
          <div className="flex items-center gap-2">
            {isZero ? (
              <span className="px-2.5 py-1 rounded-lg bg-danger/15 text-danger border border-danger/25 font-mono text-xs font-bold">
                0 phút (Hết giờ)
              </span>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold/15 border border-gold/30 text-gold font-mono text-xs font-bold shadow-[0_0_8px_rgba(189,152,117,0.15)]">
                <Clock className="w-3.5 h-3.5" />
                <span>{mins} phút</span>
                <span className="text-[11px] text-mist/80 font-normal">(~{hours}h)</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'NGÀY ĐĂNG KÝ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => (
        <span className="text-xs text-mist font-mono">
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '—'}
        </span>
      ),
    },
    {
      title: 'THAO TÁC NHANH',
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        const canEdit = isAdmin || record.role === 'CUSTOMER';
        return (
          <div className="flex items-center justify-end gap-2">
            {record.role === 'CUSTOMER' && (
              <>
                <Tooltip title="Nạp thêm giờ chơi tại quầy POS">
                  <button
                    type="button"
                    onClick={() => handleOpenSellTime(record)}
                    className="px-2.5 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold hover:text-gold-light text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <ClockPlus className="w-3.5 h-3.5" />
                    <span>Nạp giờ</span>
                  </button>
                </Tooltip>

                <Tooltip title="Mở máy trạm cho khách này">
                  <button
                    type="button"
                    onClick={() => handleOpenStartSession(record)}
                    disabled={record.remainingMinutes <= 0}
                    className="px-2.5 py-1.5 rounded-lg bg-success/15 hover:bg-success/25 border border-success/30 text-success hover:text-green-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Mở máy</span>
                  </button>
                </Tooltip>
              </>
            )}

            {canEdit && (
              <Tooltip title={record.role === 'CUSTOMER' ? "Đổi mật khẩu hoặc cập nhật họ tên hội viên" : "Cập nhật tài khoản quản trị"}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(record)}
                  className="p-1.5 rounded-lg bg-slate/40 hover:bg-slate/70 border border-mist/25 text-mist hover:text-sand transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Bar: Tiêu đề & Nút Tạo Hội Viên */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl twinkle-hero-flow shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-xs font-semibold text-sand backdrop-blur-md">
            <Users className="w-3.5 h-3.5 text-gold-light" />
            <span>PHÂN HỆ QUẢN LÝ HỘI VIÊN & TÀI KHOẢN</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black text-sand tracking-tight">
            Danh Sách Tài Khoản Khách Hàng
          </h1>

          <p className="text-xs text-sand/80 max-w-2xl leading-relaxed">
            Quản lý thông tin hội viên, tra cứu số dư giờ chơi, đặt lại mật khẩu và đăng ký tài khoản trực tiếp tại quầy POS.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="primary"
            size="large"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setRegisterModalOpen(true)}
            className="h-11 px-6 rounded-full bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>+ Đăng Ký Hội Viên Mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Dải Chỉ Số Nhanh (Telemetry Mini Cards - Liquid Glass 3D) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Thẻ 1: Tổng số hội viên (Vàng cát ngà & Xám slate) */}
        <div className="liquid-glass-sand flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold-light" />
                Tổng số hội viên
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_10px_rgba(189,152,117,0.8)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#f0ebe5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-tight">
              {totalCustomers}{' '}
              <span className="text-xs font-normal text-mist font-sans">tài khoản</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Dữ liệu:</span>
            <span className="text-sand font-bold">Hội viên đã kích hoạt</span>
          </div>
        </div>

        {/* Thẻ 2: Tổng giờ chơi khả dụng (Xanh Lục Ngọc Bích) */}
        <div className="liquid-glass-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#34d399]" />
                Tổng giờ khả dụng
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#4ADE80] drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)] tracking-tight font-mono">
              ~{totalPlayableHours}h{' '}
              <span className="text-xs font-normal text-mist font-sans">({totalPlayableMinutes} phút)</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Quy đổi:</span>
            <span className="text-[#34d399] font-bold">Giờ chuẩn Standard</span>
          </div>
        </div>

        {/* Thẻ 3: Quy định nạp đầu (Hổ Phách Đậm & Kem Sữa) */}
        <div className="liquid-glass-amber flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#e0a96d]" />
                Quy định mở tài khoản
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e0a96d] shadow-[0_0_10px_rgba(224,169,109,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-gold drop-shadow-[0_2px_8px_rgba(189,152,117,0.4)] tracking-tight">
              ≥ 10.000 ₫
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>An ninh:</span>
            <span className="text-sand/90 font-bold">Đối soát Camera tại quầy</span>
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu & Bộ Lọc Tìm Kiếm */}
      <GlassCard className="p-5 rounded-2xl border border-mist/20 twinkle-card-flow space-y-4">
        {/* Bộ lọc */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-lg">
            <Input
              prefix={<Search className="w-4 h-4 text-mist mr-1" />}
              placeholder="Tìm theo số điện thoại hoặc tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="h-10 bg-midnight/70 text-sand border-mist/30 hover:border-gold/50 focus:border-gold rounded-xl text-xs flex-1"
            />

            <Select
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              className="h-10 w-36"
              options={[
                { value: 'ALL', label: 'Tất cả vai trò' },
                { value: 'CUSTOMER', label: 'Hội viên' },
                { value: 'STAFF', label: 'Nhân viên' },
                { value: 'ADMIN', label: 'Quản trị' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-mist font-mono">
              Hiển thị: <strong className="text-sand">{filteredAccounts.length}</strong> / {allAccounts.length}
            </span>

            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 px-3.5 rounded-xl twinkle-btn-secondary text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-gold' : ''}`} />
              <span>{isFetching ? 'Đang tải...' : 'Làm mới'}</span>
            </Button>
          </div>
        </div>

        {/* Bảng Ant Design */}
        <Table
          columns={columns}
          dataSource={filteredAccounts}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng cộng ${total} tài khoản`,
            className: 'text-xs text-mist font-mono',
          }}
          className="cyberlux-table"
        />
      </GlassCard>

      {/* 4. MODALS TÍCH HỢP */}
      {/* Modal Đăng Ký Hội Viên Mới */}
      <RegisterCustomerModal
        open={registerModalOpen}
        onCancel={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          setRegisterModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['staff-accounts-list'] });
        }}
      />

      {/* Modal Nạp Giờ Nhanh Cho Khách */}
      <SellTimeModal
        open={sellTimeModalOpen}
        initialAccountId={targetAccount?.id}
        onClose={() => {
          setSellTimeModalOpen(false);
          setTargetAccount(null);
        }}
        onSuccess={() => {
          setSellTimeModalOpen(false);
          setTargetAccount(null);
          queryClient.invalidateQueries({ queryKey: ['staff-accounts-list'] });
        }}
      />

      {/* Modal Mở Máy Nhanh Cho Khách */}
      <StartSessionModal
        open={startSessionModalOpen}
        computer={null}
        onClose={() => {
          setStartSessionModalOpen(false);
          setTargetAccount(null);
        }}
        onSuccess={() => {
          setStartSessionModalOpen(false);
          setTargetAccount(null);
          queryClient.invalidateQueries({ queryKey: ['staff-accounts-list'] });
        }}
      />

      {/* Modal Cập Nhật Thông Tin / Đặt Lại Mật Khẩu */}
      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        centered
        width={460}
        styles={{
          body: {
            backgroundColor: '#202332',
            padding: 0,
            borderRadius: 16,
          },
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
          },
        }}
      >
        <div className="p-6 text-sand space-y-4 select-none">
          <div className="flex items-center gap-3 pb-3 border-b border-mist/20">
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-sand">
                {targetAccount?.role === 'CUSTOMER' ? 'Đổi Mật Khẩu & Cập Nhật Hội Viên' : 'Cập Nhật Tài Khoản Quản Trị'}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-mist mt-0.5">
                <span className="text-gold font-sans font-medium">{targetAccount?.name}</span>
                <span>•</span>
                <span>{targetAccount?.phone}</span>
                {targetAccount?.role && (
                  <Tag className="m-0 text-[10px] font-bold bg-gold/15 text-gold border-gold/30 px-1.5 py-0 rounded">
                    {targetAccount.role}
                  </Tag>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-1">
                Họ và tên
              </label>
              <Input
                size="large"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-midnight/70 text-sand border-mist/30 rounded-xl h-11 text-sm"
              />
            </div>

            {/* Nút đặt nhanh về 4 số cuối SĐT nếu là hội viên */}
            {targetAccount?.role === 'CUSTOMER' && targetAccount?.phone && targetAccount.phone.length >= 4 && (
              <div className="p-3 rounded-xl bg-midnight/60 border border-gold/25 flex items-center justify-between gap-3 shadow-inner">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs text-sand font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-gold shrink-0 animate-pulse" />
                    <span>Khách quên mật khẩu?</span>
                  </div>
                  <p className="text-[11px] text-mist truncate">
                    Mặc định 4 số cuối SĐT: <strong className="text-gold font-mono">{targetAccount.phone.slice(-4)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditPassword(targetAccount.phone.slice(-4))}
                  className="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 border border-gold/40 text-gold hover:text-gold-light text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <Zap className="w-3 h-3 text-gold" />
                  <span>⚡ Điền nhanh {targetAccount.phone.slice(-4)}</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-1">
                Mật khẩu mới (Tự nhập theo ý khách hoặc bấm Điền nhanh)
              </label>
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="bg-midnight/70 text-sand border-mist/30 rounded-xl h-11 text-sm"
              />
              <span className="text-[11px] text-mist/70 mt-1 block">
                * Bỏ trống nếu chỉ muốn cập nhật họ tên mà không đổi mật khẩu.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-mist/20">
            <Button
              onClick={() => setEditModalOpen(false)}
              disabled={editSubmitting}
              className="rounded-xl h-10 text-xs px-4 bg-transparent border-mist/25 text-sand hover:text-mist"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              loading={editSubmitting}
              onClick={handleSaveEdit}
              className="rounded-xl h-10 text-xs px-5 bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-md shadow-gold/20"
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
