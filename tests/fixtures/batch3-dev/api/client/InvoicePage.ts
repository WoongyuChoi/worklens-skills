import { getJson, postJson } from './http';
type Invoice = { label: string; account_code: string };
export async function loadInvoice(id: string) {
  const data = await getJson<Invoice>('/invoices/' + id);
  return { heading: data.label.toUpperCase(), account: data.account_code };
}
export async function saveInvoice(memo: string) {
  await postJson('/invoices', { memo });
}
