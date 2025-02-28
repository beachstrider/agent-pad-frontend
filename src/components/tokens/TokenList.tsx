import React, { useState, useEffect, useMemo } from 'react';
import TokenCard from './TokenCard';
import { Token, TokenWithLiquidityEvents } from '@/interface/types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import LoadingBar from '@/components/ui/LoadingBar';
import { SortOption } from '../ui/SortOptions';
import Image from 'next/image';

interface TokenListProps {
  tokens: (Token | TokenWithLiquidityEvents)[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isEnded: boolean;
  sortType: SortOption;
  itemsPerPage: number;
  isFullList?: boolean;
}

interface TokenLiquidityData {
  [key: string]: bigint;
}

const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  currentPage, 
  totalPages, 
  onPageChange, 
  isEnded,
  sortType,
  itemsPerPage,
  isFullList
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [liquidityData, setLiquidityData] = useState<TokenLiquidityData>({});

  const handleTokenClick = async (tokenAddress: string) => {
    setIsLoading(true);
    await router.push(`/token/${tokenAddress}`);
    setIsLoading(false);
  };

  const updateLiquidityData = (tokenAddress: string, amount: bigint) => {
    setLiquidityData(prev => ({
      ...prev,
      [tokenAddress]: amount
    }));
  };

  // Sort and paginate tokens
  const displayTokens = useMemo(() => {
    let sortedTokens = [...tokens];
    
    if (sortType === 'marketcap') {
      sortedTokens.sort((a, b) => {
        const liquidityA = liquidityData[a.address] || BigInt(0);
        const liquidityB = liquidityData[b.address] || BigInt(0);
        return liquidityB > liquidityA ? 1 : -1;
      });
    }

    // If we're handling the full list, paginate here
    if (isFullList) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return sortedTokens.slice(startIndex, endIndex);
    }

    return sortedTokens;
  }, [tokens, sortType, liquidityData, currentPage, itemsPerPage, isFullList]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-5">
        {displayTokens.map((token) => (
          <TokenCard 
            key={token.id} 
            token={token} 
            isEnded={isEnded} 
            onTokenClick={handleTokenClick}
            onLiquidityUpdate={(amount) => updateLiquidityData(token.address, amount)}
          />
        ))}
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

export default TokenList;