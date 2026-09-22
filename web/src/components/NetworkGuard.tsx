import type { ReactNode } from 'react'

export function NetworkGuard({ children }: { children: ReactNode }) {
  // TODO: ask the user to switch to Sepolia when the wallet is on another chain
  return <>{children}</>
}
