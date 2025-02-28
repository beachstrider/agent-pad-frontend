import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, ChevronDownIcon } from 'lucide-react';
import { formatTimestamp, formatAmountV3, shortenAddress } from '@/utils/blockchainUtils';
import { Transaction } from '@/interface/types';
import Image from 'next/image';
import dotenv from 'dotenv';

dotenv.config();

interface TransactionHistoryProps {
  transactions: Transaction[];
  transactionPage: number;
  totalTransactionPages: number;
  tokenSymbol: string;
  handlePageChange: (page: number) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  transactionPage,
  totalTransactionPages,
  tokenSymbol,
  handlePageChange,
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getPaginationRange = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 2) {
      return [1, 2, 3, '...', total];
    }

    if (current >= total - 1) {
      return [1, '...', total - 2, total - 1, total];
    }

    return [
      1,
      '...',
      current,
      '...',
      total
    ];
  };

  // Desktop view table
  const DesktopTable = () => (
    <table className="w-full text-left hidden md:table">
      <thead>
        <tr className="bg-[var(--primary-200)]">
          <th className="px-4 py-2 text-title font-normal">Maker</th>
          <th className="px-4 py-2 text-title font-normal">Type</th>
          <th className="px-4 py-2 text-title font-normal">$AIMG</th>
          <th className="px-4 py-2 text-title font-normal">{tokenSymbol}</th>
          <th className="px-4 py-2 text-title font-normal">Date</th>
          <th className="px-4 py-2 text-title font-normal">Tx</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx, index) => (
          <tr key={tx.id} className={`${index % 2 == 0 ? 'bg-grey2' : ''}`}>
            <td className="px-4 py-2">
              <a 
                href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}/address/${tx.senderAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-subtext hover:text-[var(--primary)] transition-colors"
              >
                {shortenAddress(tx.senderAddress)}
              </a>
            </td>
            <td className="px-4 py-2 text-subtext">{tx.type}</td>
            <td className="px-4 py-2 text-subtext">{formatAmountV3(tx.ethAmount)}</td>
            <td className="px-4 py-2 text-subtext">{formatAmountV3(tx.tokenAmount)}</td>
            <td className="px-4 py-2 text-subtext">{formatTimestamp(tx.timestamp)}</td>
            <td className="px-4 py-2">
              <a
                href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-subtext hover:text-[var(--primary)] text-sm transition-colors"
              >
                {tx.txHash.slice(0, 8)}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Mobile view table
  const MobileTable = () => (
    <div className="md:hidden">
      {transactions.map((tx) => (
        <div key={tx.id} className="mb-2">
          <div 
            className="bg-[var(--card2)] p-3 rounded-lg cursor-pointer"
            onClick={() => setExpandedRow(expandedRow === tx.id ? null : tx.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-subtext">{tx.type}</span>
                  <ChevronDownIcon 
                    size={16} 
                    className={`text-subtext transition-transform ${
                      expandedRow === tx.id ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-subtext">{formatAmountV3(tx.ethAmount)} $AIMG</span>
                  <span className="text-subtext">{formatAmountV3(tx.tokenAmount)} {tokenSymbol}</span>
                </div>
              </div>
            </div>

            {expandedRow === tx.id && (
              <div className="mt-3 pt-3 border-t border-[var(--card-hover)] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-subtext">Maker:</span>
                  <a 
                    href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}/address/${tx.senderAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-subtext hover:text-[var(--primary)]"
                  >
                    {shortenAddress(tx.senderAddress)}
                  </a>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-subtext">Date:</span>
                  <span className="text-subtext">{formatTimestamp(tx.timestamp)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-subtext">Transaction:</span>
                  <a
                    href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-subtext hover:text-[var(--primary)] flex items-center gap-1"
                  >
                    View <ExternalLinkIcon size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      <div className='rounded-[10px] overflow-hidden'>
        <DesktopTable />
        <MobileTable />
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-subtext">
          No transactions yet
        </div>
      )}

      {totalTransactionPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={transactionPage === 1}
            className="btn-pagination"
          >
            <Image src="/paginate/first.svg" alt="First" width="24" height="24"  />
          </button>
          <button
            onClick={() => handlePageChange(transactionPage - 1)}
            disabled={transactionPage === 1}
            className="btn-pagination"
          >
            <Image src="/paginate/prev.svg" alt="Prev" width="24" height="24"  />
          </button>

          {getPaginationRange(transactionPage, totalTransactionPages).map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-subtext">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  className={`btn-pagination ${
                    transactionPage === page
                      ? 'active'
                      : ''
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() => handlePageChange(transactionPage + 1)}
            disabled={transactionPage === totalTransactionPages}
            className="btn-pagination"
          >
            <Image src="/paginate/next.svg" alt="Next" width="24" height="24"  />
          </button>
          <button
            onClick={() => handlePageChange(totalTransactionPages)}
            disabled={transactionPage === totalTransactionPages}
            className="btn-pagination"
          >
            <Image src="/paginate/last.svg" alt="Last" width="24" height="24"  />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;