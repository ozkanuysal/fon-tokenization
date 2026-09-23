import { keccak256, parseUnits, toHex } from 'viem'
import { fundTokenAbi, investorRegistryAbi, mockUSDCAbi } from './abi'
import { deployment } from './config'

export const usdc = { address: deployment.usdc, abi: mockUSDCAbi } as const
export const registry = { address: deployment.registry, abi: investorRegistryAbi } as const
export const fund = { address: deployment.fund, abi: fundTokenAbi } as const

export const MANAGER_ROLE = keccak256(toHex('MANAGER_ROLE'))

// How much test mUSDC one click of the faucet buttons mints.
export const TEST_USDC_AMOUNT = parseUnits('10000', 6)
