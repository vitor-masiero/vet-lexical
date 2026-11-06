/** Wrapper de fetch com JSON e tratamento de erros padronizado. */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const message =
      typeof data.error === "string" ? data.error : "Erro inesperado.";
    throw new Error(message);
  }

  return data as T;
}
