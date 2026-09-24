import { Summary } from './Summary'
import { SubscribeForm } from './SubscribeForm'
import { RedeemForm } from './RedeemForm'
import { TransferForm } from './TransferForm'
import { History } from './History'

export function InvestorPanel() {
  return (
    <>
      <Summary />
      <div className="grid-2">
        <SubscribeForm />
        <RedeemForm />
      </div>
      <TransferForm />
      <History />
    </>
  )
}
