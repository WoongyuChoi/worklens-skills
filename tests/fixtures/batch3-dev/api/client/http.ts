const basePath = '/intra/api';
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(basePath + path);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}
export async function postJson(path: string, body: unknown): Promise<void> {
  const response = await fetch(basePath + path, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(String(response.status));
}
