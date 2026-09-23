import type { ReactNode } from 'react'
import { useConnection, useSwitchChain } from 'wagmi'
import { chain } from '../config'

export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useConnection()
  const switchChain = useSwitchChain()

  if (!isConnected) {
    return <p className="hint">Devam etmek için cüzdanınızı bağlayın.</p>
  }

  if (chainId !== chain.id) {
    return (
      <section>
        <p>Cüzdanınız farklı bir ağda. Uygulama {chain.name} üzerinde çalışıyor.</p>
        <button className="primary" onClick={() => switchChain.mutate({ chainId: chain.id })}>
          {chain.name} ağına geç
        </button>
      </section>
    )
  }

  return <>{children}</>
}
