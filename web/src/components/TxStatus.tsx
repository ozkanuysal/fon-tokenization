import type { Hash } from 'viem'
import { explorerUrl } from '../config'
import type { TxState } from '../hooks/useTx'
import { toMessage } from '../lib/errors'

type Props = {
  state: TxState
  // The simulation that runs before sending tells us early when a transaction would fail.
  preflightError?: Error | null
}

export function TxStatus({ state, preflightError }: Props) {
  if (state.status === 'signing') {
    return <p className="tx pending">Cüzdanınızda onay bekleniyor...</p>
  }
  if (state.status === 'mining') {
    return (
      <p className="tx pending">
        İşlem gönderildi, blok onayı bekleniyor. <TxLink hash={state.hash} />
      </p>
    )
  }
  return (
    <>
      {state.status === 'success' && (
        <p className="tx success">
          İşlem başarılı. <TxLink hash={state.hash} />
        </p>
      )}
      {state.status === 'error' && (
        <p className="tx error">
          Hata: {state.message} {state.hash && <TxLink hash={state.hash} />}
        </p>
      )}
      {preflightError && <p className="tx error">{toMessage(preflightError)}</p>}
    </>
  )
}

function TxLink({ hash }: { hash: Hash }) {
  if (!explorerUrl) return null
  return (
    <a href={`${explorerUrl}/tx/${hash}`} target="_blank" rel="noreferrer">
      İşlemi görüntüle
    </a>
  )
}
