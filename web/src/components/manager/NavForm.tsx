import { useState } from 'react'
import { useReadContract, useSimulateContract } from 'wagmi'
import { fund } from '../../contracts'
import { useNav } from '../../hooks/useFund'
import { useTx } from '../../hooks/useTx'
import { formatTimestamp, formatUsdc, parseUsdc } from '../../lib/format'
import { TxStatus } from '../TxStatus'

export function NavForm() {
  const nav = useNav()
  const { data: updatedAt } = useReadContract({ ...fund, functionName: 'navUpdatedAt' })
  const [input, setInput] = useState('')
  const newNav = parseUsdc(input)

  const update = useSimulateContract({
    ...fund,
    functionName: 'setNav',
    args: newNav ? [newNav] : undefined,
    query: { enabled: Boolean(newNav) },
  })
  const tx = useTx()

  return (
    <section>
      <h2>NAV güncelle</h2>
      <p>
        Güncel NAV: <strong>{formatUsdc(nav)} mUSDC</strong>
      </p>
      {updatedAt !== undefined && (
        <p className="hint">Son güncelleme: {formatTimestamp(updatedAt)}</p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (update.data) tx.send(update.data.request, () => setInput(''))
        }}
      >
        <input
          inputMode="decimal"
          placeholder="Yeni NAV (ör. 1,05)"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary" type="submit" disabled={!update.data || tx.busy}>
          Güncelle
        </button>
      </form>
      <TxStatus state={tx.state} preflightError={update.error} />
    </section>
  )
}
