import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Switch,
  App,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Utensils,
  Coffee,
  Gamepad2,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  Package,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '@/api/itemApi';
import { PageTransition } from '@/components/animations/PageTransition';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ItemFormModal } from '../components/ItemFormModal';
import type { ItemResponse, ItemType } from '@/types/item';

const TYPE_CONFIG: Record<
  ItemType,
  { label: string; color: string; icon: React.ReactNode; bg: string }
> = {
  FOOD: {
    label: 'Món ăn',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: <Utensils className="w-3.5 h-3.5 text-amber-400" />,
  },
  DRINK: {
    label: 'Đồ uống',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    icon: <Coffee className="w-3.5 h-3.5 text-cyan-400" />,
  },
  PLAYTIME: {
    label: 'Gói giờ',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    icon: <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  SERVICE: {
    label: 'Tiện ích',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
  },
};

export const ManageItemsPage: React.FC = () => {
  useDocumentTitle('Quản lý thực đơn & dịch vụ • CyberNet');
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  // Search & Filters
  const [keyword, setKeyword] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemResponse | null>(null);

  // 1. Fetch danh sách món ăn từ Backend
  const {
    data: itemsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-items-list'],
    queryFn: () => itemApi.getAllItems({ page: 0, size: 100 }),
    refetchInterval: 15000,
  });

  const allItems: ItemResponse[] = itemsData?.content || [];

  // 2. Thống kê nhanh Telemetry Strip
  const stats = useMemo(() => {
    const total = allItems.length;
    const foodCount = allItems.filter((i) => i.type === 'FOOD').length;
    const drinkCount = allItems.filter((i) => i.type === 'DRINK').length;
    const playtimeCount = allItems.filter((i) => i.type === 'PLAYTIME').length;
    const outOfStockCount = allItems.filter((i) => !i.available).length;
    return { total, foodCount, drinkCount, playtimeCount, outOfStockCount };
  }, [allItems]);

  // 3. Lọc danh sách Client-side
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Keyword search
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const matchName = item.name.toLowerCase().includes(kw);
        const matchId = String(item.id).includes(kw);
        if (!matchName && !matchId) return false;
      }

      // Filter by Type
      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }

      // Filter by Status
      if (selectedStatus === 'AVAILABLE' && !item.available) return false;
      if (selectedStatus === 'OUT_OF_STOCK' && item.available) return false;

      return true;
    });
  }, [allItems, keyword, selectedType, selectedStatus]);

  // 4. Mutation Toggle trạng thái Còn hàng / Hết hàng
  const toggleAvailableMutation = useMutation({
    mutationFn: async ({ item, newStatus }: { item: ItemResponse; newStatus: boolean }) => {
      return itemApi.updateItem(item.id, {
        name: item.name,
        price: item.price,
        type: item.type,
        available: newStatus,
        imageUrl: item.imageUrl,
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-items-list'] });
      message.success(
        `Đã chuyển "${updated.name}" sang trạng thái: ${updated.available ? 'CÒN HÀNG' : 'HẾT HÀNG'}`
      );
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || 'Không thể cập nhật trạng thái món!';
      message.error(errorMsg);
    },
  });

  // 5. Mutation Xóa món
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => itemApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items-list'] });
      message.success('Đã xóa mặt hàng khỏi thực đơn thành công!');
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || 'Không thể xóa món ăn này!';
      message.error(errorMsg);
    },
  });

  const handleDeleteItem = (item: ItemResponse) => {
    modal.confirm({
      title: 'Xác nhận xóa mặt hàng',
      content: (
        <div className="space-y-2 text-sand/90 text-sm">
          <p>
            Bạn có chắc chắn muốn xóa mặt hàng <strong>"{item.name}"</strong> (ID: #{item.id})?
          </p>
          <p className="text-xs text-amber-400">
            * Hành động này sẽ gỡ bỏ món khỏi thực đơn và không thể hoàn tác.
          </p>
        </div>
      ),
      okText: 'Xác Nhận Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      className: 'twinkle-modal',
      onOk: () => deleteItemMutation.mutate(item.id),
    });
  };

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ItemResponse) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Cấu hình cột Table
  const columns: ColumnsType<ItemResponse> = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => (
        <span className="font-mono text-xs text-mist/80">#{id}</span>
      ),
    },
    {
      title: 'Mặt Hàng',
      key: 'name',
      render: (_, record) => {
        const typeCfg = TYPE_CONFIG[record.type] || TYPE_CONFIG.FOOD;
        return (
          <div className="flex items-center gap-3">
            {/* Thumbnail ảnh */}
            <div className="w-12 h-12 rounded-xl bg-midnight/90 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {record.imageUrl ? (
                <img
                  src={record.imageUrl}
                  alt={record.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-mist/50">{typeCfg.icon}</div>
              )}
            </div>

            {/* Thông tin tên */}
            <div>
              <div className="font-semibold text-sand text-sm line-clamp-1">
                {record.name}
              </div>
              <div className="text-xs text-mist/70 font-mono mt-0.5">
                {record.type === 'PLAYTIME' ? 'Tự động quy đổi phút' : 'Món F&B'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Phân Loại',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: ItemType) => {
        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.FOOD;
        return (
          <Tag
            className="border-0 px-2.5 py-1 rounded-full font-medium text-xs flex items-center gap-1.5 w-fit"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.icon}
            <span>{cfg.label}</span>
          </Tag>
        );
      },
    },
    {
      title: 'Đơn Giá',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      render: (price: number) => (
        <div className="font-heading font-bold text-gold text-sm tracking-wide">
          {Number(price).toLocaleString('vi-VN')} <span className="text-xs text-sand/70">₫</span>
        </div>
      ),
    },
    {
      title: 'Trạng Thái Mở Bán',
      dataIndex: 'available',
      key: 'available',
      width: 160,
      render: (available: boolean, record: ItemResponse) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={available}
            onChange={(checked) =>
              toggleAvailableMutation.mutate({ item: record, newStatus: checked })
            }
            loading={toggleAvailableMutation.isPending}
            checkedChildren="CÒN"
            unCheckedChildren="HẾT"
            className="bg-mist/30"
          />
          <span
            className={`text-xs font-semibold ${
              available ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {available ? 'Còn hàng' : 'Hết hàng'}
          </span>
        </div>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Chỉnh sửa món">
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-4 h-4 text-mist hover:text-gold" />}
              onClick={() => handleOpenEditModal(record)}
              className="hover:bg-white/5"
            />
          </Tooltip>
          <Tooltip title="Xóa món">
            <Button
              type="text"
              size="small"
              icon={<Trash2 className="w-4 h-4 text-red-400/80 hover:text-red-400" />}
              onClick={() => handleDeleteItem(record)}
              className="hover:bg-red-500/10"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold mb-1">
              <Utensils className="w-4 h-4" />
              <span>Phân Hệ Quản Trị Thực Đơn</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-sand">
              Quản Lý Thực Đơn & Dịch Vụ
            </h1>
            <p className="text-xs text-mist mt-0.5">
              Cập nhật giá bán, phân loại món ăn, đồ uống và các gói nạp giờ chơi trên toàn hệ thống
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
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
              className="rounded-xl h-10 px-4 bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20 flex items-center gap-1.5"
            >
              Thêm Mặt Hàng
            </Button>
          </div>
        </div>

        {/* 2. Dải chỉ số Liquid Glass 3D (Telemetry Stats Strip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng số món */}
          <div className="liquid-glass-card liquid-glass-amber cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Tổng Mặt Hàng</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.total}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Đang mở bán</span>
              <span className="font-bold text-emerald-400">{stats.total - stats.outOfStockCount}</span>
            </div>
          </div>

          {/* Món ăn */}
          <div className="liquid-glass-card liquid-glass-sunset cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Món Ăn Chế Biến</span>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.foodCount}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Món nóng & Snack</span>
              <span className="font-bold text-amber-300">FOOD</span>
            </div>
          </div>

          {/* Đồ uống */}
          <div className="liquid-glass-card liquid-glass-cyan cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Đồ Uống Giải Khát</span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Coffee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.drinkCount}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Nước ngọt & Cà phê</span>
              <span className="font-bold text-cyan-300">DRINK</span>
            </div>
          </div>

          {/* Hết hàng & Cảnh báo */}
          <div className="liquid-glass-card liquid-glass-emerald cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Gói Giờ & Tiện Ích</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Gamepad2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.playtimeCount}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Tạm hết hàng</span>
              <span className={`font-bold ${stats.outOfStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {stats.outOfStockCount} món
              </span>
            </div>
          </div>
        </div>

        {/* 3. Filter Bar & Search */}
        <div className="p-4 rounded-2xl bg-midnight/80 border border-mist/20 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input Search */}
            <Input
              placeholder="Tìm theo tên món hoặc mã #ID..."
              prefix={<Search className="w-4 h-4 text-mist/60 mr-1" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              className="h-10 rounded-xl bg-midnight/70 border-mist/30 text-sand placeholder:text-mist/50 sm:max-w-xs"
            />

            {/* Select Loại món */}
            <Select
              value={selectedType}
              onChange={setSelectedType}
              className="h-10 sm:w-44"
              options={[
                { value: 'ALL', label: 'Tất cả loại món' },
                { value: 'FOOD', label: '🍔 Món ăn' },
                { value: 'DRINK', label: '🥤 Đồ uống' },
                { value: 'PLAYTIME', label: '🎮 Gói nạp giờ' },
                { value: 'SERVICE', label: '⚡ Dịch vụ' },
              ]}
            />

            {/* Select Trạng thái */}
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="h-10 sm:w-40"
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'AVAILABLE', label: '🟢 Đang mở bán' },
                { value: 'OUT_OF_STOCK', label: '🔴 Tạm hết hàng' },
              ]}
            />
          </div>

          <div className="text-xs text-mist/80 self-end md:self-center font-mono">
            Hiển thị <span className="text-gold font-bold">{filteredItems.length}</span> / {stats.total} món
          </div>
        </div>

        {/* 4. Data Table */}
        <div className="rounded-2xl border border-mist/20 overflow-hidden shadow-2xl bg-midnight/90">
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} món`,
              className: 'px-4 py-3',
            }}
            className="twinkle-table"
            locale={{
              emptyText: (
                <div className="py-12 flex flex-col items-center justify-center text-mist/70">
                  <Package className="w-10 h-10 mb-2 stroke-[1.2]" />
                  <p className="text-sm">Không tìm thấy mặt hàng nào phù hợp</p>
                  <Button
                    type="link"
                    onClick={() => {
                      setKeyword('');
                      setSelectedType('ALL');
                      setSelectedStatus('ALL');
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
        <ItemFormModal
          open={isModalOpen}
          item={selectedItem}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          onSuccess={() => refetch()}
        />
      </div>
    </PageTransition>
  );
};

export default ManageItemsPage;
