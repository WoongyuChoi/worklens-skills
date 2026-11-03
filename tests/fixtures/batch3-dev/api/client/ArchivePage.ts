import { getJson } from './http';
export async function loadArchive(id: string) {
  const data = await getJson<{label: string}>('/archive-invoices/' + id);
  return data.label.toUpperCase();
}
