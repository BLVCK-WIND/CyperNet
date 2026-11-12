import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import ts from 'typescript';
import { create } from 'zustand';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { qrComputerCode, customerLoginPath, customerRouteRedirect } from '../src/utils/customerRoute.ts';

test('QR entry preserves the scanned table through authentication', () => {
  assert.equal(customerRouteRedirect('?code=PC-02', false, null), '/customer/login?code=PC-02');
  assert.equal(customerRouteRedirect('?code=VIP-01&source=camera', false, 'PC-01'), '/customer/login?code=VIP-01');
});

test('another table requires reauthentication even with an existing login', () => {
  assert.equal(customerRouteRedirect('?code=PC-02', true, 'PC-01'), '/customer/login?code=PC-02');
  assert.equal(customerRouteRedirect('?code=PC-02', true, null), '/customer/login?code=PC-02');
});

test('ordinary authenticated navigation retains its current table', () => {
  assert.equal(customerRouteRedirect('', true, 'PC-01'), null);
  assert.equal(customerRouteRedirect('?code=PC-01', true, 'PC-01'), null);
});

test('missing and blank QR codes never fall back to a saved table or PC-01', () => {
  for (const search of ['', '?code=', '?code=%20%20']) {
    assert.equal(qrComputerCode(search), null);
    assert.equal(customerRouteRedirect(search, false, 'PC-01'), '/customer/login');
  }
  assert.equal(customerRouteRedirect('?code=', true, 'PC-01'), '/customer/login');
});

test('codes are normalized and safely encoded into an internal login path', () => {
  assert.equal(qrComputerCode('?code=%20vip-01%20'), 'VIP-01');
  assert.equal(customerLoginPath('PC-02&code=PC-01'), '/customer/login?code=PC-02%26code%3DPC-01');
  assert.equal(customerLoginPath(null), '/customer/login');
});

async function routingComponent(file, state, search) {
  const mocks = {
    react: { default: React },
    'react/jsx-runtime': jsxRuntime,
    'react-router-dom': {
      useLocation: () => ({ search }),
      Navigate: ({ to }) => React.createElement('output', { 'data-target': to }),
      Outlet: () => React.createElement('main', null, 'protected'),
    },
    '@/store/authStore': { useAuthStore: () => state },
    '@/utils/customerRoute': { qrComputerCode, customerLoginPath, customerRouteRedirect },
  };
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
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

test('the actual route guard preserves QR and blocks protected content until table B is authenticated', async () => {
  for (const isAuthenticated of [false, true]) {
    const { ProtectedRoute } = await routingComponent('../src/features/auth/ProtectedRoute.tsx',
      { isAuthenticated, computerCode: 'PC-01' }, '?code=PC-02');
    const html = renderToStaticMarkup(React.createElement(ProtectedRoute, { redirectPath: '/customer/login' }));
    assert.ok(html.includes('data-target="/customer/login?code=PC-02"'));
    assert.ok(!html.includes('<main>'));
  }
  const { ProtectedRoute } = await routingComponent('../src/features/auth/ProtectedRoute.tsx',
    { isAuthenticated: false, computerCode: null }, '?code=PC-02');
  assert.ok(renderToStaticMarkup(React.createElement(ProtectedRoute, { redirectPath: '/staff/login' }))
    .includes('data-target="/staff/login"'));
});

test('the root redirect also preserves the QR on reload or direct entry', async () => {
  const { CustomerLoginRedirect } = await routingComponent('../src/features/auth/CustomerLoginRedirect.tsx', {}, '?code=VIP-01');
  assert.ok(renderToStaticMarkup(React.createElement(CustomerLoginRedirect))
    .includes('data-target="/customer/login?code=VIP-01"'));
});

// Evaluate the actual store with isolated storage and an API spy; no server is contacted.
async function authFixture() {
  const values = new Map();
  const storage = { clearAuth: () => values.clear() };
  for (const field of ['User', 'AccessToken', 'RefreshToken', 'SessionId', 'ComputerCode']) {
    storage[`get${field}`] = () => values.get(field) ?? null;
    storage[`set${field}`] = (value) => values.set(field, value);
    storage[`remove${field}`] = () => values.delete(field);
  }
  let apiCalls = 0;
  const mocks = {
    zustand: { create },
    '@/utils/storage': { storage },
    '@/api/authApi': { authApi: { logout: async () => { apiCalls++; } } },
  };
  const source = readFileSync(new URL('../src/store/authStore.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  const module = new SourceTextModule(outputText);
  await module.link((name) => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    const exports = mocks[name];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await module.evaluate();
  return { store: module.namespace.useAuthStore, values, apiCalls: () => apiCalls };
}

const account = (role = 'CUSTOMER') => ({ id: 5, phone: '0999000003', name: 'QR fixture', role, remainingMinutes: 120 });
const auth = (role = 'CUSTOMER') => ({ accessToken: 'fixture-access', refreshToken: 'fixture-refresh', account: account(role) });

test('reauthentication clears local table A without calling a server lifecycle API', async () => {
  const { store, values, apiCalls } = await authFixture();
  store.getState().setCustomerAuth({ ...auth(), session: { id: 21, computerCode: 'PC-01' } });
  store.getState().clearCustomerAuth();
  assert.equal(store.getState().isAuthenticated, false);
  for (const key of ['user', 'accessToken', 'refreshToken', 'sessionId', 'computerCode', 'role']) {
    assert.equal(store.getState()[key], null);
  }
  assert.equal(values.size, 0);
  assert.equal(apiCalls(), 0);
});

test('successful idle-table B login does not retain the gaming session of A', async () => {
  const { store, values } = await authFixture();
  store.getState().setCustomerAuth({ ...auth(), session: { id: 21, computerCode: 'PC-01' } });
  store.getState().clearCustomerAuth();
  store.getState().setCustomerAuth({ ...auth(), accessToken: 'table-b-access', session: null, computerCode: 'PC-02' });
  assert.equal(store.getState().computerCode, 'PC-02');
  assert.equal(store.getState().sessionId, null);
  assert.equal(values.get('ComputerCode'), 'PC-02');
  assert.equal(values.has('SessionId'), false);
  assert.equal(values.get('AccessToken'), 'table-b-access');
});

test('repeated resets are safe and do not clear a staff or admin login', async () => {
  for (const role of ['STAFF', 'ADMIN']) {
    const { store, values } = await authFixture();
    store.getState().setStaffAuth(auth(role));
    store.getState().clearCustomerAuth();
    store.getState().clearCustomerAuth();
    assert.equal(store.getState().role, role);
    assert.equal(store.getState().isAuthenticated, true);
    assert.equal(values.get('AccessToken'), 'fixture-access');
  }
});
