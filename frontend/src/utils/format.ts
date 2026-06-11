export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const dt = new Date(value)
  return dt.toLocaleString('pt-BR')
}
