import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';
import { TokenHolder } from '@/interface/types';
import { formatAmountV3, shortenAddress } from '@/utils/blockchainUtils';
import dotenv from 'dotenv';

dotenv.config();

interface TokenHoldersProps {
  tokenHolders: TokenHolder[];
  currentPage: number;
  totalPages: number;
  tokenSymbol: string;
  creatorAddress: string;
  tokenAddress: string;
  onPageChange: (page: number) => void;
  allHolders: TokenHolder[];
}

const TokenHolders: React.FC<TokenHoldersProps> = ({
  tokenHolders,
  currentPage,
  totalPages,
  tokenSymbol,
  creatorAddress,
  tokenAddress,
  onPageChange,
  allHolders,
}) => {
  // Calculate total supply excluding the token contract itself
  const totalSupply = allHolders.reduce((sum, holder) => {
    // Skip if the holder is the token contract
    if (holder.address.toLowerCase() === tokenAddress.toLowerCase()) {
      return sum;
    }
    return sum + BigInt(holder.balance);
  }, BigInt(0));

  // Calculate percentage for a holder
  const calculatePercentage = (balance: string, address: string): string => {
    if (address.toLowerCase() === tokenAddress.toLowerCase()) {
      return '0%';
    }
    
    if (totalSupply === BigInt(0)) return '0%';
    const percentage = (BigInt(balance) * BigInt(10000) / totalSupply);
    return `${(Number(percentage) / 100).toFixed(2)}%`;
  };

  // Find the Bonding Curve Manager's holdings
  const bondingCurveHolder = allHolders.find(
    holder => holder.address.toLowerCase() === process.env.NEXT_PUBLIC_BONDING_CURVE_MANAGER_ADDRESS?.toLowerCase()
  );

  // Filter out both token contract and bonding curve manager from the display list
  const filteredHolders = allHolders.filter(holder => 
    holder.address.toLowerCase() !== tokenAddress.toLowerCase() &&
    holder.address.toLowerCase() !== process.env.NEXT_PUBLIC_BONDING_CURVE_MANAGER_ADDRESS?.toLowerCase()
  );

  return (
    <div className="w-full">
      <div className='rounded-[10px] overflow-hidden'>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--primary-200)]">
              <th className="px-4 py-2 text-title font-normal">Holder</th>
              <th className="px-4 py-2 text-title font-normal">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {/* Bonding Curve Manager as the first and only entry */}
            <tr className="bg-grey2">
              <td className="px-4 py-2">
                <span className="text-subtext text-sm">
                  Bonding Curve
                </span>
              </td>
              <td className="px-4 py-2 text-subtext text-sm">
                {bondingCurveHolder ? calculatePercentage(bondingCurveHolder.balance, bondingCurveHolder.address) : '0%'}
              </td>
            </tr>
            {filteredHolders.map((holder, index) => (
              <tr key={index} className={`${index % 2 ? 'bg-grey2' : ''}`}>
                <td className="px-4 py-2">
                  {holder.address === creatorAddress ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_BLOCKSCOUT_URL}/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-subtext hover:text-[var(--primary)] text-sm flex items-center gap-1 transition-colors"
                    >
                      Creator <ExternalLinkIcon size={14} />
                    </a>
                  ) : (
                    <a
                      href={`${process.env.NEXT_PUBLIC_BLOCKSCOUT_URL}/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-subtext hover:text-[var(--primary)] text-sm flex items-center gap-1 transition-colors"
                    >
                      {shortenAddress(holder.address)} <ExternalLinkIcon size={14} />
                    </a>
                  )}
                </td>
                <td className="px-4 py-2 text-subtext text-sm">
                  {calculatePercentage(holder.balance, holder.address)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tokenHolders.length === 0 && (
        <div className="text-center py-8 text-subtext">
          No token holder data available
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded bg-[var(--card2)] text-subtext hover:bg-[var(--card-hover)] disabled:opacity-50"
          >
            <ChevronLeftIcon size={20} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === page
                  ? 'bg-[var(--primary)] text-black'
                  : 'bg-[var(--card2)] text-subtext hover:bg-[var(--card-hover)]'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-[var(--card2)] text-subtext hover:bg-[var(--card-hover)] disabled:opacity-50"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenHolders;