import type { Address } from 'viem'
import { createConfig, http } from 'wagmi'
import { foundry, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import localDeployment from '../../deployments/local.json'
import sepoliaDeployment from '../../deployments/sepolia.json'

type Deployment = {
  chainId: number
  startBlock: number
  usdc: Address
  registry: Address
  fund: Address
}

// VITE_NETWORK=local runs against the anvil chain from docker compose, anything else is Sepolia.
const isLocal = import.meta.env.VITE_NETWORK === 'local'

// Contract addresses written by contracts/script/Deploy.s.sol.
export const deployment = (isLocal ? localDeployment : sepoliaDeployment) as Deployment

export const chain = isLocal ? foundry : sepolia

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
