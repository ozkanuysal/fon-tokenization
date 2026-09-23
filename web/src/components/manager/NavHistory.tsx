import { useNavHistory } from '../../hooks/useHistory'
import { formatTimestamp, formatUsdc } from '../../lib/format'
import { TxLink } from '../TxStatus'

export function NavHistory() {
  const { data, isPending, isError } = useNavHistory()

  return (
    <section>
      <h2>NAV geçmişi</h2>
      {isError && <p className="hint">Geçmiş şu an yüklenemiyor. Diğer işlemler etkilenmez.</p>}
      {isPending && !isError && <p className="hint">Yükleniyor...</p>}
      {data?.length === 0 && <p className="hint">NAV henüz güncellenmedi, başlangıç değeri 1,00.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>NAV (mUSDC)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((point) => (
              <tr key={point.tx_hash}>
                <td>{formatTimestamp(point.timestamp)}</td>
                <td>{formatUsdc(BigInt(point.nav))}</td>
                <td>
                  <TxLink hash={point.tx_hash} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
