import { useState } from 'react'
import { ConnectButton } from './components/ConnectButton'
import { Footer } from './components/Footer'
import { NetworkGuard } from './components/NetworkGuard'
import { InvestorPanel } from './components/investor/InvestorPanel'
import { ManagerPanel } from './components/manager/ManagerPanel'
import { chain } from './config'
import { useIsManager } from './hooks/useFund'

type Tab = 'investor' | 'manager'

export default function App() {
  const [tab, setTab] = useState<Tab>('investor')
  const isManager = useIsManager()
  const activeTab = isManager ? tab : 'investor'

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <span className="logo">F</span>
            <div>
              <h1>Fon Tokenizasyonu</h1>
              <p>Paylar blokzincirde token olarak tutulan demo yatırım fonu</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="network">{chain.name}</span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container">
        <NetworkGuard>
          {isManager && (
            <nav className="tabs">
              <button
                className={activeTab === 'investor' ? 'active' : ''}
                onClick={() => setTab('investor')}
              >
                Yatırımcı
              </button>
              <button
                className={activeTab === 'manager' ? 'active' : ''}
                onClick={() => setTab('manager')}
              >
                Yönetici
              </button>
            </nav>
          )}

          {activeTab === 'investor' ? <InvestorPanel /> : <ManagerPanel />}
        </NetworkGuard>
      </main>

      <Footer />
    </>
  )
}
