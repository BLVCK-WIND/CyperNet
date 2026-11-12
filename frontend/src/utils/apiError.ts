function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}

function messageOf(value: Record<string, unknown> | undefined): string | undefined {
  return typeof value?.message === 'string' && value.message.trim() ? value.message.trim() : undefined;
}

/** Accept both the interceptor's ErrorResponse and a raw Axios rejection. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const detail = asRecord(error);
  if (!detail) return fallback;

  if (detail.errorCode === 'NETWORK_ERROR' || detail.status === 0
    || detail.code === 'ERR_NETWORK' || detail.code === 'ECONNABORTED' || detail.code === 'ETIMEDOUT') {
    return 'Không thể kết nối đến máy chủ hoặc yêu cầu đã hết thời gian chờ. Vui lòng kiểm tra kết nối và tải lại đơn hàng trước khi thử lại.';
  }

  if (typeof detail.errorCode === 'string') {
    const message = messageOf(detail);
    if (message) return message;
  }
  const response = asRecord(detail.response);
  return messageOf(asRecord(response?.data)) ?? (response ? fallback : messageOf(detail) ?? fallback);
}
