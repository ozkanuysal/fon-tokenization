import { useState } from 'react'
import { ConnectButton } from './components/ConnectButton'
import { NetworkGuard } from './components/NetworkGuard'
import { InvestorPanel } from './components/investor/InvestorPanel'
import { ManagerPanel } from './components/manager/ManagerPanel'
import { useIsManager } from './hooks/useIsManager'

type Tab = 'investor' | 'manager'

export default function App() {
  const [tab, setTab] = useState<Tab>('investor')
  const isManager = useIsManager()
  const activeTab = isManager ? tab : 'investor'

  return (
    <main>
      <header>
        <h1>Fon Tokenizasyonu</h1>
        <ConnectButton />
      </header>

      <NetworkGuard>
        {isManager && (
          <nav>
            <button onClick={() => setTab('investor')} disabled={activeTab === 'investor'}>
              Yatırımcı
            </button>
            <button onClick={() => setTab('manager')} disabled={activeTab === 'manager'}>
              Yönetici
            </button>
          </nav>
        )}

        {activeTab === 'investor' ? <InvestorPanel /> : <ManagerPanel />}
      </NetworkGuard>
    </main>
  )
}
