import type { ReactNode } from 'react'
import { useConnection, useSwitchChain } from 'wagmi'
import { chain } from '../config'

export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useConnection()
  const switchChain = useSwitchChain()

  if (!isConnected) {
    return (
      <section className="welcome">
        <h2>Hoş geldiniz</h2>
        <p>
          Bu uygulama bir yatırım fonunun paylarını {chain.name} test ağında token olarak tutar.
          Yatırımcı olarak fona girip çıkabilir, yönetici olarak NAV'ı güncelleyip yatırımcıları
          onaylayabilirsiniz.
        </p>
        <p className="hint">Başlamak için sağ üstten cüzdanınızı bağlayın.</p>
      </section>
    )
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
