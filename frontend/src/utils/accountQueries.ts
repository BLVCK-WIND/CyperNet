import type { QueryClient } from '@tanstack/react-query';

export function invalidateAccountQueries(client: QueryClient) {
  return Promise.all(['admin-accounts-list', 'staff-accounts-list', 'staff-customer-accounts',
    'customer-account', 'account-summary'].map((key) => client.invalidateQueries({ queryKey: [key] })));
}
