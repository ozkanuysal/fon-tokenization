import { useState } from 'react'
import { useConnection, useSimulateContract } from 'wagmi'
import { fund, usdc } from '../../contracts'
import { useAllowance, usePreviewSubscribe } from '../../hooks/useFund'
import { useTx } from '../../hooks/useTx'
import { formatShares, parseUsdc } from '../../lib/format'
import { TxStatus } from '../TxStatus'

// Two steps: allow the fund to take the mUSDC, then subscribe.
export function SubscribeForm() {
  const { address } = useConnection()
  const [input, setInput] = useState('')
  const assets = parseUsdc(input)

  const allowance = useAllowance(address)
  const shares = usePreviewSubscribe(assets)

  const needsApproval = assets !== undefined && allowance !== undefined && allowance < assets

  const approval = useSimulateContract({
    ...usdc,
    functionName: 'approve',
    args: assets ? [fund.address, assets] : undefined,
    query: { enabled: needsApproval },
  })
  const subscription = useSimulateContract({
    ...fund,
    functionName: 'subscribe',
    args: assets ? [assets] : undefined,
    query: { enabled: assets !== undefined && allowance !== undefined && !needsApproval },
  })
  const tx = useTx()

  function submit() {
    if (needsApproval) {
      if (approval.data) tx.send(approval.data.request)
    } else if (subscription.data) {
      tx.send(subscription.data.request, () => setInput(''))
    }
  }

  const step = needsApproval ? approval : subscription

  return (
    <section>
      <h2>Fona giriş</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <input
          inputMode="decimal"
          placeholder="Tutar (mUSDC)"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary" type="submit" disabled={!step.data || tx.busy}>
          {needsApproval ? '1/2 Harcama izni ver' : 'Fona gir'}
        </button>
      </form>
      {shares !== undefined && (
        <p className="hint">Yaklaşık {formatShares(shares)} pay alırsınız.</p>
      )}
      <TxStatus state={tx.state} preflightError={step.error} />
    </section>
  )
}
