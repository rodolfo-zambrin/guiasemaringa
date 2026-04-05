/**
 * Format a number as BRL currency (R$ 1.234,56)
 */
export function fmtBRL(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a number as BRL currency with no decimal places (R$ 1.234)
 */
export function fmtBRLDec(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'R$ 0'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number with pt-BR locale (1.234.567)
 */
export function fmtNum(value: number | null | undefined, decimals = 0): string {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a number as percentage - value is 0-100 (e.g. 1.5 => "1,50%")
 */
export function fmtPct(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '0,00%'
  return (
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) + '%'
  )
}

/**
 * Format a ratio as percentage - value is 0.0-1.0 (e.g. 0.015 => "1,50%")
 */
export function fmtPctDirect(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '0,00%'
  return fmtPct(value * 100, decimals)
}

/**
 * Format large numbers with K suffix (e.g. 1500 => "1,5K", 1234567 => "1,2M")
 */
export function fmtK(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) {
    return sign + fmtNum(abs / 1_000_000_000, 1) + 'B'
  }
  if (abs >= 1_000_000) {
    return sign + fmtNum(abs / 1_000_000, 1) + 'M'
  }
  if (abs >= 1_000) {
    return sign + fmtNum(abs / 1_000, 1) + 'K'
  }
  return sign + fmtNum(abs, 0)
}

/**
 * Format a ROAS multiplier (e.g. 3.5 => "3,50x")
 */
export function fmtROAS(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0,00x'
  return fmtNum(value, 2) + 'x'
}

/**
 * Format a date string to pt-BR format
 */
export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

/**
 * Format hour (0-23) to HH:00
 */
export function fmtHour(hour: number): string {
  return String(hour).padStart(2, '0') + ':00'
}
