import { createConfig, http } from 'wagmi'
import { foundry, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

type Deployment = {
  chainId: number
  startBlock: number
  usdc: `0x${string}`
  registry: `0x${string}`
  fund: `0x${string}`
}

const network = import.meta.env.VITE_NETWORK ?? 'sepolia'

const deployments = import.meta.glob<Deployment>('../../deployments/*.json', {
  eager: true,
  import: 'default',
})

const found = deployments[`../../deployments/${network}.json`]
if (!found) throw new Error(`No deployment file for network "${network}"`)
export const deployment = found

export const chain = network === 'local' ? foundry : sepolia

const sepoliaRpc = import.meta.env.VITE_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'

export const config = createConfig({
  chains: [sepolia, foundry],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(sepoliaRpc),
    [foundry.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

export const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'
export const explorerUrl = chain.blockExplorers?.default.url
