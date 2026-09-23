import { useConnection } from 'wagmi'
import { type Transaction, useTransactions } from '../../hooks/useHistory'
import { formatShares, formatTimestamp, formatUsdc } from '../../lib/format'
import { TxLink } from '../TxStatus'

export function History() {
  const { address } = useConnection()
  const { data, isPending, isError } = useTransactions(address)

  return (
    <section>
      <h2>İşlem geçmişi</h2>
      {isError && <p className="hint">Geçmiş şu an yüklenemiyor. Diğer işlemler etkilenmez.</p>}
      {isPending && !isError && <p className="hint">Yükleniyor...</p>}
      {data?.length === 0 && <p className="hint">Henüz işlem yok.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem</th>
              <th>Pay</th>
              <th>Tutar (mUSDC)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((tx, index) => (
              <tr key={`${tx.tx_hash}-${index}`}>
                <td>{formatTimestamp(tx.timestamp)}</td>
                <td>{label(tx, address)}</td>
                <td>{tx.shares ? formatShares(BigInt(tx.shares)) : '-'}</td>
                <td>{tx.assets ? formatUsdc(BigInt(tx.assets)) : '-'}</td>
                <td>
                  <TxLink hash={tx.tx_hash} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="hint">Yeni işlemler zincirde onaylandıktan yaklaşık bir dakika sonra görünür.</p>
    </section>
  )
}

function label(tx: Transaction, me: string | undefined): string {
  if (tx.type === 'subscribe') return 'Giriş'
  if (tx.type === 'redeem') return 'Çıkış'
  return tx.investor === me?.toLowerCase() ? 'Transfer (giden)' : 'Transfer (gelen)'
}
