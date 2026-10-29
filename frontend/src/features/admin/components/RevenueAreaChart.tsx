import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import type { DailyRevenueResponse } from '@/types/report';

interface RevenueAreaChartProps {
  data: DailyRevenueResponse[];
  height?: number;
}

export const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({
  data,
  height = 340,
}) => {
  // Format dữ liệu biểu đồ
  const chartData = data.map((d) => ({
    date: dayjs(d.date).format('DD/MM'),
    fullDate: dayjs(d.date).format('DD/MM/YYYY'),
    total: d.totalRevenue,
    order: d.orderRevenue,
    playtime: d.timePurchaseRevenue,
    orderCount: d.orderCount,
    timePurchaseCount: d.timePurchaseCount,
  }));

  const formatVnd = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return `${value}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3.5 rounded-2xl bg-midnight/95 border border-gold/40 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
          <div className="font-heading font-bold text-sand border-b border-mist/20 pb-1.5 flex items-center justify-between">
            <span>Ngày {p.fullDate}</span>
            <span className="font-mono text-[10px] text-mist">{p.orderCount + p.timePurchaseCount} giao dịch</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sand">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                <span>Tổng doanh thu:</span>
              </span>
              <strong className="font-mono text-gold font-bold">
                {Number(p.total).toLocaleString('vi-VN')} ₫
              </strong>
            </div>

            <div className="flex items-center justify-between text-mist">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Món F&B:</span>
              </span>
              <span className="font-mono text-cyan-300">
                {Number(p.order).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className="flex items-center justify-between text-mist">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Nạp giờ chơi:</span>
              </span>
              <span className="font-mono text-emerald-300">
                {Number(p.playtime).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#bd9875" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#bd9875" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorOrder" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorPlaytime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 154, 159, 0.12)" vertical={false} />

          <XAxis
            dataKey="date"
            stroke="#8b9a9f"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(139, 154, 159, 0.2)' }}
          />

          <YAxis
            stroke="#8b9a9f"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(139, 154, 159, 0.2)' }}
            tickFormatter={formatVnd}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={(val) => {
              if (val === 'total') return <span className="text-gold font-medium">Tổng thực thu</span>;
              if (val === 'order') return <span className="text-cyan-300 font-medium">Doanh thu F&B</span>;
              if (val === 'playtime') return <span className="text-emerald-300 font-medium">Doanh thu Giờ</span>;
              return val;
            }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#bd9875"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorTotal)"
            activeDot={{ r: 6, fill: '#bd9875', stroke: '#202332', strokeWidth: 2 }}
          />

          <Area
            type="monotone"
            dataKey="order"
            stroke="#06b6d4"
            strokeWidth={1.8}
            fillOpacity={1}
            fill="url(#colorOrder)"
          />

          <Area
            type="monotone"
            dataKey="playtime"
            stroke="#10b981"
            strokeWidth={1.8}
            fillOpacity={1}
            fill="url(#colorPlaytime)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
