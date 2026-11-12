import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import ts from 'typescript';
import React, * as react from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

async function load(path, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  const module = new SourceTextModule(outputText);
  await module.link((name) => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    const exports = mocks[name];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await module.evaluate();
  return module.namespace;
}
const customer = (id) => ({ id, phone: `0888800${String(id).padStart(3, '0')}`, name: `Customer ${id}`, role: 'CUSTOMER', remainingMinutes: 120 });

async function selectorFixture({ selected = customer(125), error = false } = {}) {
  let selectProps, request, requestedPages = 0;
  const query = { data: { pages: [{ content: Array.from({ length: 20 }, (_, i) => customer(i + 1)) }] },
    isError: error, hasNextPage: true, fetchNextPage: () => { requestedPages++; }, refetch() {} };
  const module = await load('../src/components/common/CustomerSelect.tsx', {
    react: { ...react, default: React }, 'react/jsx-runtime': jsx,
    antd: { Select: (props) => { selectProps = props; return React.createElement('div', null, props.options.map((o) => o.label).join('|')); },
      Alert: ({ title }) => React.createElement('aside', null, title), Button: (props) => React.createElement('button', null, props.children) },
    '@tanstack/react-query': { useInfiniteQuery: (args) => { request = args; return query; } },
    '@/api/accountApi': { accountApi: { getAccounts: (params, signal) => ({ params, signal }) } },
    '@/store/authStore': { useAuthStore: (fn) => fn({ user: { id: 8, role: 'STAFF' } }) },
    '@/hooks/useDebouncedValue': { useDebouncedValue: (value) => value },
    '@/hooks/useAccountDirectory': { useCustomerAccount: () => ({ data: selected, isError: false }) },
  });
  const html = renderToStaticMarkup(React.createElement(module.CustomerSelect, { value: 125, onChange() {} }));
  return { html, selectProps, request, requestedPages: () => requestedPages };
}

test('selected customer outside the result page remains visible with its ID and label', async () => {
  const { html, selectProps } = await selectorFixture();
  assert.ok(html.includes('Customer 125'));
  assert.equal(selectProps.value, 125);
  assert.equal(selectProps.options.length, 21);
  assert.equal(selectProps.showSearch.filterOption, false);
});

test('customer search uses scoped server pagination, abort signals and a load-more action', async () => {
  const { request, selectProps, requestedPages } = await selectorFixture();
  assert.deepEqual(request.queryKey.slice(0, 3), ['staff-customer-accounts', 8, 'STAFF']);
  const signal = new AbortController().signal;
  const result = request.queryFn({ pageParam: 5, signal });
  assert.deepEqual(result.params, { role: 'CUSTOMER', keyword: '', page: 5, size: 20, sort: 'id,desc' });
  assert.equal(result.signal, signal);
  assert.equal(request.getNextPageParam({ hasNext: true, pageNumber: 5 }), 6);
  assert.equal(request.getNextPageParam({ hasNext: false, pageNumber: 5 }), undefined);
  const popup = selectProps.popupRender(React.createElement('div'));
  popup.props.children[1].props.onClick();
  assert.equal(requestedPages(), 1);
});

test('query failure exposes a retry state instead of a silent empty dropdown', async () => {
  const { html, selectProps } = await selectorFixture({ error: true, selected: undefined });
  assert.ok(html.includes('Không thể tải thông tin hội viên'));
  assert.equal(selectProps.status, 'error');
});

test('selected account is fetched by ID independently of search and rejects non-customers', async () => {
  let captured;
  let response = customer(125);
  const hooks = await load('../src/hooks/useAccountDirectory.ts', {
    react: { ...react, default: React },
    '@tanstack/react-query': { useQuery: (args) => { captured = args; return { data: undefined, isError: false }; } },
    '@/api/accountApi': { accountApi: { getAccountById: async () => response } },
    '@/store/authStore': { useAuthStore: (fn) => fn({ user: { id: 8, role: 'STAFF' } }) },
    './useDebouncedValue': { useDebouncedValue: (v) => v },
  });
  hooks.useCustomerAccount(125);
  assert.deepEqual(captured.queryKey, ['customer-account', 125, 8, 'STAFF']);
  assert.equal((await captured.queryFn({ signal: undefined })).id, 125);
  response = { ...response, role: 'STAFF' };
  await assert.rejects(captured.queryFn({}), /CUSTOMER/);
  hooks.useCustomerAccount(125, false);
  assert.equal(captured.enabled, false);
});

test('account mutations invalidate directory, picker, selected detail and summary caches', async () => {
  const { invalidateAccountQueries } = await load('../src/utils/accountQueries.ts', {});
  const keys = [];
  await invalidateAccountQueries({ invalidateQueries: ({ queryKey }) => { keys.push(queryKey[0]); return Promise.resolve(); } });
  for (const key of ['admin-accounts-list', 'staff-accounts-list', 'staff-customer-accounts', 'customer-account', 'account-summary']) {
    assert.ok(keys.includes(key));
  }
});


test('opening from member directory displays machines fetched without availableComputers props', async () => {
  let selectProps;
  const free = { id: 2, code: 'PC-02', zone: 'STANDARD', pricePerHour: 10000, status: 'AVAILABLE' };
  const div = ({ children }) => React.createElement('div', null, children);
  const icon = () => null;
  const module = await load('../src/features/staff/components/StartSessionModal.tsx', {
    react: { ...react, default: React }, 'react/jsx-runtime': jsx,
    antd: { Modal: div, Select: (props) => { selectProps = props; return null; }, Button: div,
      App: { useApp: () => ({ message: {} }) }, Alert: div },
    '@tanstack/react-query': { useQuery: () => ({ data: [free], isFetching: false, isError: false }) },
    '@/api/computerApi': { computerApi: {} }, '@/api/sessionApi': { sessionApi: {} },
    '@/components/common/CustomerSelect': { CustomerSelect: () => null },
    '@/hooks/useAccountDirectory': { useCustomerAccount: () => ({}) },
    '@/components/ui/GlassCard': { GlassCard: div }, '@/components/common/ZoneBadge': { ZoneBadge: icon },
    './RegisterCustomerModal': { RegisterCustomerModal: icon },
    'lucide-react': Object.fromEntries(['PlayCircle', 'Monitor', 'User', 'Zap', 'Sparkles', 'ShieldAlert', 'UserPlus'].map((key) => [key, icon])),
  });
  renderToStaticMarkup(React.createElement(module.StartSessionModal, { open: true, computer: null, initialAccountId: 125, onClose() {}, onSuccess() {} }));
  assert.ok(selectProps, 'machine selector must render for API-loaded machines');
  assert.equal(selectProps.options[0].value, free.id);
  assert.ok(selectProps.options[0].label.includes('PC-02'));
});

test('available machine API follows all pages with the AVAILABLE filter', async () => {
  const calls = [];
  const { computerApi } = await load('../src/api/computerApi.ts', {
    './axiosClient': { axiosClient: { get: async (url, { params }) => {
      calls.push({ url, params });
      return { totalPages: 2, content: params.page === 0 ? [{ id: 1 }] : [{ id: 101 }] };
    } } },
  });
  assert.deepEqual((await computerApi.getAvailableComputers()).map((c) => c.id), [1, 101]);
  assert.deepEqual(calls.map((c) => c.params.page), [0, 1]);
  assert.ok(calls.every((c) => c.params.status === 'AVAILABLE' && c.url === '/api/computers'));
});
