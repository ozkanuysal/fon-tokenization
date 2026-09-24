import { useState } from 'react'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'
import { registry } from '../../contracts'
import { useInvestors, useIsApproved } from '../../hooks/useFund'
import { useTx } from '../../hooks/useTx'
import { TxStatus } from '../TxStatus'

export function InvestorManager() {
  const [input, setInput] = useState('')
  const investor = isAddress(input) ? input : undefined

  const investors = useInvestors()
  const approved = useIsApproved(investor)

  const approval = useSimulateContract({
    ...registry,
    functionName: 'approve',
    args: investor ? [investor] : undefined,
    query: { enabled: Boolean(investor) },
  })
  const removal = useSimulateContract({
    ...registry,
    functionName: 'remove',
    args: investor ? [investor] : undefined,
    query: { enabled: Boolean(investor) },
  })
  const tx = useTx()

  // For a valid address one of the two always fails (already approved / not on the list),
  // so only an error that blocks both is worth showing.
  const blockingError = approval.error && removal.error ? approval.error : null

  return (
    <section>
      <h2>Yatırımcılar</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <input
          placeholder="Cüzdan adresi (0x...)"
          value={input}
          onChange={(event) => setInput(event.target.value.trim())}
        />
        <button
          className="primary"
          type="button"
          disabled={!approval.data || tx.busy}
          onClick={() => approval.data && tx.send(approval.data.request, () => setInput(''))}
        >
          Onayla
        </button>
        <button
          type="button"
          disabled={!removal.data || tx.busy}
          onClick={() => removal.data && tx.send(removal.data.request, () => setInput(''))}
        >
          Kaldır
        </button>
      </form>
      {input && !investor && <p className="hint">Geçerli bir adres girin.</p>}
      {approved !== undefined && (
        <p className="hint">Bu adres şu an {approved ? 'onaylı' : 'onaylı değil'}.</p>
      )}
      <TxStatus state={tx.state} preflightError={blockingError} />

      <h3>Onaylı yatırımcılar ({investors?.length ?? 0})</h3>
      <ul className="addresses">
        {investors?.map((address) => (
          <li key={address}>
            <code>{address}</code>
          </li>
        ))}
      </ul>
    </section>
  )
}
