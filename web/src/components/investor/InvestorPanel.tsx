import { Summary } from './Summary'
import { SubscribeForm } from './SubscribeForm'
import { RedeemForm } from './RedeemForm'
import { TransferForm } from './TransferForm'
import { History } from './History'

export function InvestorPanel() {
  return (
    <>
      <Summary />
      <SubscribeForm />
      <RedeemForm />
      <TransferForm />
      <History />
    </>
  )
}
