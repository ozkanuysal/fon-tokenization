import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Hash } from 'viem'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { toMessage } from '../lib/errors'

export type TxState =
  | { status: 'idle' }
  | { status: 'signing' }
  | { status: 'mining'; hash: Hash }
  | { status: 'success'; hash: Hash }
  | { status: 'error'; message: string; hash?: Hash }

type Receipt = { error: Error | null; data?: { status: 'success' | 'reverted' } }

// Sends a contract write and follows it until it is mined or fails.
// All on-chain reads are refreshed once the transaction succeeds.
export function useTx() {
  const queryClient = useQueryClient()
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: write.data })
  const afterMined = useRef<() => void>(undefined)

  const mined = receipt.data?.status === 'success'
  useEffect(() => {
    if (!mined) return
    void queryClient.invalidateQueries()
    afterMined.current?.()
    afterMined.current = undefined
  }, [mined, queryClient])

  function send(request: Parameters<typeof write.mutate>[0], onMined?: () => void) {
    afterMined.current = onMined
    write.mutate(request)
  }

  const state = toState(write.data, write.isPending, write.error, receipt)
  const busy = state.status === 'signing' || state.status === 'mining'

  return { send, state, busy }
}

function toState(
  hash: Hash | undefined,
  signing: boolean,
  writeError: Error | null,
  receipt: Receipt,
): TxState {
  if (signing) return { status: 'signing' }
  if (writeError) return { status: 'error', message: toMessage(writeError) }
  if (!hash) return { status: 'idle' }
  if (receipt.error) return { status: 'error', message: toMessage(receipt.error), hash }
  if (receipt.data?.status === 'reverted') {
    return { status: 'error', message: 'İşlem zincirde geri alındı.', hash }
  }
  if (receipt.data) return { status: 'success', hash }
  return { status: 'mining', hash }
}
