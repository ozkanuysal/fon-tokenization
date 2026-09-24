import { useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'
import { toMessage } from '../lib/errors'
import { shortAddress } from '../lib/format'

export function ConnectButton() {
  const { address, isConnected } = useConnection()
  const connectors = useConnectors()
  const connect = useConnect()
  const disconnect = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="wallet">
        <code>{shortAddress(address)}</code>
        <button onClick={() => disconnect.mutate()}>Çıkış</button>
      </div>
    )
  }

  return (
    <div className="wallet">
      <button
        className="primary"
        disabled={connect.isPending}
        onClick={() => connect.mutate({ connector: connectors[0] })}
      >
        {connect.isPending ? 'Bağlanıyor...' : 'Cüzdan bağla'}
      </button>
      {connect.error && <span className="connect-error">{toMessage(connect.error)}</span>}
    </div>
  )
}
