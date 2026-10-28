import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  App,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Layers,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Monitor,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zoneApi } from '@/api/zoneApi';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ZoneResponse, CreateZoneRequest, UpdateZoneRequest } from '@/types/zone';

const COLOR_PRESETS = [
  { label: 'Caramel Gold', color: '#bd9875' },
  { label: 'Ice Cyan (Standard)', color: '#85C1DC' },
  { label: 'Electric Cyan', color: '#06b6d4' },
  { label: 'Stream Purple', color: '#8b5cf6' },
  { label: 'Couple Pink', color: '#ec4899' },
  { label: 'Arena Red', color: '#ef4444' },
  { label: 'Emerald Green', color: '#10b981' },
];

export const ZoneManagerPage: React.FC = () => {
  useDocumentTitle('Quản lý khu vực phòng máy • CyberNet');
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneResponse | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#bd9875');

  const [form] = Form.useForm();

  // Fetch all zones
  const {
    data: zones = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-zones-list'],
    queryFn: () => zoneApi.getAllZones(),
    refetchInterval: 15000,
  });

  // Telemetry KPIs
  const totalZones = zones.length;
  const activeZonesCount = zones.filter((z) => z.active).length;
  const totalAssignedComputers = zones.reduce((sum, z) => sum + (z.totalComputers || 0), 0);
  const maxPrice = useMemo(() => {
    if (!zones.length) return 0;
    return Math.max(...zones.map((z) => Number(z.defaultPricePerHour) || 0));
  }, [zones]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateZoneRequest) => zoneApi.createZone(data),
    onSuccess: (newZone) => {
      message.success(`Đã tạo khu vực "${newZone.name}" (${newZone.code}) thành công!`);
      queryClient.invalidateQueries({ queryKey: ['admin-zones-list'] });
      queryClient.invalidateQueries({ queryKey: ['active-zones'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể tạo khu vực. Vui lòng thử lại!';
      message.error(msg);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateZoneRequest }) =>
      zoneApi.updateZone(id, data),
    onSuccess: (updatedZone) => {
      message.success(`Đã cập nhật khu vực "${updatedZone.name}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ['admin-zones-list'] });
      queryClient.invalidateQueries({ queryKey: ['active-zones'] });
      setIsModalOpen(false);
      setEditingZone(null);
      form.resetFields();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể cập nhật khu vực!';
      message.error(msg);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => zoneApi.deleteZone(id),
    onSuccess: () => {
      message.success('Đã xóa khu vực thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-zones-list'] });
      queryClient.invalidateQueries({ queryKey: ['active-zones'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể xóa khu vực này!';
      message.error(msg);
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setEditingZone(null);
    setSelectedColor('#bd9875');
    form.resetFields();
    form.setFieldsValue({
      active: true,
      colorCode: '#bd9875',
      defaultPricePerHour: 15000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: ZoneResponse) => {
    setEditingZone(zone);
    setSelectedColor(zone.colorCode || '#bd9875');
    form.setFieldsValue({
      name: zone.name,
      defaultPricePerHour: zone.defaultPricePerHour,
      colorCode: zone.colorCode,
      description: zone.description,
      active: zone.active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (zone: ZoneResponse) => {
    if (zone.code === 'STANDARD' || zone.code === 'VIP') {
      message.warning('Khu vực mặc định cốt lõi của hệ thống (STANDARD/VIP) không thể xóa!');
      return;
    }

    if (zone.totalComputers > 0) {
      modal.error({
        title: 'Không thể xóa khu vực này!',
        content: `Khu vực "${zone.name}" hiện đang có ${zone.totalComputers} máy trạm liên kết. Vui lòng chuyển các máy trạm sang khu vực khác trước khi xóa.`,
        okText: 'Đã hiểu',
      });
      return;
    }

    modal.confirm({
      title: 'Xác nhận xóa khu vực',
      content: `Bạn có chắc chắn muốn xóa khu vực "${zone.name}" (${zone.code}) khỏi hệ thống? Thao tác này không thể hoàn tác.`,
      okText: 'Xác nhận xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(zone.id),
    });
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingZone) {
        updateMutation.mutate({
          id: editingZone.id,
          data: {
            name: values.name,
            defaultPricePerHour: values.defaultPricePerHour,
            colorCode: selectedColor,
            description: values.description,
            active: values.active,
          },
        });
      } else {
        createMutation.mutate({
          code: values.code,
          name: values.name,
          defaultPricePerHour: values.defaultPricePerHour,
          colorCode: selectedColor,
          description: values.description,
          active: values.active,
        });
      }
    } catch {
      // Form validation error
    }
  };

  // Table Columns
  const columns: ColumnsType<ZoneResponse> = [
    {
      title: 'Mã viết tắt (Tag)',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (code: string, record) => (
        <ZoneBadge
          zone={code}
          colorCode={record.colorCode}
          size="md"
        />
      ),
    },
    {
      title: 'Tên khu vực & Mô tả',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div className="font-semibold text-sand text-base">{name}</div>
          {record.description && (
            <div className="text-xs text-mist mt-0.5 line-clamp-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Đơn giá giờ gợi ý',
      dataIndex: 'defaultPricePerHour',
      key: 'defaultPricePerHour',
      width: 170,
      render: (price: number) => (
        <span className="font-display font-bold text-gold text-base">
          {Number(price).toLocaleString('vi-VN')}
          <span className="text-xs font-normal text-mist ml-1">₫/h</span>
        </span>
      ),
    },
    {
      title: 'Máy trạm gán khu vực',
      dataIndex: 'totalComputers',
      key: 'totalComputers',
      width: 180,
      render: (count: number) => (
        <div className="flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-mist" />
          <span className="font-semibold text-sand">
            {count > 0 ? (
              <span className="text-sand">{count} máy</span>
            ) : (
              <span className="text-mist text-xs">Chưa gán máy</span>
            )}
          </span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      width: 140,
      render: (active: boolean) =>
        active ? (
          <Tag color="success" className="font-semibold rounded-full px-2.5">
            Hoạt động
          </Tag>
        ) : (
          <Tag color="default" className="font-medium rounded-full px-2.5 opacity-60">
            Tạm dừng
          </Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip title="Chỉnh sửa khu vực">
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-4 h-4 text-gold hover:text-gold-light" />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          {record.code !== 'STANDARD' && record.code !== 'VIP' && (
            <Tooltip title="Xóa khu vực">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="w-4 h-4 text-danger hover:opacity-80" />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-sand tracking-tight">
              Quản lý Khu Vực (Zones)
            </h1>
          </div>
          <p className="text-mist text-sm mt-1">
            Cấu hình phân vùng phòng máy, đơn giá giờ gợi ý và màu nhận diện sơ đồ thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-gold' : ''}`} />}
            onClick={() => refetch()}
            className="twinkle-btn-secondary"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
            className="!rounded-full font-semibold shadow-lg shadow-gold/20"
          >
            Thêm khu vực mới
          </Button>
        </div>
      </div>

      {/* 2. Dải chỉ số Liquid Glass 3D (Telemetry Stats Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số khu vực */}
        <div className="liquid-glass-amber flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Tổng số khu vực
            </span>
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-sand">{totalZones}</span>
            <span className="text-xs text-mist ml-1.5">phân vùng</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Hệ thống CyberNet
          </div>
        </div>

        {/* Card 2: Khu đang hoạt động */}
        <div className="liquid-glass-cyan flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Đang hoạt động
            </span>
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-cyan-300">{activeZonesCount}</span>
            <span className="text-xs text-mist ml-1.5">khu vực mở</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Khách có thể chọn máy
          </div>
        </div>

        {/* Card 3: Máy trạm liên kết */}
        <div className="liquid-glass-sand flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Máy trạm phân bổ
            </span>
            <Monitor className="w-5 h-5 text-[#d4b595]" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-sand">{totalAssignedComputers}</span>
            <span className="text-xs text-mist ml-1.5">máy trạm</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Tổng quy mô phòng net
          </div>
        </div>

        {/* Card 4: Đơn giá cao nhất */}
        <div className="liquid-glass-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Đơn giá cao nhất
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-emerald-300">
              {maxPrice.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-mist ml-1.5">₫/h</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Phân khúc cao cấp
          </div>
        </div>
      </div>

      {/* 3. Bảng danh sách Khu vực (DataTable) */}
      <div className="twinkle-major-flow rounded-3xl p-5 sm:p-6 border border-gold/25 shadow-2xl">
        <Table<ZoneResponse>
          rowKey="id"
          columns={columns}
          dataSource={zones}
          loading={isLoading}
          pagination={false}
          className="ant-table-twinkle"
        />
      </div>

      {/* 4. Modal Thêm / Cập nhật Khu Vực */}
      <Modal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingZone(null);
        }}
        onOk={handleFormSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        title={
          <div className="flex items-center gap-2 text-sand text-lg font-bold">
            <Sparkles className="w-5 h-5 text-gold" />
            <span>{editingZone ? `Chỉnh sửa: ${editingZone.name}` : 'Thêm khu vực phòng máy mới'}</span>
          </div>
        }
        okText={editingZone ? 'Lưu thay đổi' : 'Tạo khu vực'}
        cancelText="Đóng"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4 space-y-4">
          {/* Mã viết tắt hiển thị trên thẻ máy trạm */}
          <Form.Item
            name="code"
            label={<span className="text-sand font-medium">Mã viết tắt trên thẻ máy (Code - VD: VAL, VIP, ARENA, FPS)</span>}
            rules={[
              { required: !editingZone, message: 'Vui lòng nhập mã viết tắt khu vực!' },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: 'Mã khu vực chỉ chứa chữ cái, chữ số, gạch dưới hoặc gạch ngang!',
              },
            ]}
            extra={
              editingZone ? (
                <span className="text-xs text-mist">
                  Mã viết tắt bất biến không thể thay đổi sau khi tạo để bảo vệ liên kết dữ liệu máy.
                </span>
              ) : (
                <span className="text-xs text-mist">
                  Mã viết tắt ngắn gọn (3-6 ký tự) sẽ hiển thị trực tiếp trên thẻ máy trạm tại sơ đồ phòng máy (Staff) và ứng dụng khách hàng (Customer).
                </span>
              )
            }
          >
            <Input
              placeholder="VD: VAL, FPS, ARENA, STREAM"
              disabled={Boolean(editingZone)}
              className="uppercase font-semibold tracking-wider"
              onChange={(e) => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
            />
          </Form.Item>

          {/* Tên hiển thị đầy đủ của khu vực */}
          <Form.Item
            name="name"
            label={<span className="text-sand font-medium">Tên hiển thị đầy đủ (Name - VD: Khu Thi Đấu Valorant)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên khu vực!' }]}
            extra={
              <span className="text-xs text-mist">
                Tên đầy đủ dùng cho thanh lọc phân khu, thực đơn dịch vụ và báo cáo doanh thu.
              </span>
            }
          >
            <Input placeholder="VD: Khu Thi Đấu Valorant" />
          </Form.Item>

          {/* Đơn giá giờ gợi ý */}
          <Form.Item
            name="defaultPricePerHour"
            label={<span className="text-sand font-medium">Đơn giá giờ chơi gợi ý (VNĐ/giờ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập đơn giá giờ chơi!' }]}
          >
            <InputNumber<number>
              min={1000}
              step={1000}
              style={{ width: '100%' }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
              addonAfter="₫/h"
            />
          </Form.Item>

          {/* Bộ chọn mã màu đại diện */}
          <div>
            <label className="block text-sand font-medium mb-1.5 text-sm">
              Màu sắc đại diện trên sơ đồ máy
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setSelectedColor(p.color)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    selectedColor.toLowerCase() === p.color.toLowerCase()
                      ? 'border-white scale-105 shadow-md'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: `${p.color}25`, color: p.color }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-10 h-9 rounded-lg border border-mist/30 bg-midnight cursor-pointer"
              />
              <Input
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#bd9875"
                style={{ width: 140 }}
              />
            </div>
          </div>

          {/* Mô tả */}
          <Form.Item
            name="description"
            label={<span className="text-sand font-medium">Mô tả cấu hình & tiện ích</span>}
          >
            <Input.TextArea
              rows={2}
              placeholder="VD: Màn hình ASUS ROG 240Hz, Card đồ họa RTX 4070, tai nghe chống ồn..."
            />
          </Form.Item>

          {/* Trạng thái hoạt động */}
          <Form.Item
            name="active"
            valuePropName="checked"
            label={<span className="text-sand font-medium">Cho phép hoạt động</span>}
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
