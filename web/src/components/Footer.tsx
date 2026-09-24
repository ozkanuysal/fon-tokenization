import { backendUrl, deployment, explorerUrl } from '../config'
import { shortAddress } from '../lib/format'

const contracts = [
  { name: 'FundToken', address: deployment.fund },
  { name: 'InvestorRegistry', address: deployment.registry },
  { name: 'MockUSDC', address: deployment.usdc },
]

export function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        {contracts.map(({ name, address }) =>
          explorerUrl ? (
            <a key={name} href={`${explorerUrl}/address/${address}#code`} target="_blank" rel="noreferrer">
              {name}
            </a>
          ) : (
            <span key={name}>
              {name} <code>{shortAddress(address)}</code>
            </span>
          ),
        )}
        <a href={`${backendUrl}/docs`} target="_blank" rel="noreferrer">
          Backend API
        </a>
      </div>
    </footer>
  )
}
