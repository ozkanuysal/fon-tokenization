import { createConfig, http } from 'wagmi'
import { foundry, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia, foundry],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
    [foundry.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

// TODO: load from deployments/*.json
export const contracts = {
  usdc: '0x0000000000000000000000000000000000000000',
  registry: '0x0000000000000000000000000000000000000000',
  fund: '0x0000000000000000000000000000000000000000',
} as const

export const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'
