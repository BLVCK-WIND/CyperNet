export function qrComputerCode(search: string): string | null {
  return new URLSearchParams(search).get('code')?.trim().toUpperCase() || null;
}

export function customerLoginPath(code: string | null): string {
  return code ? `/customer/login?code=${encodeURIComponent(code)}` : '/customer/login';
}

export function customerRouteRedirect(
  search: string,
  authenticated: boolean,
  currentCode: string | null,
): string | null {
  const hasQr = new URLSearchParams(search).has('code');
  const code = qrComputerCode(search);
  if (!authenticated || (hasQr && (!code || code !== currentCode))) {
    return customerLoginPath(code);
  }
  return null;
}
