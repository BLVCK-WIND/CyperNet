import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import ts from 'typescript';
import { AxiosHeaders } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

async function loadModule(path, context, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
  } });
  const module = new SourceTextModule(outputText, {
    context,
    initializeImportMeta(meta) { meta.env = {}; },
  });
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

async function authFixture(refresh) {
  const context = createContext({ window: new EventTarget(), CustomEvent });
  const queryClient = new QueryClient();
  const protectedKey = ['staff-orders'];
  queryClient.setQueryData(protectedKey, ['private order']);

  const values = new Map();
  const storage = { clearAuth: () => values.clear() };
  for (const field of ['User', 'AccessToken', 'RefreshToken', 'SessionId', 'ComputerCode']) {
    storage[`get${field}`] = () => values.get(field) ?? null;
    storage[`set${field}`] = (value) => values.set(field, value);
    storage[`remove${field}`] = () => values.delete(field);
  }

  let logouts = 0;
  const { useAuthStore } = await loadModule('../src/store/authStore.ts', context, {
    zustand: { create },
    '@/utils/storage': { storage },
    '@/api/authApi': { authApi: { logout: async () => { logouts++; } } },
  });
  useAuthStore.getState().setStaffAuth({
    accessToken: 'old-access', refreshToken: 'old-refresh', account: { id: 5, role: 'STAFF' },
  });

  const warnings = [];
  const { AuthExpiryFeedback } = await loadModule('../src/features/auth/AuthExpiryFeedback.tsx', context, {
    react: { useLayoutEffect: (effect) => effect() },
    antd: { App: { useApp: () => ({ message: { warning: (value) => warnings.push(value) } }) } },
    '@tanstack/react-query': { useQueryClient: () => queryClient },
  });
  AuthExpiryFeedback();

  let onFailure;
  let refreshCalls = 0;
  let retries = 0;
  const client = () => { retries++; };
  client.interceptors = {
    request: { use() {} },
    response: { use(_success, failure) { onFailure = failure; } },
  };
  await loadModule('../src/api/axiosClient.ts', context, {
    axios: { default: {
      create: () => client,
      isAxiosError: (error) => error.isAxiosError === true,
      post: (...args) => { refreshCalls++; return refresh(...args); },
    } },
    '@/utils/storage': { storage },
  });

  return {
    onFailure, values, warnings, useAuthStore,
    hasProtectedCache: () => queryClient.getQueryData(protectedKey) !== undefined,
    cacheProtectedOrders: () => queryClient.setQueryData(protectedKey, ['current order']),
    refreshCalls: () => refreshCalls,
    retries: () => retries,
    logouts: () => logouts,
  };
}

function unauthorized(errorCode, accessToken = 'old-access') {
  return { isAxiosError: true, config: { url: '/api/orders/search',
    headers: new AxiosHeaders({ authorization: `Bearer ${accessToken}` }) },
    response: { status: 401, data: { errorCode } } };
}

test('role-change rejection clears login and protected cache without refreshing or calling logout', async () => {
  const fixture = await authFixture(() => assert.fail('must not refresh a role-change response'));
  await assert.rejects(fixture.onFailure(unauthorized('AUTH_ROLE_CHANGED')),
    (error) => error.errorCode === 'AUTH_ROLE_CHANGED');

  assert.equal(fixture.useAuthStore.getState().isAuthenticated, false);
  assert.equal(fixture.values.size, 0);
  assert.equal(fixture.hasProtectedCache(), false);
  assert.equal(fixture.refreshCalls(), 0);
  assert.equal(fixture.logouts(), 0);
  assert.equal(fixture.warnings.length, 1);
  assert.match(fixture.warnings[0].content, /Quyền.*đã thay đổi.*đăng nhập lại/);
});

test('a delayed role-change response neither warns twice nor clears a fresh login', async () => {
  const fixture = await authFixture(() => assert.fail('must not refresh a role-change response'));
  const oldRoleChange = () => fixture.onFailure(unauthorized('AUTH_ROLE_CHANGED'));
  await assert.rejects(oldRoleChange());
  await assert.rejects(oldRoleChange());
  assert.equal(fixture.warnings.length, 1);

  fixture.useAuthStore.getState().setStaffAuth({
    accessToken: 'new-access', refreshToken: 'new-refresh', account: { id: 5, role: 'ADMIN' },
  });
  fixture.cacheProtectedOrders();
  await assert.rejects(oldRoleChange());

  assert.equal(fixture.useAuthStore.getState().isAuthenticated, true);
  assert.equal(fixture.values.get('AccessToken'), 'new-access');
  assert.equal(fixture.values.get('RefreshToken'), 'new-refresh');
  assert.equal(fixture.hasProtectedCache(), true);
  assert.equal(fixture.warnings.length, 1);
  assert.equal(fixture.refreshCalls(), 0);
});

test('role change rejects queued retries and discards an already-running token refresh', async () => {
  const pending = Promise.withResolvers();
  const fixture = await authFixture(() => pending.promise);
  const first = assert.rejects(fixture.onFailure(unauthorized('TOKEN_EXPIRED')));
  const queued = assert.rejects(fixture.onFailure(unauthorized('TOKEN_EXPIRED')),
    (error) => error.errorCode === 'AUTH_ROLE_CHANGED');
  await assert.rejects(fixture.onFailure(unauthorized('AUTH_ROLE_CHANGED')));
  pending.resolve({ data: { accessToken: 'rotated-access', refreshToken: 'rotated-refresh' } });
  await Promise.all([first, queued]);

  assert.equal(fixture.refreshCalls(), 1);
  assert.equal(fixture.retries(), 0);
  assert.equal(fixture.values.size, 0);
  assert.equal(fixture.useAuthStore.getState().isAuthenticated, false);
});

test('role change reported by the refresh endpoint also clears cache and shows reauthentication feedback', async () => {
  const fixture = await authFixture(() => Promise.reject(unauthorized('AUTH_ROLE_CHANGED')));
  await assert.rejects(fixture.onFailure(unauthorized('TOKEN_EXPIRED')));

  assert.equal(fixture.refreshCalls(), 1);
  assert.equal(fixture.retries(), 0);
  assert.equal(fixture.values.size, 0);
  assert.equal(fixture.hasProtectedCache(), false);
  assert.equal(fixture.warnings.length, 1);
});
