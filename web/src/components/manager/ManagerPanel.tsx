import { FundSummary } from './FundSummary'
import { NavForm } from './NavForm'
import { NavHistory } from './NavHistory'
import { InvestorManager } from './InvestorManager'

export function ManagerPanel() {
  return (
    <>
      <FundSummary />
      <div className="grid-2">
        <NavForm />
        <NavHistory />
      </div>
      <InvestorManager />
    </>
  )
}
