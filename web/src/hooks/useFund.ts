import type { Address } from 'viem'
import { useReadContract } from 'wagmi'
import { fund, usdc } from '../contracts'

// Reads used by more than one component. wagmi caches them, so each runs once per refresh.

export function useNav(): bigint | undefined {
  return useReadContract({ ...fund, functionName: 'nav' }).data
}

export function useShareBalance(account: Address | undefined): bigint | undefined {
  return useReadContract({
    ...fund,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: Boolean(account) },
  }).data
}

export function useUsdcBalance(account: Address | undefined): bigint | undefined {
  return useReadContract({
    ...usdc,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: Boolean(account) },
  }).data
}
