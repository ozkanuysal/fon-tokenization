import {
  BaseError,
  ContractFunctionRevertedError,
  ResourceUnavailableRpcError,
  UserRejectedRequestError,
} from 'viem'

// Custom errors of our contracts (and the OpenZeppelin ones they inherit), by name.
const contractErrors: Record<string, string> = {
  NotApprovedInvestor: 'Bu adres onaylı yatırımcı değil.',
  InsufficientLiquidity: 'Fonda şu an yeterli nakit yok.',
  ZeroAmount: 'Tutar çok küçük.',
  InvalidNav: 'NAV sıfırdan büyük olmalı.',
  AlreadyApproved: 'Bu adres zaten onaylı.',
  NotRegistered: 'Bu adres onaylı listesinde değil.',
  ZeroAddress: 'Geçerli bir adres girin.',
  AccessControlUnauthorizedAccount: 'Bu işlem için yönetici yetkisi gerekiyor.',
  ERC20InsufficientBalance: 'Bakiyeniz yetersiz.',
  ERC20InsufficientAllowance: 'Harcama izni yetersiz.',
}

export function toMessage(error: unknown): string {
  if (!(error instanceof BaseError)) {
    // wagmi throws this when the browser has no injected wallet at all
    if (error instanceof Error && error.name === 'ProviderNotFoundError') {
      return 'Tarayıcıda MetaMask gibi bir cüzdan bulunamadı.'
    }
    return 'Beklenmeyen bir hata oluştu.'
  }

  if (error.walk((e) => e instanceof UserRejectedRequestError)) {
    return 'İsteği cüzdanda reddettiniz.'
  }
  if (error.walk((e) => e instanceof ResourceUnavailableRpcError)) {
    return 'Cüzdanda bekleyen bir istek var, MetaMask penceresini açıp tamamlayın.'
  }

  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError)
  if (revert instanceof ContractFunctionRevertedError) {
    const name = revert.data?.errorName
    if (name && contractErrors[name]) return contractErrors[name]
  }

  return error.shortMessage
}
