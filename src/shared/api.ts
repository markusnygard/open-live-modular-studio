import { BASE_URL } from './base'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const target = url.startsWith('http') ? url : `${BASE_URL}${url}`

  const res = await fetch(target, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text || res.statusText)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }

  return (await res.text()) as unknown as T
}
