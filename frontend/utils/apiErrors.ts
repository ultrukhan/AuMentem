/**
 * Parses FastAPI / API error responses into user-friendly Ukrainian messages.
 */
export async function parseApiError(
  response: Response,
  fallback = 'Сталася помилка. Спробуйте ще раз.'
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      const parts = data.detail
        .map((item: unknown) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const o = item as Record<string, unknown>;
            if (typeof o.msg === 'string') return o.msg;
            if (typeof o.message === 'string') return o.message;
          }
          return null;
        })
        .filter(Boolean);
      if (parts.length > 0) return parts.join('\n');
    }

    if (data.detail && typeof data.detail === 'object') {
      const msg = (data.detail as Record<string, unknown>).message;
      if (typeof msg === 'string') return msg;
    }

    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  } catch {
    // not JSON
  }

  if (response.status === 401) return 'Невірний логін або пароль.';
  if (response.status === 403) return 'Немає доступу до цієї дії.';
  if (response.status === 404) return 'Не знайдено.';
  if (response.status >= 500) return 'Помилка сервера. Спробуйте пізніше.';

  return fallback;
}
