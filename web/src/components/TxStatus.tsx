import type { TxState } from '../hooks/useTx'

export function TxStatus({ state }: { state: TxState }) {
  // TODO: wallet confirmation / sent (explorer link) / success / error messages
  if (state.status === 'idle') return null
  return <p>{state.status}</p>
}
