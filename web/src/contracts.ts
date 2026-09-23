import { keccak256, toHex } from 'viem'
import { fundTokenAbi, investorRegistryAbi, mockUSDCAbi } from './abi'
import { deployment } from './config'

export const usdc = { address: deployment.usdc, abi: mockUSDCAbi } as const
export const registry = { address: deployment.registry, abi: investorRegistryAbi } as const
export const fund = { address: deployment.fund, abi: fundTokenAbi } as const

export const MANAGER_ROLE = keccak256(toHex('MANAGER_ROLE'))
