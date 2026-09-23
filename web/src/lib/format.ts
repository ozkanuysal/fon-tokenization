import { formatUnits, parseUnits } from 'viem'

export const USDC_DECIMALS = 6
export const SHARE_DECIMALS = 18

const usdcFormat = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const shareFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 4 })

export function formatUsdc(value: bigint | undefined): string {
  return value === undefined ? '-' : usdcFormat.format(Number(formatUnits(value, USDC_DECIMALS)))
}

export function formatShares(value: bigint | undefined): string {
  return value === undefined ? '-' : shareFormat.format(Number(formatUnits(value, SHARE_DECIMALS)))
}

export function parseUsdc(input: string): bigint | undefined {
  return parsePositive(input, USDC_DECIMALS)
}

export function parseShares(input: string): bigint | undefined {
  return parsePositive(input, SHARE_DECIMALS)
}

// Accepts both "1.5" and "1,5"; anything that is not a positive number gives undefined.
function parsePositive(input: string, decimals: number): bigint | undefined {
  try {
    const value = parseUnits(input.trim().replace(',', '.'), decimals)
    return value > 0n ? value : undefined
  } catch {
    return undefined
  }
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
