import { useState } from 'react';
import { Alert, Button, Select } from 'antd';
import { useInfiniteQuery } from '@tanstack/react-query';
import { accountApi } from '@/api/accountApi';
import { useAuthStore } from '@/store/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCustomerAccount } from '@/hooks/useAccountDirectory';

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
  enabled?: boolean;
  pricePerHour?: number;
}

export function CustomerSelect({ value, onChange, enabled = true, pricePerHour = 10000 }: Props) {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const keyword = useDebouncedValue(search.trim());
  const selected = useCustomerAccount(value, enabled);
  const query = useInfiniteQuery({
    queryKey: ['staff-customer-accounts', user?.id, user?.role, keyword],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => accountApi.getAccounts({ role: 'CUSTOMER', keyword, page: pageParam, size: 20, sort: 'id,desc' }, signal),
    getNextPageParam: (last) => last.hasNext ? last.pageNumber + 1 : undefined,
    enabled: Boolean(enabled && user && (user.role === 'STAFF' || user.role === 'ADMIN')),
  });
  const accounts = new Map((query.data?.pages.flatMap((page) => page.content) || []).map((a) => [a.id, a]));
  // Keep the selected identity visible independently of search results or current page.
  if (selected.data) accounts.set(selected.data.id, selected.data);
  return <div className="space-y-2">
    <Select<number>
      aria-label="Chọn hội viên"
      className="w-full h-11"
      disabled={!enabled}
      value={value}
      allowClear
      onChange={(id) => onChange(id ?? null)}
      showSearch={{ filterOption: false, onSearch: setSearch, searchValue: search }}
      placeholder="Tìm SĐT, tên không dấu hoặc #ID..."
      loading={query.isFetching || selected.isFetching}
      status={query.isError || selected.isError ? 'error' : undefined}
      notFoundContent={query.isFetching ? 'Đang tìm...' : query.isError ? 'Không tải được hội viên' : 'Không tìm thấy hội viên'}
      options={[...accounts.values()].map((account) => ({ value: account.id, label: `${account.phone} • ${account.name}` }))}
      optionRender={(option) => {
        const account = accounts.get(Number(option.value));
        if (!account) return option.label;
        const minutes = Math.floor(account.remainingMinutes * 10000 / (pricePerHour > 0 ? pricePerHour : 10000));
        return <div className="flex items-center justify-between gap-3 text-xs py-1">
          <div className="min-w-0"><span className="font-mono text-sand font-bold">{account.phone}</span>
            <span className="ml-2 text-sand/90">{account.name}</span></div>
          <span className="shrink-0 text-gold font-mono bg-gold/15 rounded px-2 py-1">{minutes} phút</span>
        </div>;
      }}
      popupRender={(menu) => <>{menu}{query.hasNextPage && <Button type="text" block loading={query.isFetchingNextPage}
        onMouseDown={(event) => event.preventDefault()} onClick={() => void query.fetchNextPage()}>Tải thêm hội viên</Button>}</>}
    />
    {(query.isError || selected.isError) && <Alert type="error" title="Không thể tải thông tin hội viên"
      action={<Button size="small" onClick={() => { void query.refetch(); if (value) void selected.refetch(); }}>Thử lại</Button>} />}
  </div>;
}
