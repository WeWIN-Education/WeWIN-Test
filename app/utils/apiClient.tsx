export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  formData?: FormData;
  token?: string;
}

export async function apiCall<T>(
  url: string,
  { method = "GET", headers = {}, body, formData, token }: ApiOptions = {}
): Promise<T> {
  const finalHeaders: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, ...headers }
    : headers;

  if (!formData && !finalHeaders["Content-Type"])
    finalHeaders["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `❌ API Error ${response.status}: ${errorText || response.statusText}`
    );
  }

  const data = (await response.json().catch(() => null)) as T;
  return data;
}
