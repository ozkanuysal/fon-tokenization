import { useState } from 'react'
import { formatUnits } from 'viem'
import { useConnection, useReadContract, useSimulateContract } from 'wagmi'
import { fund } from '../../contracts'
import { useShareBalance } from '../../hooks/useFund'
import { useTx } from '../../hooks/useTx'
import { formatUsdc, parseShares, SHARE_DECIMALS } from '../../lib/format'
import { TxStatus } from '../TxStatus'

export function RedeemForm() {
  const { address } = useConnection()
  const balance = useShareBalance(address)
  const [input, setInput] = useState('')
  const shares = parseShares(input)

  const { data: assets } = useReadContract({
    ...fund,
    functionName: 'previewRedeem',
    args: shares ? [shares] : undefined,
    query: { enabled: Boolean(shares) },
  })
  const redemption = useSimulateContract({
    ...fund,
    functionName: 'redeem',
    args: shares ? [shares] : undefined,
    query: { enabled: Boolean(shares) },
  })
  const tx = useTx()

  return (
    <section>
      <h2>Fondan çıkış</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (redemption.data) tx.send(redemption.data.request, () => setInput(''))
        }}
      >
        <input
          inputMode="decimal"
          placeholder="Pay miktarı"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          type="button"
          disabled={!balance}
          onClick={() => balance && setInput(formatUnits(balance, SHARE_DECIMALS))}
        >
          Tümü
        </button>
        <button className="primary" type="submit" disabled={!redemption.data || tx.busy}>
          Fondan çık
        </button>
      </form>
      {assets !== undefined && (
        <p className="hint">Yaklaşık {formatUsdc(assets)} mUSDC alırsınız.</p>
      )}
      <TxStatus state={tx.state} preflightError={redemption.error} />
    </section>
  )
}
