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
const order = (id) => ({ id, status: 'PENDING_PAYMENT', paymentMethod: 'CASH', computerCode: 'PC-02',
  customerName: 'Nguyễn', customerPhone: '0888800001', totalAmount: 25000,
  items: [{ itemType: id % 2 ? 'FOOD' : 'PLAYTIME', subtotal: 25000 }] });
const { getApiErrorMessage } = await load('../src/utils/apiError.ts', {});

test('error reader preserves structured business messages and reads raw Axios response data', () => {
  const business = { status: 400, errorCode: 'ORDER_NOT_PENDING', message: 'Đơn đã được người khác xử lý.' };
  assert.equal(getApiErrorMessage(business, 'fallback'), business.message);
  assert.equal(getApiErrorMessage({ ...business, response: { data: { message: 'wrong priority' } } }, 'fallback'), business.message);
  const raw = { message: 'Request failed with status code 400', response: { data: { message: business.message } } };
  assert.equal(getApiErrorMessage(raw, 'fallback'), business.message);
  assert.equal(getApiErrorMessage(new Error('Lỗi thao tác'), 'fallback'), 'Lỗi thao tác');
});

test('network and timeout errors produce Vietnamese recovery guidance', () => {
  for (const error of [{ status: 0, errorCode: 'NETWORK_ERROR', message: 'Network Error' },
    { code: 'ERR_NETWORK', message: 'Network Error' }, { code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' },
    { code: 'ETIMEDOUT' }]) {
    const message = getApiErrorMessage(error, 'fallback');
    assert.ok(message.includes('Không thể kết nối'));
    assert.ok(message.includes('tải lại đơn hàng trước khi thử lại'));
    assert.ok(!message.includes('15000ms'));
  }
});

test('malformed errors use the action fallback without coercing unknown values into text', () => {
  for (const error of [undefined, null, 0, true, 'server text', [], {}, { message: 123 }, { message: '  ' },
    { response: null }, { response: { data: '<html>Bad gateway</html>' } },
    { message: 'Request failed with status code 502', response: { data: '<html>Bad gateway</html>' } },
    { response: { data: { message: [] } } }]) {
    assert.equal(getApiErrorMessage(error, 'Không thể xử lý đơn!'), 'Không thể xử lý đơn!');
  }
});

// Exercise the actual hook's state transitions and API request configuration without a browser.
async function hookFixture() {
  const slots = [], dependencies = [];
  let cursor = 0, effects = [], requests = [];
  let response = { content: [order(119)], totalElements: 120, totalPages: 6 };
  let today = '2026-11-10';
  const summaryResponse = { isError: false, isPending: false, refetch() {}, data: {
    date: today, pendingCount: 125, pendingAmount: 5375000, backlogCount: 25,
    todayCreatedCount: 103, todayConfirmedCount: 128, todayFoodAndDrinkRevenue: 3155300,
    countsByStatus: { PENDING_PAYMENT: 63, WAITING_CONFIRMATION: 62, CONFIRMED: 130, CANCELLED: 3 },
  } };
  const fakeReact = {
    useState(initial) {
      const key = cursor++;
      if (!(key in slots)) slots[key] = initial;
      return [slots[key], (value) => { slots[key] = typeof value === 'function' ? value(slots[key]) : value; }];
    },
    useEffect(fn, deps) {
      const key = cursor++;
      if (!dependencies[key] || deps.some((dep, i) => !Object.is(dep, dependencies[key][i]))) effects.push(fn);
      dependencies[key] = deps;
    },
    useMemo: (fn) => fn(),
  };
  const { useOrderQueue: runOrderQueue } = await load('../src/features/staff/hooks/useOrderQueue.ts', {
    react: fakeReact,
    '@tanstack/react-query': { useQuery: (options) => {
      requests.push(options);
      return options.queryKey[0] === 'staff-order-queue' ? { data: response,
        isLoading: false, isFetching: false, isError: false } : summaryResponse;
    } },
    '@/api/orderApi': { orderApi: { searchOrders: (params, signal) => ({ params, signal }), getSummary: (signal) => ({ signal }) } },
    '@/store/authStore': { useAuthStore: (fn) => fn({ user: { id: 8, role: 'STAFF' } }) },
    '@/hooks/useDebouncedValue': { useDebouncedValue: (v) => v },
    '@/hooks/useVietnamDate': { useVietnamDate: () => today },
  });
  return { summaryResponse, setToday(value) { today = value; }, get response() { return response; }, setResponse(update) { response = { ...response, ...update }; }, requests: () => requests,
    render(options = { statusTab: 'PENDING_PAYMENT' }) {
      cursor = 0; effects = []; requests = [];
      const result = runOrderQueue(options);
      effects.forEach((fn) => fn());
      return result;
    } };
}

test('server receives all filters and AbortSignal; results are not filtered a second time in the browser', async () => {
  const f = await hookFixture();
  const result = f.render({ statusTab: 'CONFIRMED', paymentMethodFilter: 'QR', searchKeyword: '  ORD-119  ' });
  const request = f.requests()[0];
  const signal = new AbortController().signal;
  assert.deepEqual(request.queryFn({ signal }), { signal, params: {
    status: 'CONFIRMED', paymentMethod: 'QR', keyword: 'ORD-119', page: 0, size: 20, sort: 'createdAt,desc',
  } });
  assert.deepEqual(request.queryKey, ['staff-order-queue', 8, 'STAFF', 'CONFIRMED', 'QR', 'ORD-119', 1, 20]);
  assert.equal(result.orders, f.response.content);
  assert.equal(result.totalElements, 120);
  assert.equal(request.placeholderData, undefined, 'old-query actions must not appear under new filters');
});

test('shared pagination uses zero-based API pages, resets for filters/size, and preserves FIFO', async () => {
  const f = await hookFixture();
  let result = f.render();
  result.changePage(3, 20);
  result = f.render();
  let request = f.requests()[0].queryFn({});
  assert.equal(result.page, 3);
  assert.equal(request.params.page, 2);
  assert.equal(request.params.sort, 'createdAt,asc');
  result.changePage(4, 50);
  result = f.render();
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 50);
  result.changePage(2, 50);
  result = f.render();
  result.resetPage();
  result = f.render({ statusTab: 'ALL', paymentMethodFilter: 'ALL' });
  request = f.requests()[0].queryFn({});
  assert.equal(result.page, 1);
  assert.equal(request.params.status, undefined);
  assert.equal(request.params.paymentMethod, undefined);
});

test('after the last row disappears the hook navigates to the last valid page', async () => {
  const f = await hookFixture();
  f.render().changePage(6, 20);
  assert.equal(f.render().page, 6);
  f.setResponse({ content: [], totalElements: 100, totalPages: 5 });
  f.render();
  assert.equal(f.render().page, 5);
  f.setResponse({ totalElements: 0, totalPages: 0 });
  f.render();
  assert.equal(f.render().page, 1);
});

test('API adapter uses the existing search endpoint and forwards cancellation and exact filter values', async () => {
  let call;
  const { orderApi } = await load('../src/api/orderApi.ts', {
    './axiosClient': { axiosClient: { get: (url, config) => { call = { url, config }; return {}; } } },
  });
  const params = { status: 'PENDING_PAYMENT', keyword: '#119', paymentMethod: 'QR', page: 2, size: 20 };
  const signal = new AbortController().signal;
  orderApi.searchOrders(params, signal);
  assert.deepEqual(call, { url: '/api/orders/search', config: { params, signal } });
  orderApi.getSummary(signal);
  assert.deepEqual(call, { url: '/api/orders/summary', config: { signal } });
});

test('one scoped summary query serves all global and daily totals independently of list filters', async () => {
  const f = await hookFixture();
  const result = f.render({ statusTab: 'CANCELLED', paymentMethodFilter: 'QR', searchKeyword: 'absent' });
  assert.equal(f.requests().length, 2);
  const summary = f.requests()[1];
  assert.deepEqual(summary.queryKey, ['staff-order-summary', 8, 'STAFF', '2026-11-10']);
  const signal = new AbortController().signal;
  assert.deepEqual(summary.queryFn({ signal }), { signal });
  assert.equal(result.pendingCount, 125);
  assert.equal(result.allCount, 258);
  assert.equal(result.confirmedCount, 130);
  assert.equal(result.summary.todayConfirmedCount, 128);
  assert.equal(result.confirmedRevenue, 3155300);
});

test('summary failure and previous-day data are unavailable while real zeros remain visible', async () => {
  const f = await hookFixture();
  f.summaryResponse.data.pendingCount = 0;
  assert.equal(f.render().pendingCount, 0);
  f.summaryResponse.isError = true;
  assert.equal(f.render().pendingCount, undefined);
  f.summaryResponse.isError = false;
  f.setToday('2026-11-11');
  assert.equal(f.render().summary, undefined);
  assert.equal(f.requests()[1].queryKey.at(-1), '2026-11-11');
});

async function pageFixture() {
  let refCursor = 0, stateCursor = 0, effects = [], resetCount = 0, captures = {}, cards = new Map();
  const refs = [], states = [], notifications = [], invalidations = [], canceled = [], confirmed = [], errors = [], successes = [];
  const api = { cancelOrder: async (id) => { canceled.push(id); return {}; },
    confirmOrder: async (id) => { confirmed.push(id); return { ...order(id), status: 'CONFIRMED' }; } };
  const queue = { orders: Array.from({ length: 20 }, (_, i) => order(i + 1)), page: 1, pageSize: 20,
    totalElements: 120, pageScope: 'page1', isLoading: false, isError: false,
    pendingCount: 60, confirmedCount: 30, cancelledCount: 30, allCount: 120, confirmedRevenue: 0, pendingAmount: 0,
    summary: { date: '2026-11-10', backlogCount: 10, todayCreatedCount: 110, todayConfirmedCount: 30 },
    summaryQuery: { isError: false, isPending: false, refetch() {} },
    refetch() {}, changePage() {}, resetPage: () => { resetCount++; } };
  const div = ({ children }) => React.createElement('div', null, children);
  const empty = () => null;
  const notification = { open: (value) => notifications.push(value) };
  const capture = (name) => (props) => { captures[name] = props; return null; };
  const { StaffOrderQueuePage } = await load('../src/features/staff/pages/StaffOrderQueuePage.tsx', {
    react: { ...react, default: React, useEffect: (fn) => effects.push(fn),
      useState: (initial) => { const key = stateCursor++;
        if (!(key in states)) states[key] = initial;
        return [states[key], (value) => { states[key] = typeof value === 'function' ? value(states[key]) : value; }]; },
      useRef: (initial) => { const key = refCursor++; return refs[key] ??= { current: initial }; } },
    'react/jsx-runtime': jsx,
    antd: { Input: capture('input'), Select: capture('payment'), Segmented: capture('tabs'), Pagination: capture('pagination'),
      Button: div, Skeleton: div, Badge: div, Alert: ({ title, action }) => React.createElement('aside', null, title, action), App: { useApp: () => ({ message: {
        success: (message) => successes.push(message), error: (message) => errors.push(message) }, notification }) } },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: ({ queryKey }) => { invalidations.push(queryKey[0]); return Promise.resolve(); } }) },
    '../hooks/useOrderQueue': { useOrderQueue: () => queue },
    '@/api/orderApi': { orderApi: api },
    '@/utils/apiError': { getApiErrorMessage },
    '@/hooks/useDocumentTitle': { useDocumentTitle() {} },
    '@/components/ui/GlassCard': { GlassCard: div },
    '../components/StaffOrderCard': { StaffOrderCard: (props) => {
      cards.set(props.order.id, props); return React.createElement('article', null, `order-${props.order.id}`); } },
    '../components/StaffOrderDetailDrawer': { StaffOrderDetailDrawer: empty },
    '../components/ConfirmOrderModal': { ConfirmOrderModal: capture('action') },
    'lucide-react': Object.fromEntries(['ReceiptText', 'Search', 'RefreshCw', 'Clock', 'CheckCircle2', 'XCircle', 'Filter',
      'ShoppingBag', 'Coins', 'Utensils', 'Zap'].map((name) => [name, empty])),
  });
  return { queue, notifications, invalidations, canceled, confirmed, errors, successes, api,
    cards: () => cards, resets: () => resetCount, captures: () => captures,
    render() { refCursor = 0; stateCursor = 0; effects = []; captures = {}; cards = new Map();
      const html = renderToStaticMarkup(React.createElement(StaffOrderQueuePage));
      effects.forEach((fn) => fn()); return html;
    } };
}

test('both lanes share one pagination control and label their counts as page-local', async () => {
  const f = await pageFixture();
  const html = f.render();
  assert.equal(f.captures().pagination.current, 1);
  assert.equal(f.captures().pagination.total, 120);
  assert.deepEqual(f.captures().pagination.pageSizeOptions, [20, 50]);
  assert.equal((html.match(/đơn trên trang này/g) || []).length, 2);
  assert.equal((html.match(/<article>/g) || []).length, 20);
  const controls = f.captures();
  controls.input.onChange({ target: { value: 'nguyen' } });
  controls.payment.onChange('QR');
  controls.tabs.onChange('ALL');
  assert.equal(f.resets(), 3);
});

test('switching page/filter or initial empty results creates a baseline without false new-order notices', async () => {
  const f = await pageFixture();
  f.render();
  f.queue.orders = [order(51)]; f.queue.pageScope = 'page2'; f.queue.page = 2;
  f.render();
  f.queue.orders = [order(119)]; f.queue.pageScope = 'filter-new';
  f.render();
  assert.equal(f.notifications.length, 0);
  f.queue.orders = []; f.queue.pageScope = 'empty-filter'; f.render();
  f.queue.orders = [order(120)]; f.render();
  assert.equal(f.notifications.length, 1, 'polling a new arrival on the same scope still notifies');
  f.render();
  assert.equal(f.notifications.length, 1);
});

test('canceling an order refreshes the aggregate summary and the paginated list', async () => {
  const f = await pageFixture();
  f.render();
  await f.captures().action.onCancelOrder(119);
  assert.deepEqual(f.canceled, [119]);
  for (const key of ['staff-order-queue', 'staff-order-summary', 'staff-orders', 'staff-topbar-pending-orders']) assert.ok(f.invalidations.includes(key));
  f.queue.orders = [order(51)];
  f.render();
  assert.equal(f.notifications.length, 0, 'an old row filling the vacated slot is not a new order');
});

for (const action of ['confirm', 'cancel']) {
  test(`${action} failure keeps the modal open, stops loading, preserves the error, and sends only once`, async () => {
    const f = await pageFixture();
    let rejectRequest;
    const requests = [];
    f.api[action === 'confirm' ? 'confirmOrder' : 'cancelOrder'] = (id) => {
      requests.push(id); return new Promise((resolve, reject) => { rejectRequest = reject; });
    };
    f.render();
    const card = f.cards().get(1);
    card[action === 'confirm' ? 'onConfirmOrder' : 'onCancelOrder'](order(1));
    f.render();
    assert.equal(f.captures().action.isOpen, true);
    const request = f.captures().action[action === 'confirm' ? 'onConfirm' : 'onCancelOrder'](1);
    f.render();
    assert.equal(f.captures().action.isProcessing, true);
    const error = action === 'confirm'
      ? { status: 400, errorCode: 'ORDER_NOT_PENDING', message: 'Đơn không còn ở trạng thái chờ duyệt!' }
      : { status: 0, errorCode: 'NETWORK_ERROR', message: 'timeout of 15000ms exceeded' };
    rejectRequest(error);
    await request;
    f.render();
    assert.equal(f.captures().action.isOpen, true);
    assert.equal(f.captures().action.isProcessing, false);
    assert.deepEqual(f.errors, [getApiErrorMessage(error, 'fallback')]);
    assert.equal(f.successes.length, 0);
    assert.equal(f.invalidations.length, 0);
    f.render();
    assert.deepEqual(requests, [1]);
  });
}

for (const action of ['confirm', 'cancel']) {
test(`${action} success closes the modal, stops loading and refreshes the queue`, async () => {
  const f = await pageFixture();
  f.render();
  f.cards().get(1)[action === 'confirm' ? 'onConfirmOrder' : 'onCancelOrder'](order(1));
  f.render();
  assert.equal(f.captures().action.isOpen, true);
  await f.captures().action[action === 'confirm' ? 'onConfirm' : 'onCancelOrder'](1);
  f.render();
  assert.equal(f.captures().action.isOpen, false);
  assert.equal(f.captures().action.isProcessing, false);
  assert.deepEqual(action === 'confirm' ? f.confirmed : f.canceled, [1]);
  assert.equal(f.successes.length, 1);
  assert.equal(f.errors.length, 0);
  assert.ok(f.invalidations.includes('staff-order-queue'));
});
}


test('a failed summary does not hide the order list or display synthetic zero totals', async () => {
  const f = await pageFixture();
  Object.assign(f.queue, { summary: undefined, pendingCount: undefined, confirmedCount: undefined,
    cancelledCount: undefined, allCount: undefined, confirmedRevenue: undefined, pendingAmount: undefined });
  f.queue.summaryQuery.isError = true;
  const html = f.render();
  assert.ok(html.includes('—'));
  assert.equal((html.match(/<article>/g) || []).length, 20);
  assert.ok(html.includes('Thử lại thống kê'));
});
