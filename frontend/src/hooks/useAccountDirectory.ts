import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountApi } from '@/api/accountApi';
import { useAuthStore } from '@/store/authStore';
import { useDebouncedValue } from './useDebouncedValue';
import type { Role } from '@/types/auth';

export function useAccountDirectory(prefix: string, keyword: string, role?: Role) {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const search = useDebouncedValue(keyword.trim());
  const query = useQuery({
    queryKey: [prefix, user?.id, user?.role, role, search, page, pageSize],
    queryFn: ({ signal }) => accountApi.getAccounts({ role, keyword: search, page: page - 1, size: pageSize, sort: 'id,desc' }, signal),
    enabled: Boolean(user && (user.role === 'STAFF' || user.role === 'ADMIN')),
    refetchInterval: 15000,
  });
  // Deleting the last record on the last page must not leave an unreachable empty page.
  useEffect(() => {
    if (query.data && page > Math.max(1, query.data.totalPages)) setPage(Math.max(1, query.data.totalPages));
  }, [query.data, page]);
  return { ...query, page, pageSize, resetPage: () => setPage(1),
    changePage: (next: number, size: number) => { setPage(size === pageSize ? next : 1); setPageSize(size); } };
}

export function useAccountSummary() {
  const user = useAuthStore((state) => state.user);
  return useQuery({ queryKey: ['account-summary', user?.id, user?.role],
    queryFn: () => accountApi.getSummary(),
    enabled: Boolean(user && (user.role === 'STAFF' || user.role === 'ADMIN')),
    refetchInterval: 15000 });
}

export function useCustomerAccount(id?: number | null, enabled = true) {
  const user = useAuthStore((state) => state.user);
  const query = useQuery({ queryKey: ['customer-account', id, user?.id, user?.role],
    queryFn: async ({ signal }) => {
      const account = await accountApi.getAccountById(id!, signal);
      if (account.role !== 'CUSTOMER') throw new Error('Tài khoản được chọn phải là hội viên CUSTOMER.');
      return account;
    },
    enabled: Boolean(id && enabled && user), refetchInterval: 15000,
  });
  return { ...query, data: query.isError ? undefined : query.data };
}
