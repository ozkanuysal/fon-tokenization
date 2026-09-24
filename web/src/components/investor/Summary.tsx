import { useConnection, useReadContract, useSimulateContract } from 'wagmi'
import { fund, registry, TEST_USDC_AMOUNT, usdc } from '../../contracts'
import { useNav, useShareBalance, useUsdcBalance } from '../../hooks/useFund'
import { useTx } from '../../hooks/useTx'
import { formatShares, formatUsdc } from '../../lib/format'
import { Stat } from '../Stat'
import { TxStatus } from '../TxStatus'

export function Summary() {
  const { address } = useConnection()
  const nav = useNav()
  const shares = useShareBalance(address)
  const usdcBalance = useUsdcBalance(address)

  const { data: value } = useReadContract({
    ...fund,
    functionName: 'previewRedeem',
    args: shares !== undefined ? [shares] : undefined,
    query: { enabled: shares !== undefined },
  })
  const { data: approved } = useReadContract({
    ...registry,
    functionName: 'isApproved',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })

  const faucet = useSimulateContract({
    ...usdc,
    functionName: 'mint',
    args: address ? [address, TEST_USDC_AMOUNT] : undefined,
    query: { enabled: Boolean(address) },
  })
  const tx = useTx()

  return (
    <section>
      <h2>Özet</h2>
      <div className="stats">
        <Stat label="NAV (1 pay)" value={`${formatUsdc(nav)} mUSDC`} />
        <Stat label="Payım" value={formatShares(shares)} />
        <Stat label="Payımın değeri" value={`${formatUsdc(value)} mUSDC`} />
        <Stat label="mUSDC bakiyem" value={formatUsdc(usdcBalance)} />
        <Stat
          label="Durum"
          value={
            <span className={approved ? 'badge ok' : 'badge warn'}>
              {approved ? 'Onaylı yatırımcı' : 'Onaysız'}
            </span>
          }
        />
      </div>
      {approved === false && (
        <p className="hint">Fona girebilmek için yöneticinin adresinizi onaylaması gerekiyor.</p>
      )}
      <button
        disabled={!faucet.data || tx.busy}
        onClick={() => faucet.data && tx.send(faucet.data.request)}
      >
        10.000 test mUSDC al
      </button>
      <TxStatus state={tx.state} preflightError={faucet.error} />
    </section>
  )
}
