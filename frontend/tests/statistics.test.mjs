import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import ts from 'typescript';
import React, * as react from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

async function load(path, mocks = {}, globals = {}) {
  const context = createContext(globals);
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } });
  const module = new SourceTextModule(outputText, { context });
  await module.link((name) => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    const exports = mocks[name];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

test('Vietnam date and time cross midnight at UTC 17:00 independently of the browser timezone', async () => {
  const { vietnamDate, vietnamTime, vietnamTimestamp } = await load('../src/utils/vietnamTime.ts');
  assert.equal(vietnamDate(new Date('2026-11-10T16:59:59Z')), '2026-11-10');
  assert.equal(vietnamDate(new Date('2026-11-10T17:00:00Z')), '2026-11-11');
  assert.equal(vietnamTime(Date.parse('2026-11-10T17:00:00Z')), '00:00:00');
  assert.equal(vietnamTimestamp('2026-11-11T00:00:00.123456'), Date.parse('2026-11-10T17:00:00.123Z'));
});

test('day hook updates on midnight/focus and cleans up its timer and listener', async () => {
  let current = '2026-11-10', state, effect, tick, cleanup, cleared;
  const events = new Map();
  const { useVietnamDate: readDay } = await load('../src/hooks/useVietnamDate.ts', {
    react: { useState: (initial) => { state = initial(); return [state, (next) => { state = next; }]; },
      useEffect: (fn) => { effect = fn; } },
    '@/utils/vietnamTime': { vietnamDate: () => current },
  }, { setInterval: (fn) => { tick = fn; return 1; }, clearInterval: (id) => { cleared = id; },
    window: { addEventListener: (name, fn) => events.set(name, fn), removeEventListener: (name) => events.delete(name) } });
  assert.equal(readDay(), '2026-11-10'); cleanup = effect();
  current = '2026-11-11'; tick(); assert.equal(state, '2026-11-11');
  current = '2026-11-12'; events.get('focus')(); assert.equal(state, '2026-11-12');
  cleanup(); assert.equal(cleared, 1); assert.equal(events.size, 0);
});

async function adminHookFixture() {
  const requests = [], pageCalls = [], revenueCalls = [];
  let day = '2026-11-10', role = 'ADMIN';
  const computers = Array.from({ length: 125 }, (_, i) => ({ id: i + 1,
    status: i < 60 ? 'IN_USE' : i < 100 ? 'AVAILABLE' : 'MAINTENANCE' }));
  const { computerApi } = await load('../src/api/computerApi.ts', {
    './axiosClient': { axiosClient: { get: async (url, { params }) => {
      pageCalls.push(params.page); return { content: computers.slice(params.page * 100, (params.page + 1) * 100), totalPages: 2 };
    } } },
  });
  const groups = Object.fromEntries(['revenue', 'computers', 'sessions'].map((name) => [name, {
    isPending: false, isError: false, isFetching: false, dataUpdatedAt: 123, refetch: async () => name,
  }]));
  const { useAdminStats: readStats } = await load('../src/features/admin/hooks/useAdminStats.ts', {
    '@tanstack/react-query': { useQuery: (options) => { requests.push(options); return groups[options.queryKey[4]]; } },
    '@/api/reportApi': { reportApi: { getRevenueSummary: async (params) => { revenueCalls.push(params); throw new Error('offline'); } } },
    '@/api/computerApi': { computerApi },
    '@/api/sessionApi': { sessionApi: { getSessions: async (params) => {
      assert.equal(params.size, 1); assert.equal(params.status, 'ACTIVE'); return { totalElements: 135, content: [{ id: 1 }] };
    } } },
    '@/store/authStore': { useAuthStore: (fn) => fn({ user: { id: 9, role } }) },
    '@/hooks/useVietnamDate': { useVietnamDate: () => day },
  });
  return { groups, requests, pageCalls, revenueCalls, readStats,
    setDay(value) { day = value; }, setRole(value) { role = value; } };
}

test('Admin counts all 125 computers and uses the server total for more than 100 active sessions', async () => {
  const f = await adminHookFixture();
  f.readStats();
  const result = await f.requests.find((q) => q.queryKey[4] === 'computers').queryFn();
  assert.equal(result.total, 125); assert.equal(result.active, 60); assert.equal(result.available, 40);
  assert.equal(result.maintenance, 25); assert.equal(result.occupancyRate, 48);
  assert.deepEqual(f.pageCalls, [0, 1]);
  assert.equal(await f.requests.find((q) => q.queryKey[4] === 'sessions').queryFn(), 135);
});

test('Admin revenue failure propagates independently and day/user/role scopes control its query', async () => {
  const f = await adminHookFixture();
  const result = f.readStats();
  const revenue = f.requests[0];
  await assert.rejects(revenue.queryFn(), /offline/);
  assert.equal(f.revenueCalls[0].fromDate, '2026-11-10');
  assert.equal(result.computersQuery, f.groups.computers);
  assert.equal(result.sessionsQuery, f.groups.sessions);
  f.setDay('2026-11-11'); f.requests.length = 0; f.readStats();
  assert.equal(f.requests[0].queryKey.at(-1), '2026-11-11');
  assert.equal(f.requests[0].queryKey[2], 9);
  f.setRole('STAFF'); f.requests.length = 0; f.readStats();
  assert.ok(f.requests.every((q) => q.enabled === false));
});

async function cardsFixture() {
  const timestamp = Date.parse('2026-11-10T03:11:12Z');
  const retries = { revenue: 0, computers: 0, sessions: 0 };
  const group = (name, data) => ({ data, isPending: false, isError: false, isFetching: false,
    dataUpdatedAt: timestamp, refetch: () => { retries[name]++; } });
  const stats = { today: '2026-11-10',
    revenueQuery: group('revenue', { totalRevenue: 654321, cashRevenue: 111111, qrRevenue: 543210, totalOrders: 17, totalTimePurchases: 3 }),
    computersQuery: group('computers', { total: 125, active: 60, available: 40, maintenance: 25, occupancyRate: 48 }),
    sessionsQuery: group('sessions', 135), isFetching: false, refetch() {} };
  const buttons = [];
  const div = ({ children }) => React.createElement('div', null, children);
  const empty = () => null;
  const { vietnamTime } = await load('../src/utils/vietnamTime.ts');
  const { AdminStatsCards } = await load('../src/features/admin/components/AdminStatsCards.tsx', {
    react: { ...react, default: React }, 'react/jsx-runtime': jsx,
    antd: { Alert: ({ title, action }) => React.createElement('aside', null, title, action),
      Button: (props) => { buttons.push(props); return React.createElement('button', null, props.children); },
      Skeleton: { Input: () => React.createElement('em', null, 'loading') }, Tooltip: div },
    '../hooks/useAdminStats': { useAdminStats: () => stats }, '@/utils/vietnamTime': { vietnamTime },
    'lucide-react': Object.fromEntries(['Coins', 'Monitor', 'PlayCircle', 'ShoppingBag', 'RefreshCw', 'Activity'].map((key) => [key, empty])),
  });
  return { stats, retries, buttons, timestamp,
    render() { buttons.length = 0; return renderToStaticMarkup(React.createElement(AdminStatsCards)); } };
}

test('failed revenue hides stale money, keeps healthy operational groups, and retries only its own source', async () => {
  const f = await cardsFixture();
  assert.ok(f.render().includes('654.321'));
  f.stats.revenueQuery.isError = true;
  const html = f.render();
  assert.ok(!html.includes('654.321'));
  assert.ok(html.includes('125')); assert.ok(html.includes('135')); assert.ok(html.includes('—'));
  assert.ok(html.includes('Lần tải thành công: 10:11:12'));
  f.buttons.find((b) => b.children === 'Thử lại').onClick();
  assert.deepEqual(f.retries, { revenue: 1, computers: 0, sessions: 0 });
  assert.equal(f.stats.revenueQuery.dataUpdatedAt, f.timestamp);
});

test('each operational group can fail independently and only actual zeros render as zero', async () => {
  const f = await cardsFixture();
  f.stats.computersQuery.isError = true;
  let html = f.render();
  assert.ok(html.includes('654.321')); assert.ok(html.includes('135')); assert.ok(!html.includes('/ 125'));
  f.stats.computersQuery.isError = false;
  f.stats.sessionsQuery.isError = true;
  html = f.render();
  assert.ok(!html.includes('135')); assert.ok(html.includes('125')); assert.ok(html.includes('654.321'));
  f.stats.sessionsQuery.isError = false; f.stats.sessionsQuery.data = 0;
  html = f.render();
  assert.ok(html.includes('0 <span')); assert.ok(!html.includes('Không tải được dữ liệu'));
});

test('initial loading does not invent a success timestamp or zero revenue', async () => {
  const f = await cardsFixture();
  Object.assign(f.stats.revenueQuery, { isPending: true, data: undefined, dataUpdatedAt: 0 });
  const html = f.render();
  assert.ok(html.includes('loading'));
  assert.ok(html.includes('Chưa có lần tải thành công'));
  assert.ok(!html.includes('654.321'));
});
