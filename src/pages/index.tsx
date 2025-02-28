import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import TokenList from '@/components/tokens/TokenList';
import SearchFilter from '@/components/ui/SearchFilter';
import HowItWorksPopup from '@/components/notifications/HowItWorksPopup';
import SortOptions, { SortOption } from '@/components/ui/SortOptions';
import { getAllTokensTrends, getTokensWithLiquidity, getRecentTokens, searchTokens, getTotalTokenCount, getVolumeRange, getCurrentPrice } from '@/utils/api';
import { Token, TokenWithLiquidityEvents, PaginatedResponse, PriceCache } from '@/interface/types';
import SEO from '@/components/seo/SEO';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { Switch } from '@/components/ui/switch';
import Spinner from '@/components/ui/Spinner';
import { useRouter } from 'next/router';
import { formatAmountV3 } from '@/utils/blockchainUtils';
import Image from 'next/image';
import Link from 'next/link';

const TOKENS_PER_PAGE = 3;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let priceCache: PriceCache | null = null;

const Home: React.FC = () => {
  const [tokens, setTokens] = useState<PaginatedResponse<Token | TokenWithLiquidityEvents> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortOption>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [noRecentTokens, setNoRecentTokens] = useState(false);
  const [noLiquidityTokens, setNoLiquidityTokens] = useState(false);
  const [showNewTokens, setShowNewTokens] = useState(false);
  const [newTokensBuffer, setNewTokensBuffer] = useState<Token[]>([]);
  const [displayedNewTokens, setDisplayedNewTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { newTokens } = useWebSocket();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const router = useRouter();
  const [allTrendingTokens, setAllTrendingTokens] = useState<Token[]>([]);
  const [totalTokens, setTotalTokens] = useState<number>(-1);
  const [volume24h, setVolume24h] = useState<number>(-1);
  const [flrPrice, setFlrPrice] = useState<string>('0');

  useEffect(() => {
    console.log('Effect triggered. Current sort:', sort, 'Current page:', currentPage, 'Search:', searchQuery);
    fetchTokens();
  }, [currentPage, sort, searchQuery]);

  useEffect(() => {
    // console.log('New tokens received:', newTokens);
    if (newTokens.length > 0) {
      if (showNewTokens) {
        setTokens(prevTokens => {
          if (!prevTokens) return null;
          const newUniqueTokens = newTokens.filter(newToken =>
            !prevTokens.data.some(existingToken => existingToken.id === newToken.id) &&
            !displayedNewTokens.some(displayedToken => displayedToken.id === newToken.id)
          );
          // console.log('New unique tokens to add:', newUniqueTokens);
          setDisplayedNewTokens(prev => [...prev, ...newUniqueTokens]);
          return {
            ...prevTokens,
            data: [...newUniqueTokens, ...prevTokens.data],
            totalCount: prevTokens.totalCount + newUniqueTokens.length
          };
        });
      } else {
        setNewTokensBuffer(prev => {
          const uniqueNewTokens = newTokens.filter(newToken =>
            !prev.some(bufferToken => bufferToken.id === newToken.id)
          );
          // console.log('New tokens added to buffer:', uniqueNewTokens);
          return [...uniqueNewTokens, ...prev];
        });
      }
    }
  }, [newTokens, showNewTokens]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // First get the $AIMG price
        let currentPrice: string;
        
        // Check cache
        if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
          currentPrice = priceCache.price;
        } else {
          // Fetch new price
          currentPrice = await getCurrentPrice();
          // Update cache
          priceCache = {
            price: currentPrice,
            timestamp: Date.now()
          };
        }
        setFlrPrice(currentPrice);

        // Now fetch other stats
        const [tokenCount, volumeData] = await Promise.all([
          getTotalTokenCount(),
          getVolumeRange(24)
        ]);
        
        setTotalTokens(tokenCount.totalTokens);
        setVolume24h(volumeData.totalVolume);
        console.log('tvolume:', volumeData.totalVolume);
      } catch (error) {
        setTotalTokens(0);
        setVolume24h(0);
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    setIsLoading(true);
    setNoRecentTokens(false);
    setNoLiquidityTokens(false);
    setError(null);
    let fetchedTokens;

    try {
      if (searchQuery.trim()) {
        fetchedTokens = await searchTokens(searchQuery, currentPage, TOKENS_PER_PAGE);
      } else {
        switch (sort) {
          case 'trending':
          case 'marketcap':
            // Handle both trending and marketcap cases
            if (allTrendingTokens.length === 0) {
              const trendingTokens = await getAllTokensTrends();
              setAllTrendingTokens(trendingTokens);
              
              if (sort === 'marketcap') {
                fetchedTokens = {
                  data: trendingTokens,
                  totalCount: trendingTokens.length,
                  currentPage: currentPage,
                  totalPages: Math.ceil(trendingTokens.length / TOKENS_PER_PAGE),
                  fullList: true
                };
              } else {
                const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
                const endIndex = startIndex + TOKENS_PER_PAGE;
                const paginatedTokens = trendingTokens.slice(startIndex, endIndex);
                
                fetchedTokens = {
                  data: paginatedTokens,
                  totalCount: trendingTokens.length,
                  currentPage: currentPage,
                  totalPages: Math.ceil(trendingTokens.length / TOKENS_PER_PAGE)
                };
              }
            } else {
              if (sort === 'marketcap') {
                fetchedTokens = {
                  data: allTrendingTokens,
                  totalCount: allTrendingTokens.length,
                  currentPage: currentPage,
                  totalPages: Math.ceil(allTrendingTokens.length / TOKENS_PER_PAGE),
                  fullList: true
                };
              } else {
                const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
                const endIndex = startIndex + TOKENS_PER_PAGE;
                const paginatedTokens = allTrendingTokens.slice(startIndex, endIndex);
                
                fetchedTokens = {
                  data: paginatedTokens,
                  totalCount: allTrendingTokens.length,
                  currentPage: currentPage,
                  totalPages: Math.ceil(allTrendingTokens.length / TOKENS_PER_PAGE)
                };
              }
            }
            break;

          case 'new':
            fetchedTokens = await getRecentTokens(currentPage, TOKENS_PER_PAGE, 1);
            if (fetchedTokens === null) {
              setNoRecentTokens(true);
              fetchedTokens = { data: [], totalCount: 0, currentPage: 1, totalPages: 1 };
            }
            break;
          case 'finalized':
            try {
              fetchedTokens = await getTokensWithLiquidity(currentPage, TOKENS_PER_PAGE);
            } catch (liquidityError) {
              if (liquidityError instanceof Error && 'response' in liquidityError && (liquidityError.response as any).status === 404) {
                setNoLiquidityTokens(true);
                fetchedTokens = { data: [], totalCount: 0, currentPage: 1, totalPages: 1 };
              } else {
                throw liquidityError;
              }
            }
            break;
          default:
            fetchedTokens = { data: [], totalCount: 0, currentPage: 1, totalPages: 1 };
        }
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

  // const filteredTokens = useMemo(() => {
  //   if (!tokens || !tokens.data) return [];
  //   return tokens.data.filter(token =>
  //     token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  //   );
  // }, [tokens, searchQuery]);

  const handleSearch = (query: string) => {
    console.log('Search query updated:', query);
    if (query !== searchQuery) {
      setSearchQuery(query);
      if (query.trim()) {
        setCurrentPage(1);
      }
      // if (!query.trim()) {
      //   fetchTokens();
      // }
    }
  };

  const handleSort = async (option: SortOption) => {
    console.log('Sort option changed:', option);
    setIsLoading(true);
    
    try {
      // If switching to marketcap and we don't have trending tokens, fetch them
      if (option === 'marketcap' && allTrendingTokens.length === 0) {
        const trendingTokens = await getAllTokensTrends();
        setAllTrendingTokens(trendingTokens);
      }
      
      // Only clear trending tokens when switching to 'new' or 'finalized'
      if (option === 'new' || option === 'finalized') {
        setAllTrendingTokens([]);
      }
      
      setSort(option);
      setCurrentPage(1);
      setSearchQuery('');
    } catch (error) {
      console.error('Error handling sort:', error);
      setError('Failed to sort tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    console.log('Page changed:', page);
    setCurrentPage(page);
  };

  const toggleNewTokens = () => {
    setShowNewTokens(prev => {
      // console.log('Toggling new tokens. Current state:', prev);
      if (prev) {
        // Turning off
        setTokens(oldTokens => {
          if (!oldTokens) return null;
          const updatedTokens = {
            ...oldTokens,
            data: oldTokens.data.filter(token => !displayedNewTokens.includes(token)),
            totalCount: oldTokens.totalCount - displayedNewTokens.length
          };
          // console.log('Updated tokens after turning off:', updatedTokens);
          return updatedTokens;
        });
        setNewTokensBuffer(displayedNewTokens);
        setDisplayedNewTokens([]);
      } else {
        // Turning on
        setTokens(oldTokens => {
          if (!oldTokens) return null;
          const updatedTokens = {
            ...oldTokens,
            data: [...newTokensBuffer, ...oldTokens.data],
            totalCount: oldTokens.totalCount + newTokensBuffer.length
          };
          // console.log('Updated tokens after turning on:', updatedTokens);
          return updatedTokens;
        });
        setDisplayedNewTokens(newTokensBuffer);
        setNewTokensBuffer([]);
      }
      return !prev;
    });
  };

  const handleLaunchToken = () => {
    router.push('/create');
  };

  const formatUsdValue = (flrAmount: string): string => {
    const flrValue = Number(flrAmount) / 10**18;
    const usdValue = flrValue * parseFloat(flrPrice);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdValue);
  };

  // console.log('Rendering component. isLoading:', isLoading, 'tokens:', tokens, 'filteredTokens:', filteredTokens);

  return (
    <Layout>
      <SEO
        title="Create and Trade Memecoins Easily on Agent Pad."
        description="The ultimate platform for launching and trading memecoins on Shibarium. Create your own tokens effortlessly and engage in fair, dynamic trading."
        image="seo/home.jpg"
      />
      <HowItWorksPopup isVisible={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <div className='grid w-full grid-cols-1 xl:grid-cols-2 gap-6'>
        <div className="py-5 flex items-center mx-auto">
          <div className=''>
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-title">LAUNCH YOUR AI AGENT</h2>
              <div className='text-subtext'>
                <p>Your gateway to fair, transparent token launches on the Flare network.</p>
                <p>No presales, no team allocations just community-driven growth and secure liquidity.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleLaunchToken}
                  className="w-full bg-[var(--primary)] text-black px-3 sm:px-6 py-3 font-semibold rounded-[5px] hover:bg-[var(--primary-hover)] transition-colors text-base"
                >
                  Launch your token
                </button>
                <button 
                  onClick={() => setShowHowItWorks(true)} 
                  className="w-full border border-white text-white px-3 sm:px-6 py-3 rounded-[5px] font-semibold hover:bg-gray-100 hover:text-grey transition-colors text-base"
                >
                  Learn more
                </button>
                
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <Link href="/all" className=''>
                <div className="border border-stroke hover:border-white/50 block-gradient px-1 sm:px-3 py-2 rounded-lg text-center ease-in-out duration-300">
                  <div className="text-sm text-subtext">Total Tokens Created</div>
                  <div className="hover:underline underline-offset-4">
                    {totalTokens >= 0 ? <span className='text-xl text-title font-bold'>{totalTokens.toLocaleString()}</span> : 'Loading...'}
                  </div>
                </div>
              </Link>
              
              <div className="border border-stroke block-gradient px-1 sm:px-3 py-2 rounded-lg text-center">
                <div className="text-sm text-subtext">24h Volume</div>
                <div className="">
                  {volume24h >= 0 && flrPrice !== '0' ? (
                    <span className='text-xl text-title font-bold'>{formatUsdValue(volume24h.toString())}</span>
                  ) : (
                    'Loading...'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='flex justify-center'>
          <Image
              src="/back/home.png"
              alt="Home Back"
              width={782}
              height={630}
            />
        </div>
      </div>

      <div className="md:flex items-center py-5 border-b-[1px] border-grey justify-between">
        <div className='mb-5 md:mb-0'>
          <SortOptions onSort={handleSort} currentSort={sort} />
        </div>
        <div className='max-w-none md:max-w-xl'>
          <SearchFilter onSearch={handleSearch} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center my-20">
          <Spinner size="medium" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 my-20">{error}</div>
      ) : noRecentTokens ? (
        <div className="text-center text-white my-20">No tokens created in the last 24 hours. Check back soon.</div>
      ) : noLiquidityTokens ? (
        <div className="text-center text-white my-20">No tokens Listed Yet.</div>
      ) : tokens && tokens.data.length > 0 ? (
        <TokenList
          tokens={tokens.data}
          currentPage={currentPage}
          totalPages={tokens?.totalPages || 1}
          onPageChange={handlePageChange}
          isEnded={sort === 'finalized'}
          sortType={sort}
          itemsPerPage={TOKENS_PER_PAGE}
          isFullList={tokens?.fullList}
        />
      ) : (
        <div className="text-center text-white my-20">No tokens found matching your criteria.</div>
      )}
    </Layout>
  );
};

export default Home;