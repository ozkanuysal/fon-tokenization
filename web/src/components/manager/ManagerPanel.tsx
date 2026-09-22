import { FundSummary } from './FundSummary'
import { NavForm } from './NavForm'
import { InvestorManager } from './InvestorManager'

export function ManagerPanel() {
  return (
    <>
      <FundSummary />
      <NavForm />
      <InvestorManager />
    </>
  )
}
