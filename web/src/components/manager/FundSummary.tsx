import { useReadContract, useSimulateContract } from 'wagmi'
import { fund, TEST_USDC_AMOUNT, usdc } from '../../contracts'
import { useNav, useUsdcBalance } from '../../hooks/useFund'
import { useTx } from '../../hooks/useTx'
import { formatShares, formatUsdc } from '../../lib/format'
import { Stat } from '../Stat'
import { TxStatus } from '../TxStatus'

export function FundSummary() {
  const nav = useNav()
  const cash = useUsdcBalance(fund.address)
  const { data: totalShares } = useReadContract({ ...fund, functionName: 'totalSupply' })
  const { data: sharesValue } = useReadContract({
    ...fund,
    functionName: 'previewRedeem',
    args: totalShares !== undefined ? [totalShares] : undefined,
    query: { enabled: totalShares !== undefined },
  })

  // Test money straight into the fund, so redemptions can be paid after a NAV increase.
  const topUp = useSimulateContract({
    ...usdc,
    functionName: 'mint',
    args: [fund.address, TEST_USDC_AMOUNT],
  })
  const tx = useTx()

  const shortfall = sharesValue !== undefined && cash !== undefined && sharesValue > cash

  return (
    <section>
      <h2>Fon özeti</h2>
      <div className="stats">
        <Stat label="NAV (1 pay)" value={`${formatUsdc(nav)} mUSDC`} />
        <Stat label="Toplam pay" value={formatShares(totalShares)} />
        <Stat label="Payların değeri" value={`${formatUsdc(sharesValue)} mUSDC`} />
        <Stat label="Kasadaki nakit" value={`${formatUsdc(cash)} mUSDC`} />
      </div>
      {shortfall && (
        <p className="hint">
          Kasa, tüm payları güncel NAV'dan ödemeye yetmiyor. Çıkışlar için kasaya mUSDC ekleyin.
        </p>
      )}
      <button
        disabled={!topUp.data || tx.busy}
        onClick={() => topUp.data && tx.send(topUp.data.request)}
      >
        Kasaya 10.000 test mUSDC ekle
      </button>
      <TxStatus state={tx.state} preflightError={topUp.error} />
    </section>
  )
}
