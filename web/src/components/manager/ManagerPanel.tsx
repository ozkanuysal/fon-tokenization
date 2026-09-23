import { FundSummary } from './FundSummary'
import { NavForm } from './NavForm'
import { NavHistory } from './NavHistory'
import { InvestorManager } from './InvestorManager'

export function ManagerPanel() {
  return (
    <>
      <FundSummary />
      <NavForm />
      <NavHistory />
      <InvestorManager />
    </>
  )
}
