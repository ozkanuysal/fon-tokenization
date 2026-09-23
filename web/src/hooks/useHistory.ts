import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { backendUrl } from '../config'

// Shapes returned by the backend (uint256 values come as strings).
export type Transaction = {
  type: 'subscribe' | 'redeem' | 'transfer'
  investor: string
  counterparty: string | null
  assets: string | null
  shares: string | null
  price: string | null
  block_number: number
  tx_hash: `0x${string}`
  timestamp: number
}

export type NavPoint = {
  nav: string
  block_number: number
  tx_hash: `0x${string}`
  timestamp: number
}

export function useTransactions(investor: Address | undefined) {
  return useQuery({
    queryKey: ['transactions', investor],
    queryFn: () => getJson<Transaction[]>(`/transactions?investor=${investor}`),
    enabled: Boolean(investor),
  })
}

export function useNavHistory() {
  return useQuery({
    queryKey: ['nav-history'],
    queryFn: () => getJson<NavPoint[]>('/nav-history'),
  })
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`)
  if (!response.ok) throw new Error(`Backend returned ${response.status}`)
  return response.json()
}
