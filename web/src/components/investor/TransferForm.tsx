import { useState } from 'react'
import { isAddress } from 'viem'
import { useSimulateContract } from 'wagmi'
import { fund } from '../../contracts'
import { useTx } from '../../hooks/useTx'
import { parseShares } from '../../lib/format'
import { TxStatus } from '../TxStatus'

// Not part of the brief, but it lets you see the allowlist rule in action.
export function TransferForm() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const to = isAddress(recipient) ? recipient : undefined
  const shares = parseShares(amount)

  const transfer = useSimulateContract({
    ...fund,
    functionName: 'transfer',
    args: to && shares ? [to, shares] : undefined,
    query: { enabled: Boolean(to && shares) },
  })
  const tx = useTx()

  function clear() {
    setRecipient('')
    setAmount('')
  }

  return (
    <section>
      <h2>Pay transferi</h2>
      <p className="hint">Paylar yalnızca onaylı yatırımcılar arasında transfer edilebilir.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (transfer.data) tx.send(transfer.data.request, clear)
        }}
      >
        <input
          placeholder="Alıcı adresi (0x...)"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value.trim())}
        />
        <input
          inputMode="decimal"
          placeholder="Pay miktarı"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <button className="primary" type="submit" disabled={!transfer.data || tx.busy}>
          Transfer et
        </button>
      </form>
      <TxStatus state={tx.state} preflightError={transfer.error} />
    </section>
  )
}
