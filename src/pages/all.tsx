import React, { useState, useCallback, useRef, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { Token, TokenWithLiquidityEvents, PaginatedResponse, PriceCache } from '@/interface/types';
import SortOptions, { SortOption } from '@/components/ui/SortOptions';
import { getAllTokensTrends, getTokensWithLiquidity, getRecentTokens, searchTokens, getTotalTokenCount, getVolumeRange, getCurrentPrice, getAllTokens } from '@/utils/api';
import Spinner from '@/components/ui/Spinner';
import TokenTable from '@/components/tokens/TokenTable';

const TOKENS_PER_PAGE = 100;

const TotalTokens: React.FC = () => {

  const [tokens, setTokens] = useState<PaginatedResponse<Token | TokenWithLiquidityEvents> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortOption>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Effect triggered. Current sort:', sort, 'Current page:', currentPage, 'Search:', searchQuery);
    fetchTokens();
  }, [currentPage, sort, searchQuery]);

  const fetchTokens = async () => {
    setIsLoading(true);
    setError(null);
    let fetchedTokens;

    try {
      if (searchQuery.trim()) {
        fetchedTokens = await searchTokens(searchQuery, currentPage, TOKENS_PER_PAGE);
      }else {
        fetchedTokens = await getAllTokens(currentPage, TOKENS_PER_PAGE);
      }
      const adjustedTokens: PaginatedResponse<Token | TokenWithLiquidityEvents> = {
        data: fetchedTokens.data || fetchedTokens.tokens || [],
        totalCount: fetchedTokens.totalCount,
        currentPage: fetchedTokens.currentPage || 1,
        totalPages: fetchedTokens.totalPages || 1,
        tokens: [],
        fullList: fetchedTokens.fullList
      };

      setTokens(adjustedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError('Failed to fetch tokens. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    console.log('Page changed:', page);
    setCurrentPage(page);
  };

  return (
    <Layout>
      {isLoading ? (
        <div className="flex justify-center items-center my-20">
          <Spinner size="medium" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 my-20">{error}</div>
      ) : tokens && tokens.data.length > 0 ? (
        <TokenTable
          tokens={tokens.data}
          currentPage={currentPage}
          totalPages={tokens?.totalPages || 1}
          onPageChange={handlePageChange}
          isEnded={sort === 'finalized'}
          itemsPerPage={TOKENS_PER_PAGE}
          isFullList={tokens?.fullList}
        />
      ) : (
        <div className="text-center text-white my-20">No tokens found matching your criteria.</div>
      )}
    </Layout>
  );
};

export default TotalTokens;