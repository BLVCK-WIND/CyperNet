import React, { useState } from 'react';
import {
  DatePicker,
  Button,
  Tabs,
  Table,
  Tag,
  Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  DollarSign,
  Utensils,
  Gamepad2,
  CreditCard,
  Award,
  Flame,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { reportApi } from '@/api/reportApi';
import { PageTransition } from '@/components/animations/PageTransition';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RevenueAreaChart } from '../components/RevenueAreaChart';
import type {
  DailyRevenueResponse,
  TopItemResponse,
  TopCustomerResponse,
} from '@/types/report';

const { RangePicker } = DatePicker;

export const RevenueReportsPage: React.FC = () => {
  useDocumentTitle('Báo cáo doanh thu & tài chính • CyberNet');

  // Filter Date range state (mặc định 7 ngày gần nhất)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ]);

  const [quickPreset, setQuickPreset] = useState<string>('7D');

  const fromDateStr = dateRange[0].format('YYYY-MM-DD');
  const toDateStr = dateRange[1].format('YYYY-MM-DD');

  // 1. Fetch Báo cáo Tổng Quan Doanh Thu
  const {
    data: summary,
    isFetching,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['report-revenue-summary', fromDateStr, toDateStr],
    queryFn: () => reportApi.getRevenueSummary({ fromDate: fromDateStr, toDate: toDateStr }),
  });

  // 2. Fetch Chuỗi Doanh Thu Theo Ngày (MS-3.7)
  const {
    data: dailyData = [],
    isLoading: isLoadingDaily,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['report-revenue-daily', fromDateStr, toDateStr],
    queryFn: () => reportApi.getDailyRevenue({ fromDate: fromDateStr, toDate: toDateStr }),
  });

  // 3. Fetch Top 10 Món Bán Chạy (MS-3.8)
  const {
    data: topItems = [],
    isLoading: isLoadingTopItems,
    refetch: refetchTopItems,
  } = useQuery({
    queryKey: ['report-top-items', fromDateStr, toDateStr],
    queryFn: () => reportApi.getTopSellingItems(10, { fromDate: fromDateStr, toDate: toDateStr }),
  });

  // 4. Fetch Top 10 Khách Hàng Chi Tiêu (MS-3.8)
  const {
    data: topCustomers = [],
    isLoading: isLoadingTopCustomers,
    refetch: refetchTopCustomers,
  } = useQuery({
    queryKey: ['report-top-customers', fromDateStr, toDateStr],
    queryFn: () => reportApi.getTopCustomers(10, { fromDate: fromDateStr, toDate: toDateStr }),
  });

  const handleRefetchAll = () => {
    refetchSummary();
    refetchDaily();
    refetchTopItems();
    refetchTopCustomers();
  };

  const handlePresetChange = (val: string) => {
    setQuickPreset(val);
    const today = dayjs();
    if (val === 'TODAY') {
      setDateRange([today, today]);
    } else if (val === '7D') {
      setDateRange([today.subtract(6, 'day'), today]);
    } else if (val === '30D') {
      setDateRange([today.subtract(29, 'day'), today]);
    } else if (val === 'THIS_MONTH') {
      setDateRange([today.startOf('month'), today]);
    }
  };

  // Cột bảng Doanh thu theo ngày
  const dailyColumns: ColumnsType<DailyRevenueResponse> = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date: string) => (
        <span className="font-heading font-semibold text-sand">
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Doanh Thu F&B',
      dataIndex: 'orderRevenue',
      key: 'orderRevenue',
      render: (val: number, record) => (
        <div>
          <div className="font-mono text-cyan-300 font-bold">
            {Number(val).toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-mist/70">{record.orderCount} đơn gọi</div>
        </div>
      ),
    },
    {
      title: 'Doanh Thu Nạp Giờ',
      dataIndex: 'timePurchaseRevenue',
      key: 'timePurchaseRevenue',
      render: (val: number, record) => (
        <div>
          <div className="font-mono text-emerald-300 font-bold">
            {Number(val).toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[11px] text-mist/70">{record.timePurchaseCount} lượt nạp</div>
        </div>
      ),
    },
    {
      title: 'Tổng Thực Thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (val: number) => (
        <div className="font-heading font-bold text-gold text-base">
          {Number(val).toLocaleString('vi-VN')} ₫
        </div>
      ),
    },
  ];

  // Cột bảng Top 10 Món bán chạy
  const topItemColumns: ColumnsType<TopItemResponse> = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 65,
      render: (_, __, idx) => {
        const rank = idx + 1;
        return (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-heading font-bold text-xs ${
              rank === 1
                ? 'bg-amber-500 text-midnight shadow-md shadow-amber-500/30'
                : rank === 2
                ? 'bg-slate-300 text-midnight'
                : rank === 3
                ? 'bg-amber-700 text-white'
                : 'text-mist bg-white/5'
            }`}
          >
            {rank}
          </div>
        );
      },
    },
    {
      title: 'Tên Mặt Hàng',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (name: string, record) => (
        <div>
          <div className="font-semibold text-sand text-sm">{name}</div>
          <Tag className="m-0 text-[10px] font-bold border-0 px-2 py-0.2 rounded-full mt-1 bg-white/10 text-mist">
            {record.itemType}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Số Lượng Bán',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 140,
      render: (qty: number) => (
        <span className="font-mono font-bold text-sand text-sm">
          {qty} <span className="text-xs text-mist font-normal">phần</span>
        </span>
      ),
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      width: 160,
      render: (rev: number) => (
        <span className="font-mono font-bold text-gold text-sm">
          {Number(rev).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
  ];

  // Cột bảng Top Khách hàng
  const topCustomerColumns: ColumnsType<TopCustomerResponse> = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 65,
      render: (_, __, idx) => (
        <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-heading font-bold text-xs">
          #{idx + 1}
        </div>
      ),
    },
    {
      title: 'Khách Hàng',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-heading font-bold text-sand text-sm">{record.name}</div>
          <div className="text-xs font-mono text-mist/80">{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Số Phút Đã Chơi',
      dataIndex: 'totalMinutesPlayed',
      key: 'totalMinutesPlayed',
      render: (mins: number) => (
        <span className="font-mono text-xs text-sand">
          {mins} phút <span className="text-mist">({(mins / 60).toFixed(1)}h)</span>
        </span>
      ),
    },
    {
      title: 'Tổng Chi Tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      align: 'right',
      render: (spent: number) => (
        <span className="font-heading font-bold text-emerald-400 text-sm">
          {Number(spent).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Header & Date Range Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Trung Tâm Dữ Liệu Tài Chính</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-sand">
              Báo Cáo & Phân Tích Doanh Thu
            </h1>
            <p className="text-xs text-mist mt-0.5">
              Thống kê toàn diện doanh thu dịch vụ F&B, nạp giờ chơi, top sản phẩm và khách hàng thân thiết
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Presets */}
            <Segmented
              value={quickPreset}
              onChange={(val) => handlePresetChange(val as string)}
              options={[
                { label: 'Hôm nay', value: 'TODAY' },
                { label: '7 ngày qua', value: '7D' },
                { label: '30 ngày qua', value: '30D' },
                { label: 'Tháng này', value: 'THIS_MONTH' },
              ]}
              className="bg-midnight/90 border border-mist/20 p-1 rounded-xl text-xs"
            />

            {/* Custom Range Picker */}
            <RangePicker
              value={dateRange}
              onChange={(val) => {
                if (val && val[0] && val[1]) {
                  setDateRange([val[0], val[1]]);
                  setQuickPreset('CUSTOM');
                }
              }}
              format="DD/MM/YYYY"
              allowClear={false}
              className="rounded-xl h-10 bg-midnight/80 border-mist/30 text-sand"
            />

            <Button
              icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
              onClick={handleRefetchAll}
              className="rounded-xl h-10 border-mist/30 text-sand hover:border-gold hover:text-gold bg-midnight/60"
            >
              Làm Mới
            </Button>
          </div>
        </div>

        {/* 2. Dải chỉ số Liquid Glass 3D (Telemetry Stats Strip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng Doanh Thu */}
          <div className="liquid-glass-card liquid-glass-sunset cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Tổng Doanh Thu</span>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {Number(summary?.totalRevenue || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-sand/70">₫</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Số giao dịch</span>
              <span className="font-bold text-gold">{(summary?.totalOrders || 0) + (summary?.totalTimePurchases || 0)} lượt</span>
            </div>
          </div>

          {/* Doanh thu Món F&B */}
          <div className="liquid-glass-card liquid-glass-cyan cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Doanh Thu Dịch Vụ F&B</span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {Number(summary?.totalOrderRevenue || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-sand/70">₫</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Đơn hàng món ăn</span>
              <span className="font-bold text-cyan-300">{summary?.totalOrders || 0} đơn</span>
            </div>
          </div>

          {/* Doanh thu Giờ chơi */}
          <div className="liquid-glass-card liquid-glass-emerald cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Doanh Thu Nạp Giờ</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Gamepad2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {Number(summary?.totalTimePurchaseRevenue || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-sand/70">₫</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Lượt nạp giờ POS</span>
              <span className="font-bold text-emerald-300">{summary?.totalTimePurchases || 0} lượt</span>
            </div>
          </div>

          {/* Cơ cấu Thanh toán */}
          <div className="liquid-glass-card liquid-glass-amber cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Cơ Cấu Tiền Thu</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sand/80 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Tiền mặt:
                </span>
                <span className="font-mono font-bold text-sand">
                  {Number(summary?.cashRevenue || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-sand/80 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Chuyển khoản QR:
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {Number(summary?.qrRevenue || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
            <div className="frosted-glass-pill mt-2.5 flex items-center justify-between text-xs">
              <span>Tỷ lệ VietQR</span>
              <span className="font-bold text-cyan-400">
                {summary?.totalRevenue
                  ? `${Math.round(((summary.qrRevenue || 0) / summary.totalRevenue) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Khối Biểu Đồ Diện Tích (Interactive AreaChart) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-mist/20 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mist/15 pb-4">
            <div>
              <h2 className="text-base font-heading font-bold text-sand flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                Xu Hướng Doanh Thu Theo Ngày
              </h2>
              <p className="text-xs text-mist mt-0.5">
                Biểu đồ đường diện tích phân rã doanh thu F&B và Nạp giờ chơi ({fromDateStr} đến {toDateStr})
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-mono text-sand/80 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
              <span>Khảo sát:</span>
              <strong className="text-gold font-bold">{dailyData.length} ngày</strong>
            </div>
          </div>

          <RevenueAreaChart data={dailyData} height={320} />
        </div>

        {/* 4. Tab Dữ Liệu Chi Tiết: Doanh Thu Hằng Ngày | Top Món | Top Khách */}
        <div className="p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-mist/20 shadow-2xl">
          <Tabs
            defaultActiveKey="daily"
            className="twinkle-tabs"
            items={[
              {
                key: 'daily',
                label: (
                  <span className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-4 h-4" />
                    Doanh Thu Từng Ngày
                  </span>
                ),
                children: (
                  <div className="mt-3">
                    <Table
                      columns={dailyColumns}
                      dataSource={dailyData}
                      rowKey="date"
                      loading={isLoadingDaily}
                      pagination={{ pageSize: 7, className: 'px-4 py-2' }}
                      className="twinkle-table"
                    />
                  </div>
                ),
              },
              {
                key: 'top-items',
                label: (
                  <span className="flex items-center gap-2 font-semibold">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Top 10 Món Bán Chạy
                  </span>
                ),
                children: (
                  <div className="mt-3">
                    <Table
                      columns={topItemColumns}
                      dataSource={topItems}
                      rowKey="itemId"
                      loading={isLoadingTopItems}
                      pagination={false}
                      className="twinkle-table"
                    />
                  </div>
                ),
              },
              {
                key: 'top-customers',
                label: (
                  <span className="flex items-center gap-2 font-semibold">
                    <Award className="w-4 h-4 text-gold" />
                    Top 10 Khách Thân Thiết
                  </span>
                ),
                children: (
                  <div className="mt-3">
                    <Table
                      columns={topCustomerColumns}
                      dataSource={topCustomers}
                      rowKey="accountId"
                      loading={isLoadingTopCustomers}
                      pagination={false}
                      className="twinkle-table"
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default RevenueReportsPage;
