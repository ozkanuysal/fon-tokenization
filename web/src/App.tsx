import { useState } from 'react'
import { ConnectButton } from './components/ConnectButton'
import { NetworkGuard } from './components/NetworkGuard'
import { InvestorPanel } from './components/investor/InvestorPanel'
import { ManagerPanel } from './components/manager/ManagerPanel'

type Tab = 'investor' | 'manager'

export default function App() {
  const [tab, setTab] = useState<Tab>('investor')

  return (
    <main>
      <header>
        <h1>Fon Tokenizasyonu</h1>
        <ConnectButton />
      </header>

      <NetworkGuard>
        <nav>
          <button onClick={() => setTab('investor')} disabled={tab === 'investor'}>
            Yatırımcı
          </button>
          {/* TODO: show only to wallets with MANAGER_ROLE */}
          <button onClick={() => setTab('manager')} disabled={tab === 'manager'}>
            Yönetici
          </button>
        </nav>

        {tab === 'investor' ? <InvestorPanel /> : <ManagerPanel />}
      </NetworkGuard>
    </main>
  )
}
