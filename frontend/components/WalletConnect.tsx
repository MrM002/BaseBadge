'use client'

import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet'

import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity'

export function WalletConnect() {
  const router = useRouter()
  const { disconnect } = useDisconnect()

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }



  return (
    <div className="flex justify-end relative z-50">
      <Wallet>
        <ConnectWallet className="bg-gamefi-blue border border-gamefi-blue/60 text-white font-semibold py-3 px-5 rounded-xl text-base transition-colors hover:bg-white/50 hover:text-black">
          <Avatar className="h-5 w-5" />
          <Name />
        </ConnectWallet>
        <WalletDropdown className="bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 z-50">
          <Identity className="px-6 py-4 border-b border-gray-700/50" hasCopyAddressOnClick>
            <Avatar />
            <Name className="text-white font-semibold" />
            <Address className="text-gray-300 text-sm" />
            <EthBalance className="text-orange-400 font-semibold" />
          </Identity>
          <WalletDropdownBasename className="px-6 py-3 hover:bg-blue-900/20 transition-colors duration-200 text-gray-200 border-b border-gray-700/50" />
          <WalletDropdownLink
            href="/dashboard/settings"
            className="px-6 py-3 hover:bg-gray-800/50 transition-colors duration-200 text-gray-200 border-b border-gray-700/50"
          >
            ⚙️ Settings
          </WalletDropdownLink>
          <div className="border-t border-gray-700/50">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-6 py-3 hover:bg-red-900/20 transition-colors duration-200 text-red-400 cursor-pointer bg-transparent border-none relative z-10"
            >
              🚪 Disconnect
            </button>
          </div>
        </WalletDropdown>
      </Wallet>
    </div>
  )
}