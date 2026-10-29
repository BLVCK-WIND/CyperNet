import React, { useState, useMemo } from 'react';
import {
  DatePicker,
  Button,
  Table,
  Progress,
  Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Activity,
  Monitor,
  RefreshCw,
  Clock,
  Award,
  Zap,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { reportApi } from '@/api/reportApi';
import { PageTransition } from '@/components/animations/PageTransition';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import type { ComputerUsageResponse } from '@/types/report';

const { RangePicker } = DatePicker;

export const ComputerUsageReportPage: React.FC = () => {
  useDocumentTitle('Hiệu suất máy trạm • CyberNet');

  // Filter Date range state (mặc định 7 ngày gần nhất)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ]);

  const [quickPreset, setQuickPreset] = useState<string>('7D');

  const fromDateStr = dateRange[0].format('YYYY-MM-DD');
  const toDateStr = dateRange[1].format('YYYY-MM-DD');

  // Tính số ngày khảo sát (tối thiểu 1 ngày)
  const surveyDays = useMemo(() => {
    const diff = dateRange[1].diff(dateRange[0], 'day') + 1;
    return Math.max(1, diff);
  }, [dateRange]);

  // Fetch Báo cáo Hiệu suất Máy Trạm (MS-3.9)
  const {
    data: usageData = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['report-computer-usage', fromDateStr, toDateStr],
    queryFn: () => reportApi.getComputerUsage({ fromDate: fromDateStr, toDate: toDateStr }),
    refetchInterval: 15000,
  });

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

  // Tính toán KPI Tổng hợp
  const stats = useMemo(() => {
    const totalComputers = usageData.length;
    const totalSessions = usageData.reduce((sum, c) => sum + (c.totalSessions || 0), 0);
    const totalMinutes = usageData.reduce((sum, c) => sum + (c.totalMinutesUsed || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Tính tỷ lệ lấp đầy bình quân toàn dàn máy
    const maxPossibleMinutes = totalComputers * surveyDays * 24 * 60;
    const avgUtilization = maxPossibleMinutes > 0
      ? ((totalMinutes / maxPossibleMinutes) * 100).toFixed(1)
      : '0';

    // Máy có lượt phục vụ nhiều nhất
    const sorted = [...usageData].sort((a, b) => (b.totalMinutesUsed || 0) - (a.totalMinutesUsed || 0));
    const topComputer = sorted[0];

    return {
      totalComputers,
      totalSessions,
      totalHours,
      avgUtilization,
      topComputerCode: topComputer ? topComputer.computerCode : '—',
      topComputerHours: topComputer ? ((topComputer.totalMinutesUsed || 0) / 60).toFixed(1) : '0',
    };
  }, [usageData, surveyDays]);

  // Cột bảng Hiệu suất
  const columns: ColumnsType<ComputerUsageResponse> = [
    {
      title: 'Máy Trạm',
      key: 'computerCode',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-midnight/90 border border-white/10 flex items-center justify-center text-gold font-mono font-bold text-sm">
            <Monitor className="w-4 h-4 text-gold" />
          </div>
          <div>
            <div className="font-heading font-bold text-sand text-sm">
              {record.computerCode}
            </div>
            <div className="mt-0.5">
              <ZoneBadge zone={record.zone} size="sm" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số Lượt Phiên',
      dataIndex: 'totalSessions',
      key: 'totalSessions',
      width: 140,
      sorter: (a, b) => a.totalSessions - b.totalSessions,
      render: (val: number) => (
        <div className="font-mono text-sand text-sm font-semibold">
          {val} <span className="text-xs text-mist font-normal">lượt</span>
        </div>
      ),
    },
    {
      title: 'Thời Lượng Sử Dụng',
      dataIndex: 'totalMinutesUsed',
      key: 'totalMinutesUsed',
      width: 180,
      sorter: (a, b) => a.totalMinutesUsed - b.totalMinutesUsed,
      render: (mins: number) => {
        const hours = (mins / 60).toFixed(1);
        return (
          <div className="space-y-0.5">
            <div className="font-heading font-bold text-gold text-sm">
              {hours} <span className="text-xs text-sand/70">giờ</span>
            </div>
            <div className="text-[11px] font-mono text-mist">
              {mins} phút hoạt động
            </div>
          </div>
        );
      },
    },
    {
      title: 'Công Suất Lấp Đầy (%)',
      key: 'utilization',
      width: 240,
      sorter: (a, b) => a.totalMinutesUsed - b.totalMinutesUsed,
      render: (_, record) => {
        const maxMins = surveyDays * 24 * 60;
        const rate = Math.min(100, Math.round(((record.totalMinutesUsed || 0) / maxMins) * 100));
        return (
          <div className="space-y-1.5 max-w-[200px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-mist">Hiệu suất 24/7:</span>
              <span className={`font-bold ${rate > 50 ? 'text-emerald-400' : rate > 20 ? 'text-gold' : 'text-mist'}`}>
                {rate}%
              </span>
            </div>
            <Progress
              percent={rate}
              showInfo={false}
              strokeColor={{
                '0%': '#bd9875',
                '100%': '#10b981',
              }}
              trailColor="rgba(255,255,255,0.06)"
              size="small"
            />
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Header & Date Range Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold mb-1">
              <Activity className="w-4 h-4" />
              <span>Phân Hệ Báo Cáo Hiệu Suất</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-sand">
              Hiệu Suất Vận Hành Máy Trạm
            </h1>
            <p className="text-xs text-mist mt-0.5">
              Theo dõi số lượt mở phiên, tổng số giờ chơi và tỷ lệ lấp đầy công suất của từng máy trạm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
              onClick={() => refetch()}
              className="rounded-xl h-10 border-mist/30 text-sand hover:border-gold hover:text-gold bg-midnight/60"
            >
              Làm Mới
            </Button>
          </div>
        </div>

        {/* 2. Dải chỉ số Liquid Glass 3D (Telemetry Stats Strip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng lượt phục vụ */}
          <div className="liquid-glass-card liquid-glass-cyan cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Tổng Lượt Phục Vụ</span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.totalSessions}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Số máy trạm</span>
              <span className="font-bold text-cyan-300">{stats.totalComputers} máy</span>
            </div>
          </div>

          {/* Tổng giờ hoạt động */}
          <div className="liquid-glass-card liquid-glass-emerald cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Tổng Giờ Chơi</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.totalHours} <span className="text-sm font-normal text-sand/70">h</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Khung khảo sát</span>
              <span className="font-bold text-emerald-300">{surveyDays} ngày</span>
            </div>
          </div>

          {/* Công suất bình quân */}
          <div className="liquid-glass-card liquid-glass-amber cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Công Suất Bình Quân</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.avgUtilization}%
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Tỷ lệ lấp đầy</span>
              <span className="font-bold text-amber-300">24/7 toàn quán</span>
            </div>
          </div>

          {/* Máy đắt khách nhất */}
          <div className="liquid-glass-card liquid-glass-sunset cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Máy Hoạt Động Nhiều Nhất</span>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {stats.topComputerCode}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Thời lượng chạy</span>
              <span className="font-bold text-gold">{stats.topComputerHours} giờ</span>
            </div>
          </div>
        </div>

        {/* 3. Bảng Hiệu Suất Máy Trạm */}
        <div className="rounded-2xl border border-mist/20 overflow-hidden shadow-2xl bg-midnight/90">
          <Table
            columns={columns}
            dataSource={usageData}
            rowKey="computerId"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} máy trạm`,
              className: 'px-4 py-3',
            }}
            className="twinkle-table"
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default ComputerUsageReportPage;
