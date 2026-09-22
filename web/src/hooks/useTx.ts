export type TxState =
  | { status: 'idle' }
  | { status: 'signing' }
  | { status: 'mining'; hash: `0x${string}` }
  | { status: 'success'; hash: `0x${string}` }
  | { status: 'error'; message: string }

// Wraps a contract write: wallet confirmation -> sent -> mined or failed.
export function useTx() {
  // TODO: useWriteContract + useWaitForTransactionReceipt
  const state: TxState = { status: 'idle' }
  return { state }
}
