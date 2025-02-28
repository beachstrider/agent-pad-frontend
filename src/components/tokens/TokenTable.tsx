import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import TokenCard from './TokenCard';
import { Token, TokenWithLiquidityEvents } from '@/interface/types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import LoadingBar from '@/components/ui/LoadingBar';
import { SortOption } from '../ui/SortOptions';
import Image from 'next/image';
import { formatAddressV3, formatTimestamp } from '@/utils/blockchainUtils';
import { IoIosCopy } from "react-icons/io";
import { MdCheck } from "react-icons/md";

interface TokenListProps {
  tokens: (Token | TokenWithLiquidityEvents)[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isEnded: boolean;
  itemsPerPage: number;
  isFullList?: boolean;
}

interface TokenLiquidityData {
  [key: string]: bigint;
}

interface TableInfo {
  label: string,
  key: string,
  width: string,
  formatter: (token: Token) => ReactNode;
}
const tableInfo: TableInfo[] = [
  {
    label: 'AI Agents',
    key: 'name',
    width: '60%',
    formatter: (token: Token): ReactNode => {
      const [isCopied, setIsCopied] = useState(false);
      const handleCopy = async (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCopied) return;
        setIsCopied(true);
        await navigator.clipboard.writeText(token.address);
        setTimeout(() => setIsCopied(false), 2000);
      }

      return <div className="flex flex-row items-center gap-2">
        <img 
          src={token.logo} 
          alt={token.name} 
          className="w-[56px] h-[56px] object-cover rounded-full"
        />
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-2">
            <p className="text-title">{token.name}</p>
            <p className="text-xs">${token.symbol}</p>
          </div>
          <div className="flex flex-row items-center gap-2">
            <div onClick={handleCopy} className="rounded-lg border border-stroke px-2 py-1 text-nowrap flex flex-row items-center gap-2 cursor-pointer transition-opacity hover:opacity-80">
              <p className="text-xs text-tertiary">{formatAddressV3(token.address)}</p>
              <button>{
                !isCopied ? <span><IoIosCopy /></span>
                : <span className='text-[#06cf9c]'><MdCheck size={16} /></span>
              }</button>
            </div>
            <div className="rounded-lg border border-stroke px-2 py-1 text-nowrap flex flex-row items-center">
              <p className="text-xs text-tertiary">Productivity</p>
            </div>
          </div>
        </div>
      </div>
    }
  },
  {
    label: 'Market Cap',
    key: 'marketcap',
    width: '10%',
    formatter: (token: Token): ReactNode => {
      return '$272.77k'
    }
  },
  {
    label: 'Token Price',
    key: 'price',
    width: '10%',
    formatter: (token: Token): ReactNode => {
      return '$0.000272'
    }
  },
  {
    label: 'Created At',
    key: 'createdAt',
    width: '10%',
    formatter: (token: Token): ReactNode => {
      return formatTimestamp(token.createdAt);
    }
  },
  {
    label: 'Created By',
    key: 'creatorAddress',
    width: '10%',
    formatter: (token: Token) => <div className='flex items-center gap-2'>
        <img src={`https://effigy.im/a/${token.creatorAddress}.svg`} alt="Avatar" className="w-[32px] h-[32px] object-cover rounded-full" />
        { formatAddressV3(token.creatorAddress) }
      </div>
  },
]
const TokenTable: React.FC<TokenListProps> = ({ 
  tokens, 
  currentPage, 
  totalPages, 
  onPageChange, 
  isEnded,
  itemsPerPage,
  isFullList
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string | null, direction: string}>({ key: null, direction: 'ascending' });

  const handleTokenClick = async (tokenAddress: string) => {
    setIsLoading(true);
    await router.push(`/token/${tokenAddress}`);
    setIsLoading(false);
  };

  // Sort and paginate tokens
  const displayTokens = useMemo(() => {
    let sortedTokens = [...tokens];

    // If we're handling the full list, paginate here
    if (isFullList) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return sortedTokens.slice(startIndex, endIndex);
    }

    return sortedTokens;
  }, [tokens, currentPage, itemsPerPage, isFullList]);

  const requestSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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

  return (
    <>
      <div className="my-5 overflow-auto">
        <table className='w-full'>
          <thead>
            <tr>
              {tableInfo.map((info, index) => (
                <th key={index} onClick={() => requestSort(info.key)} className='text-stroke text-xs cursor-pointer text-left p-4' style={{ width: info.width }}>
                  {info.label}
                  {sortConfig.key === info.key && (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayTokens.map((token: Token, index) => (
              <tr key={index} className='cursor-pointer border-t-1 border-grey' onClick={() => handleTokenClick(token.address)}>
                {Object.values(tableInfo).map((info, index) => (
                  <td key={index} className='p-4 text-subtext text-sm'>{info.formatter(token)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingBar size="large" />
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-5 py-6">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            <Image src="/paginate/first.svg" alt="First" width="24" height="24"  />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            <Image src="/paginate/prev.svg" alt="Prev" width="24" height="24"  />
          </button>
          
          <div className="flex items-center gap-5">
            {getPaginationRange(currentPage, totalPages).map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-1 text-subtext">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`btn-pagination ${
                      currentPage === page
                        ? 'active'
                        : ''
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            <Image src="/paginate/next.svg" alt="Next" width="24" height="24"  />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            <Image src="/paginate/last.svg" alt="Last" width="24" height="24"  />
          </button>
        </div>
      )}
    </>
  );
};

export default TokenTable;