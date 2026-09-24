import type { Address } from 'viem'
import { useConnection, useReadContract } from 'wagmi'
import { fund, MANAGER_ROLE, registry, usdc } from '../contracts'

// Every on-chain read the UI makes lives in this file; components only render the values.
// wagmi caches identical reads, so using a hook in several components costs one request.

export function useNav(): bigint | undefined {
  return useReadContract({ ...fund, functionName: 'nav' }).data
}

export function useNavUpdatedAt(): bigint | undefined {
  return useReadContract({ ...fund, functionName: 'navUpdatedAt' }).data
}

export function useTotalShares(): bigint | undefined {
  return useReadContract({ ...fund, functionName: 'totalSupply' }).data
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

// How much mUSDC the fund is allowed to take from `owner` (set by the approve step).
export function useAllowance(owner: Address | undefined): bigint | undefined {
  return useReadContract({
    ...usdc,
    functionName: 'allowance',
    args: owner ? [owner, fund.address] : undefined,
    query: { enabled: Boolean(owner) },
  }).data
}

export function usePreviewSubscribe(assets: bigint | undefined): bigint | undefined {
  return useReadContract({
    ...fund,
    functionName: 'previewSubscribe',
    args: assets !== undefined ? [assets] : undefined,
    query: { enabled: assets !== undefined },
  }).data
}

export function usePreviewRedeem(shares: bigint | undefined): bigint | undefined {
  return useReadContract({
    ...fund,
    functionName: 'previewRedeem',
    args: shares !== undefined ? [shares] : undefined,
    query: { enabled: shares !== undefined },
  }).data
}

export function useIsApproved(account: Address | undefined): boolean | undefined {
  return useReadContract({
    ...registry,
    functionName: 'isApproved',
    args: account ? [account] : undefined,
    query: { enabled: Boolean(account) },
  }).data
}

export function useInvestors(): readonly Address[] | undefined {
  return useReadContract({ ...registry, functionName: 'investors' }).data
}

export function useIsManager(): boolean {
  const { address } = useConnection()
  const { data } = useReadContract({
    ...fund,
    functionName: 'hasRole',
    args: address ? [MANAGER_ROLE, address] : undefined,
    query: { enabled: Boolean(address) },
  })
  return data === true
}
