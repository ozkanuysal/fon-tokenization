import { useConnection, useReadContract } from 'wagmi'
import { fund, MANAGER_ROLE } from '../contracts'

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
