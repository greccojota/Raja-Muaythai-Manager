// ── Formatação ──────────────────────────────────────────────────

export function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '')
}

export function rawCPF(v: string)   { return v.replace(/\D/g, '') }
export function rawPhone(v: string) { return v.replace(/\D/g, '') }
export function rawCEP(v: string)   { return v.replace(/\D/g, '') }

// ── Validação ───────────────────────────────────────────────────

export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += +d[i] * (10 - i)
  if (+d[9] !== ((s * 10) % 11) % 10) return false
  s = 0
  for (let i = 0; i < 10; i++) s += +d[i] * (11 - i)
  return +d[10] === ((s * 10) % 11) % 10
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone: string): boolean {
  return rawPhone(phone).length >= 10
}

export function validateCEP(cep: string): boolean {
  return rawCEP(cep).length === 8
}
