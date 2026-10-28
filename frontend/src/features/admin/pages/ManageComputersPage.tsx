import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  App,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Monitor,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Search,
  Wrench,
  CheckCircle2,
  Sparkles,
  Wifi,
  Radio,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { computerApi } from '@/api/computerApi';
import { zoneApi } from '@/api/zoneApi';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ComputerResponse, ComputerStatus, CreateComputerRequest, UpdateComputerRequest } from '@/types/computer';
import type { ZoneResponse } from '@/types/zone';

export const ManageComputersPage: React.FC = () => {
  useDocumentTitle('Quản lý máy trạm • CyberNet');
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  // Search & Filters
  const [keyword, setKeyword] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComputer, setEditingComputer] = useState<ComputerResponse | null>(null);

  const [form] = Form.useForm();

  // 1. Fetch danh sách máy trạm (size 100)
  const {
    data: computersData,
    isLoading: isLoadingComputers,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-computers-list'],
    queryFn: () => computerApi.getComputers({ size: 100 }),
    refetchInterval: 10000,
  });

  const allComputers: ComputerResponse[] = computersData?.content || [];

  // 2. Fetch danh sách khu vực (Zones)
  const { data: zones = [] } = useQuery({
    queryKey: ['admin-zones-list'],
    queryFn: () => zoneApi.getAllZones(),
    staleTime: 60000,
  });

  // Map zone code sang ZoneResponse để lấy màu và tên
  const zoneMap = useMemo(() => {
    const map = new Map<string, ZoneResponse>();
    zones.forEach((z) => map.set(z.code.toUpperCase(), z));
    return map;
  }, [zones]);

  // Telemetry KPIs
  const totalComputers = allComputers.length;
  const availableCount = allComputers.filter((c) => c.status === 'AVAILABLE').length;
  const inUseCount = allComputers.filter((c) => c.status === 'IN_USE').length;
  const maintenanceCount = allComputers.filter((c) => c.status === 'MAINTENANCE').length;

  // Filtered Computers
  const filteredComputers = useMemo(() => {
    return allComputers.filter((c) => {
      const matchZone = selectedZone === 'ALL' || c.zone?.toUpperCase() === selectedZone.toUpperCase();
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const cleanKeyword = keyword.trim().toLowerCase();
      const matchKeyword =
        !cleanKeyword ||
        c.code.toLowerCase().includes(cleanKeyword) ||
        c.ipAddress.toLowerCase().includes(cleanKeyword);
      return matchZone && matchStatus && matchKeyword;
    });
  }, [allComputers, selectedZone, selectedStatus, keyword]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateComputerRequest) => computerApi.createComputer(data),
    onSuccess: (newComputer) => {
      message.success(`Đã thêm máy trạm "${newComputer.code}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ['admin-computers-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-quick-computer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-zones-list'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể tạo máy trạm. Vui lòng kiểm tra lại!';
      message.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateComputerRequest }) =>
      computerApi.updateComputer(id, data),
    onSuccess: (updatedComputer) => {
      message.success(`Đã cập nhật máy trạm "${updatedComputer.code}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ['admin-computers-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-quick-computer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-zones-list'] });
      setIsModalOpen(false);
      setEditingComputer(null);
      form.resetFields();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể cập nhật máy trạm!';
      message.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => computerApi.deleteComputer(id),
    onSuccess: () => {
      message.success('Đã xóa máy trạm khỏi hệ thống!');
      queryClient.invalidateQueries({ queryKey: ['admin-computers-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-quick-computer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-zones-list'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể xóa máy trạm này!';
      message.error(msg);
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setEditingComputer(null);
    form.resetFields();

    // Default zone
    const defaultZone = zones[0]?.code || 'STANDARD';
    const defaultPrice = zones[0]?.defaultPricePerHour || 10000;

    form.setFieldsValue({
      zone: defaultZone,
      pricePerHour: defaultPrice,
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: ComputerResponse) => {
    setEditingComputer(comp);
    form.setFieldsValue({
      code: comp.code,
      ipAddress: comp.ipAddress,
      zone: comp.zone,
      pricePerHour: comp.pricePerHour,
      status: comp.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleMaintenance = (comp: ComputerResponse) => {
    if (comp.status === 'IN_USE') {
      message.warning('Máy đang có khách chơi! Vui lòng kết thúc phiên trước khi chuyển sang bảo trì.');
      return;
    }

    const nextStatus: ComputerStatus = comp.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    const actionText = nextStatus === 'MAINTENANCE' ? 'đưa vào chế độ BẢO TRÌ' : 'kích hoạt SẴN SÀNG đón khách';

    modal.confirm({
      title: 'Thay đổi trạng thái máy',
      content: `Bạn có chắc muốn ${actionText} cho máy ${comp.code}?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () =>
        updateMutation.mutate({
          id: comp.id,
          data: {
            code: comp.code,
            ipAddress: comp.ipAddress,
            zone: comp.zone,
            pricePerHour: comp.pricePerHour,
            status: nextStatus,
          },
        }),
    });
  };

  const handleDelete = (comp: ComputerResponse) => {
    if (comp.status === 'IN_USE') {
      message.warning('Không thể xóa máy trạm đang có phiên chơi hoạt động!');
      return;
    }

    modal.confirm({
      title: 'Xác nhận xóa máy trạm',
      content: `Bạn có chắc chắn muốn xóa máy "${comp.code}" (${comp.ipAddress}) khỏi hệ thống? Thao tác này không thể hoàn tác.`,
      okText: 'Xác nhận xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(comp.id),
    });
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingComputer) {
        updateMutation.mutate({
          id: editingComputer.id,
          data: {
            code: values.code,
            ipAddress: values.ipAddress,
            zone: values.zone,
            pricePerHour: values.pricePerHour,
            status: values.status,
          },
        });
      } else {
        createMutation.mutate({
          code: values.code,
          ipAddress: values.ipAddress,
          zone: values.zone,
          pricePerHour: values.pricePerHour,
          status: values.status || 'AVAILABLE',
        });
      }
    } catch {
      // Form validation error
    }
  };

  // Auto-fill price suggestion when zone changes
  const handleZoneChange = (zoneCode: string) => {
    const matchedZone = zoneMap.get(zoneCode.toUpperCase());
    if (matchedZone && matchedZone.defaultPricePerHour) {
      form.setFieldsValue({ pricePerHour: Number(matchedZone.defaultPricePerHour) });
    }
  };

  // Columns definition
  const columns: ColumnsType<ComputerResponse> = [
    {
      title: 'Mã máy',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (code: string) => (
        <span className="font-display font-bold text-sand text-base tracking-wide">
          {code}
        </span>
      ),
    },
    {
      title: 'Khu vực (Zone)',
      dataIndex: 'zone',
      key: 'zone',
      width: 190,
      render: (zoneCode: string) => {
        const zoneInfo = zoneMap.get(zoneCode?.toUpperCase());
        return (
          <div className="flex items-center gap-2">
            <ZoneBadge
              zone={zoneCode}
              colorCode={zoneInfo?.colorCode}
              size="sm"
            />
            {zoneInfo?.name && (
              <span className="text-xs text-mist truncate max-w-[120px]">
                {zoneInfo.name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Đơn giá giờ chơi',
      dataIndex: 'pricePerHour',
      key: 'pricePerHour',
      width: 160,
      render: (price: number) => (
        <span className="font-display font-bold text-gold text-base">
          {Number(price).toLocaleString('vi-VN')}
          <span className="text-xs font-normal text-mist ml-1">₫/h</span>
        </span>
      ),
    },
    {
      title: 'Địa chỉ IP nội bộ',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 170,
      render: (ip: string) => (
        <div className="flex items-center gap-1.5 text-mist font-mono text-xs">
          <Wifi className="w-3.5 h-3.5 text-mist/60" />
          <span>{ip}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: ComputerStatus) => {
        if (status === 'AVAILABLE') {
          return (
            <Tag color="success" className="font-semibold rounded-full px-2.5 py-0.5">
              🟢 SẴN SÀNG
            </Tag>
          );
        }
        if (status === 'IN_USE') {
          return (
            <Tag color="cyan" className="font-semibold rounded-full px-2.5 py-0.5">
              🔵 ĐANG CHƠI
            </Tag>
          );
        }
        return (
          <Tag color="error" className="font-semibold rounded-full px-2.5 py-0.5 opacity-80">
            🔴 BẢO TRÌ
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1">
          {/* Nút Toggle Bảo trì */}
          <Tooltip title={record.status === 'MAINTENANCE' ? 'Đưa về sẵn sàng' : 'Chuyển sang bảo trì'}>
            <Button
              type="text"
              size="small"
              icon={
                record.status === 'MAINTENANCE' ? (
                  <CheckCircle2 className="w-4 h-4 text-success hover:opacity-80" />
                ) : (
                  <Wrench className="w-4 h-4 text-warning hover:opacity-80" />
                )
              }
              onClick={() => handleToggleMaintenance(record)}
            />
          </Tooltip>

          {/* Nút Sửa */}
          <Tooltip title="Chỉnh sửa thông số máy">
            <Button
              type="text"
              size="small"
              icon={<Edit3 className="w-4 h-4 text-gold hover:text-gold-light" />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>

          {/* Nút Xóa */}
          <Tooltip title="Xóa máy trạm">
            <Button
              type="text"
              size="small"
              danger
              disabled={record.status === 'IN_USE'}
              icon={<Trash2 className="w-4 h-4 text-danger hover:opacity-80 disabled:opacity-30" />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
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
              <Monitor className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-sand tracking-tight">
              Quản lý Máy Trạm (Computers)
            </h1>
          </div>
          <p className="text-mist text-sm mt-1">
            Theo dõi danh mục máy tính, phân bổ khu vực, điều chỉnh đơn giá giờ và bật tắt chế độ bảo trì phòng máy.
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
            Thêm máy mới
          </Button>
        </div>
      </div>

      {/* 2. Dải chỉ số Liquid Glass 3D (Telemetry Stats Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số máy trạm */}
        <div className="liquid-glass-sunset flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Tổng số máy trạm
            </span>
            <Monitor className="w-5 h-5 text-orange-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-sand">{totalComputers}</span>
            <span className="text-xs text-mist ml-1.5">máy</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Quy mô phòng net
          </div>
        </div>

        {/* Card 2: Máy sẵn sàng */}
        <div className="liquid-glass-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Sẵn sàng đón khách
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-emerald-300">{availableCount}</span>
            <span className="text-xs text-mist ml-1.5">máy online</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Có thể mở máy ngay
          </div>
        </div>

        {/* Card 3: Đang chơi */}
        <div className="liquid-glass-cyan flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Đang có phiên chơi
            </span>
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-cyan-300">{inUseCount}</span>
            <span className="text-xs text-mist ml-1.5">máy đang chạy</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            {totalComputers > 0 ? `${Math.round((inUseCount / totalComputers) * 100)}% công suất` : '0%'}
          </div>
        </div>

        {/* Card 4: Đang bảo trì */}
        <div className="liquid-glass-amber flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sand/80 tracking-wide uppercase">
              Đang bảo trì
            </span>
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-bold text-amber-300">{maintenanceCount}</span>
            <span className="text-xs text-mist ml-1.5">máy tạm khóa</span>
          </div>
          <div className="backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-xs text-sand/80 w-fit">
            Cần bảo dưỡng kỹ thuật
          </div>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm & Bộ lọc linh hoạt */}
      <div className="twinkle-card-flow rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Tìm theo mã máy hoặc địa chỉ IP..."
            prefix={<Search className="w-4 h-4 text-mist" />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            className="rounded-full"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Lọc theo Khu vực */}
          <Select
            value={selectedZone}
            onChange={(val) => setSelectedZone(val)}
            style={{ width: 170 }}
            options={[
              { value: 'ALL', label: 'Tất cả khu vực' },
              ...zones.map((z) => ({
                value: z.code,
                label: (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: z.colorCode }} />
                    {z.name}
                  </span>
                ),
              })),
            ]}
          />

          {/* Lọc theo Trạng thái */}
          <Select
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
            style={{ width: 160 }}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'AVAILABLE', label: '🟢 Sẵn sàng' },
              { value: 'IN_USE', label: '🔵 Đang chơi' },
              { value: 'MAINTENANCE', label: '🔴 Bảo trì' },
            ]}
          />
        </div>
      </div>

      {/* 4. Bảng danh sách Máy Trạm (DataTable) */}
      <div className="twinkle-major-flow rounded-3xl p-5 sm:p-6 border border-gold/25 shadow-2xl">
        <Table<ComputerResponse>
          rowKey="id"
          columns={columns}
          dataSource={filteredComputers}
          loading={isLoadingComputers}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ['15', '30', '50'],
            showTotal: (total) => `Tổng cộng ${total} máy trạm`,
          }}
          className="ant-table-twinkle"
        />
      </div>

      {/* 5. Modal Thêm / Chỉnh Sửa Máy Trạm */}
      <Modal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingComputer(null);
        }}
        onOk={handleFormSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        title={
          <div className="flex items-center gap-2 text-sand text-lg font-bold">
            <Sparkles className="w-5 h-5 text-gold" />
            <span>{editingComputer ? `Chỉnh sửa máy: ${editingComputer.code}` : 'Thêm máy trạm mới vào hệ thống'}</span>
          </div>
        }
        okText={editingComputer ? 'Lưu thay đổi' : 'Thêm máy'}
        cancelText="Đóng"
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4 space-y-3.5">
          {/* Mã máy */}
          <Form.Item
            name="code"
            label={<span className="text-sand font-medium">Mã máy trạm (Computer Code)</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mã máy!' },
              { max: 20, message: 'Mã máy tối đa 20 ký tự!' },
            ]}
            extra={<span className="text-xs text-mist">Ví dụ: PC-01, VIP-02, STREAM-01 (viết hoa tự động).</span>}
          >
            <Input
              placeholder="VD: PC-01"
              className="uppercase font-semibold tracking-wider"
              onChange={(e) => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
            />
          </Form.Item>

          {/* Địa chỉ IP */}
          <Form.Item
            name="ipAddress"
            label={<span className="text-sand font-medium">Địa chỉ IP mạng LAN</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ IP!' },
              {
                pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                message: 'Địa chỉ IP không đúng định dạng IPv4!',
              },
            ]}
          >
            <Input placeholder="VD: 192.168.1.101" className="font-mono text-xs" />
          </Form.Item>

          {/* Chọn Khu vực (Dynamic Zones) */}
          <Form.Item
            name="zone"
            label={<span className="text-sand font-medium">Khu vực phòng máy (Zone)</span>}
            rules={[{ required: true, message: 'Vui lòng chọn khu vực!' }]}
            extra={
              <span className="text-xs text-mist">
                Hệ thống tự động điền đơn giá giờ gợi ý khi bạn chọn khu vực.
              </span>
            }
          >
            <Select
              onChange={handleZoneChange}
              placeholder="Chọn khu vực..."
              options={zones.map((z) => ({
                value: z.code,
                label: (
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.colorCode }} />
                    <span className="font-medium">{z.name}</span>
                    <span className="text-xs text-mist ml-auto">({Number(z.defaultPricePerHour).toLocaleString('vi-VN')}₫/h)</span>
                  </span>
                ),
              }))}
            />
          </Form.Item>

          {/* Đơn giá giờ chơi */}
          <Form.Item
            name="pricePerHour"
            label={<span className="text-sand font-medium">Đơn giá giờ chơi (VNĐ/giờ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập đơn giá giờ!' }]}
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

          {/* Trạng thái máy */}
          <Form.Item
            name="status"
            label={<span className="text-sand font-medium">Trạng thái ban đầu</span>}
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select
              options={[
                { value: 'AVAILABLE', label: '🟢 Sẵn sàng (AVAILABLE)' },
                { value: 'MAINTENANCE', label: '🔴 Bảo trì (MAINTENANCE)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
