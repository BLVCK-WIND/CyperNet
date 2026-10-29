import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  App,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  Phone,
  Clock,
  Crown,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { accountApi } from '@/api/accountApi';
import { PageTransition } from '@/components/animations/PageTransition';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuthStore } from '@/store/authStore';
import { AccountFormModal } from '../components/AccountFormModal';
import type { Account, Role } from '@/types/auth';

const ROLE_TAGS: Record<Role, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ADMIN: {
    label: 'ADMIN',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    icon: <Crown className="w-3.5 h-3.5 text-red-400" />,
  },
  STAFF: {
    label: 'STAFF',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    icon: <Shield className="w-3.5 h-3.5 text-cyan-400" />,
  },
  CUSTOMER: {
    label: 'HỘI VIÊN',
    color: '#bd9875',
    bg: 'rgba(189, 152, 117, 0.15)',
    icon: <UserCheck className="w-3.5 h-3.5 text-gold" />,
  },
};

export const ManageAccountsPage: React.FC = () => {
  useDocumentTitle('Quản lý tài khoản & phân quyền • CyberNet');
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  // Search & Filter State
  const [keyword, setKeyword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // 1. Fetch danh sách tài khoản
  const {
    data: accountsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-accounts-list'],
    queryFn: () => accountApi.getAccounts({ size: 200, sort: 'id,desc' }),
    refetchInterval: 15000,
  });

  const allAccounts: Account[] = accountsData?.content || [];

  // 2. Thống kê Telemetry Strip
  const stats = useMemo(() => {
    const total = allAccounts.length;
    const adminCount = allAccounts.filter((a) => a.role === 'ADMIN').length;
    const staffCount = allAccounts.filter((a) => a.role === 'STAFF').length;
    const customerCount = allAccounts.filter((a) => a.role === 'CUSTOMER').length;
    const totalPlaytimeMinutes = allAccounts.reduce((sum, a) => sum + (a.remainingMinutes || 0), 0);
    return {
      total,
      adminCount,
      staffCount,
      customerCount,
      totalHours: (totalPlaytimeMinutes / 60).toFixed(0),
    };
  }, [allAccounts]);

  // 3. Lọc danh sách Client-side
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      // Keyword search
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const matchPhone = acc.phone.toLowerCase().includes(kw);
        const matchName = acc.name.toLowerCase().includes(kw);
        const matchId = String(acc.id).includes(kw);
        if (!matchPhone && !matchName && !matchId) return false;
      }

      // Filter by Role
      if (selectedRole !== 'ALL' && acc.role !== selectedRole) {
        return false;
      }

      return true;
    });
  }, [allAccounts, keyword, selectedRole]);

  // 4. Mutation Xóa tài khoản
  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts-list'] });
      message.success('Đã xóa tài khoản thành công!');
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || 'Không thể xóa tài khoản này!';
      message.error(errorMsg);
    },
  });

  const handleDeleteAccount = (acc: Account) => {
    if (acc.id === currentUserId) {
      message.warning('Bạn không thể xóa tài khoản đang đăng nhập của chính mình!');
      return;
    }

    modal.confirm({
      title: 'Xác nhận xóa tài khoản',
      content: (
        <div className="space-y-2 text-sand/90 text-sm">
          <p>
            Bạn có chắc chắn muốn xóa tài khoản <strong>"{acc.name}"</strong> (SĐT: <code>{acc.phone}</code>, Vai trò: <strong>{acc.role}</strong>)?
          </p>
          <p className="text-xs text-red-400">
            * Cảnh báo: Toàn bộ dữ liệu phiên chơi và token liên kết với tài khoản này sẽ bị thu hồi.
          </p>
        </div>
      ),
      okText: 'Xác Nhận Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      className: 'twinkle-modal',
      onOk: () => deleteAccountMutation.mutate(acc.id),
    });
  };

  const handleOpenAddModal = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: Account) => {
    setSelectedAccount(acc);
    setIsModalOpen(true);
  };

  // Cấu hình cột Table
  const columns: ColumnsType<Account> = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => (
        <span className="font-mono text-xs text-mist/80">#{id}</span>
      ),
    },
    {
      title: 'Tài Khoản / Người Dùng',
      key: 'name',
      render: (_, record) => {
        const isSelf = record.id === currentUserId;
        const initial = record.name ? record.name.charAt(0).toUpperCase() : 'U';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-heading font-black text-sm shrink-0">
              {initial}
            </div>
            <div>
              <div className="font-heading font-bold text-sand text-sm flex items-center gap-2">
                <span>{record.name}</span>
                {isSelf && (
                  <Tag className="m-0 text-[10px] font-bold bg-gold text-midnight border-0 px-2 py-0.2 rounded-full">
                    BẠN
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
      title: 'Phân Quyền Vai Trò',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: Role) => {
        const tagCfg = ROLE_TAGS[role] || ROLE_TAGS.CUSTOMER;
        return (
          <Tag
            className="border-0 px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 w-fit"
            style={{ color: tagCfg.color, backgroundColor: tagCfg.bg }}
          >
            {tagCfg.icon}
            <span>{tagCfg.label}</span>
          </Tag>
        );
      },
    },
    {
      title: 'Số Dư Giờ Chơi',
      dataIndex: 'remainingMinutes',
      key: 'remainingMinutes',
      width: 180,
      sorter: (a, b) => (a.remainingMinutes || 0) - (b.remainingMinutes || 0),
      render: (mins: number, record: Account) => {
        if (record.role !== 'CUSTOMER') {
          return <span className="text-mist/40 text-xs font-mono">—</span>;
        }

        const isZero = !mins || mins <= 0;
        const hours = ((mins || 0) / 60).toFixed(1);

        return isZero ? (
          <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 font-mono text-xs font-semibold">
            0 phút (Hết giờ)
          </span>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold/15 border border-gold/30 text-gold font-mono text-xs font-bold shadow-[0_0_8px_rgba(189,152,117,0.15)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{mins} phút</span>
            <span className="text-[11px] text-mist/80 font-normal">(~{hours}h)</span>
          </div>
        );
      },
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => (
        <span className="text-xs text-mist font-mono">
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '—'}
        </span>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => {
        const isSelf = record.id === currentUserId;
        return (
          <div className="flex items-center justify-end gap-1">
            <Tooltip title="Chỉnh sửa hoặc đổi mật khẩu">
              <Button
                type="text"
                size="small"
                icon={<Edit3 className="w-4 h-4 text-mist hover:text-gold" />}
                onClick={() => handleOpenEditModal(record)}
                className="hover:bg-white/5"
              />
            </Tooltip>
            <Tooltip title={isSelf ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}>
              <Button
                type="text"
                size="small"
                disabled={isSelf}
                icon={<Trash2 className="w-4 h-4 text-red-400/80 hover:text-red-400" />}
                onClick={() => handleDeleteAccount(record)}
                className="hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold mb-1">
              <Users className="w-4 h-4" />
              <span>Phân Hệ Quản Trị Nhân Sự & Khách Hàng</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-sand">
              Quản Lý Tài Khoản & Phân Quyền
            </h1>
            <p className="text-xs text-mist mt-0.5">
              Cấp tài khoản nhân viên ca trực, quản trị viên, quản lý số dư thời gian và đặt lại mật khẩu hội viên
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
              onClick={() => refetch()}
              className="rounded-xl h-10 border-mist/30 text-sand hover:border-gold hover:text-gold bg-midnight/60"
            >
              Làm Mới
            </Button>
            <Button
              type="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
              className="rounded-xl h-10 px-4 bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20 flex items-center gap-1.5"
            >
              Cấp Tài Khoản
            </Button>
          </div>
        </div>

        {/* 2. Dải chỉ số Liquid Glass 3D (Telemetry Stats Strip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quản trị viên */}
          <div className="liquid-glass-card liquid-glass-sunset cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Quản Trị Viên</span>
              <div className="p-2 rounded-xl bg-red-500/20 text-red-300">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.adminCount}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Quyền cao nhất</span>
              <span className="font-bold text-red-400">ADMIN</span>
            </div>
          </div>

          {/* Nhân viên */}
          <div className="liquid-glass-card liquid-glass-cyan cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Nhân Viên Ca Trực</span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.staffCount}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Vận hành quầy POS</span>
              <span className="font-bold text-cyan-300">STAFF</span>
            </div>
          </div>

          {/* Hội viên */}
          <div className="liquid-glass-card liquid-glass-amber cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Hội Viên Tiệm</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.customerCount}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Tổng khách hàng</span>
              <span className="font-bold text-amber-300">{stats.total} accounts</span>
            </div>
          </div>

          {/* Quỹ giờ chơi */}
          <div className="liquid-glass-card liquid-glass-emerald cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Tổng Quỹ Giờ Khách</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.totalHours} <span className="text-sm font-normal text-sand/70">giờ</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Phút cơ sở @ 10k/h</span>
              <span className="font-bold text-emerald-400">Standard</span>
            </div>
          </div>
        </div>

        {/* 3. Filter Bar & Search */}
        <div className="p-4 rounded-2xl bg-midnight/80 border border-mist/20 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input Search */}
            <Input
              placeholder="Tìm theo số điện thoại, họ tên hoặc mã #ID..."
              prefix={<Search className="w-4 h-4 text-mist/60 mr-1" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              className="h-10 rounded-xl bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/50 sm:max-w-md"
            />

            {/* Select Vai trò */}
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              className="h-10 sm:w-52"
              options={[
                { value: 'ALL', label: 'Tất cả các vai trò' },
                { value: 'ADMIN', label: '👑 Quản trị viên (ADMIN)' },
                { value: 'STAFF', label: '🛡️ Nhân viên (STAFF)' },
                { value: 'CUSTOMER', label: '👤 Hội viên (CUSTOMER)' },
              ]}
            />
          </div>

          <div className="text-xs text-mist/80 self-end md:self-center font-mono">
            Hiển thị <span className="text-gold font-bold">{filteredAccounts.length}</span> / {stats.total} tài khoản
          </div>
        </div>

        {/* 4. Data Table */}
        <div className="rounded-2xl border border-mist/20 overflow-hidden shadow-2xl bg-midnight/90">
          <Table
            columns={columns}
            dataSource={filteredAccounts}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tài khoản`,
              className: 'px-4 py-3',
            }}
            className="twinkle-table"
            locale={{
              emptyText: (
                <div className="py-12 flex flex-col items-center justify-center text-mist/70">
                  <Users className="w-10 h-10 mb-2 stroke-[1.2]" />
                  <p className="text-sm">Không tìm thấy tài khoản nào phù hợp</p>
                  <Button
                    type="link"
                    onClick={() => {
                      setKeyword('');
                      setSelectedRole('ALL');
                    }}
                    className="text-gold text-xs mt-1"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              ),
            }}
          />
        </div>

        {/* 5. Modal Thêm / Chỉnh Sửa */}
        <AccountFormModal
          open={isModalOpen}
          account={selectedAccount}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAccount(null);
          }}
          onSuccess={() => refetch()}
        />
      </div>
    </PageTransition>
  );
};

export default ManageAccountsPage;
