import { GetServerSideProps } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import 'chartjs-adapter-date-fns';
import {
  ArrowUpDownIcon,
  Globe,
  Twitter,
  Send as Telegram,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import TradingViewChart from '@/components/charts/TradingViewChart';
import {
  useCurrentTokenPrice,
  useTokenLiquidity,
  useCalcBuyReturn,
  useCalcSellReturn,
  useBuyTokens,
  useSellTokens,
  useUserBalance,
  useTokenAllowance,
  useApproveTokens,
  formatAmountV2,
  useApproveBuyTokens,
} from '@/utils/blockchainUtils';
import { getTokenInfoAndTransactions, getTokenUSDPriceHistory, getTokenHolders, getTokenLiquidityEvents, getTokenHoldersCount } from '@/utils/api';
import { formatTimestamp, formatAmount } from '@/utils/blockchainUtils';
import { parseUnits, formatUnits } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import ShareButton from '@/components/ui/ShareButton';
import SEO from '@/components/seo/SEO';
import { TokenWithTransactions } from '@/interface/types';
import Spinner from '@/components/ui/Spinner';
import { Tab } from '@headlessui/react';

import TransactionHistory from '@/components/TokenDetails/TransactionHistory';
import TokenHolders from '@/components/TokenDetails/TokenHolders';
import TokenInfo from '@/components/TokenDetails/TokenInfo';
import Chats from '@/components/TokenDetails/Chats';
// import OGPreview from '@/components/OGPreview'
import dotenv from 'dotenv';

dotenv.config();


const BONDING_CURVE_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_BONDING_CURVE_MANAGER_ADDRESS as `0x${string}`;

interface TokenDetailProps {
  initialTokenInfo: TokenWithTransactions;
  initialPriceHistory: any[];
  initialHolders: any[];
}

// just to filter and count holders
const getFilteredHoldersCount = (holders: any[], tokenAddress: string) => {
  return holders.filter(holder => 
    holder.address.toLowerCase() !== tokenAddress.toLowerCase()
  ).length;
};

// const TokenDetail: React.FC = () => {
  const TokenDetail: React.FC<TokenDetailProps> = ({ initialTokenInfo }) => {

  const router = useRouter();
  const { address } = router.query;
  const { address: userAddress } = useAccount();

  const [isApproved, setIsApproved] = useState(false);
  const [isBuyApproved, setIsBuyApproved] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenWithTransactions>(initialTokenInfo);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);
  const [fromToken, setFromToken] = useState({ symbol: '$AIMG', amount: '' });
  const [toToken, setToToken] = useState({ symbol: '', amount: '' });
  const [isSwapped, setIsSwapped] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [ethBalance, setEthBalance] = useState('0.000');
  const [tokenBalance, setTokenBalance] = useState('0.000');
  const [actionButtonText, setActionButtonText] = useState('Buy');
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();


  //holders
  const [tokenHolders, setTokenHolders] = useState<Awaited<ReturnType<typeof getTokenHolders>>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [holdersPerPage] = useState(10);

  //confirm
  const { data: transactionReceipt, isError: transactionError, isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: transactionHash,
    confirmations: 2,
  });

  const [debouncedFromAmount] = useDebounce(fromToken.amount, 300);

  const { data: currentPrice, refetch: refetchCurrentPrice } = useCurrentTokenPrice(address as `0x${string}`);
  const { data: liquidityData, refetch: refetchLiquidity } = useTokenLiquidity(address as `0x${string}`);

  const { data: buyReturnData, isLoading: isBuyCalculating } = useCalcBuyReturn(address as `0x${string}`, parseUnits(debouncedFromAmount || '0', 18));
  const { data: sellReturnData, isLoading: isSellCalculating } = useCalcSellReturn(address as `0x${string}`, parseUnits(debouncedFromAmount || '0', 18));

  const { ethBalance: fetchedEthBalance, tokenBalance: fetchedTokenBalance, refetch: refetchUserBalance } = useUserBalance(userAddress as `0x${string}`, address as `0x${string}`);
  const { data: tokenAllowance } = useTokenAllowance(address as `0x${string}`, userAddress as `0x${string}`, BONDING_CURVE_MANAGER_ADDRESS);
  const { data: buyTokenAllowance } = useTokenAllowance(userAddress as `0x${string}`, address as `0x${string}`, BONDING_CURVE_MANAGER_ADDRESS);

  const { buyTokens } = useBuyTokens();
  const { sellTokens } = useSellTokens();
  const { approveTokens } = useApproveTokens();
  const { approveBuyTokens, isBuyApproval } = useApproveBuyTokens();

  const [liquidityEvents, setLiquidityEvents] = useState<any>(null);

  const [refreshCounter, setRefreshCounter] = useState(0);

  // Add state for holders count
  const [holdersCount, setHoldersCount] = useState<number>(0);


  const fetchTokenData = useCallback(
    async (page: number) => {
      try {
        const data = await getTokenInfoAndTransactions(address as string, page, 10);
        setTokenInfo(data);
        setTransactions(data.transactions.data);
        setTotalTransactionPages(data.transactions.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    },
    [address]
  );

  const fetchHistoricalPriceData = useCallback(async () => {
    try {
      const historicalData = await getTokenUSDPriceHistory(address as string);
      if (Array.isArray(historicalData) && historicalData.length > 0) {
        const formattedData = historicalData.map((item, index, arr) => {
          const prevItem = arr[index - 1] || item;
          return {
            time: new Date(item.timestamp).getTime() / 1000,
            open: parseFloat(prevItem.tokenPriceUSD),
            high: Math.max(parseFloat(prevItem.tokenPriceUSD), parseFloat(item.tokenPriceUSD)),
            low: Math.min(parseFloat(prevItem.tokenPriceUSD), parseFloat(item.tokenPriceUSD)),
            close: parseFloat(item.tokenPriceUSD),
          };
        });
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching historical price data:', error);
      setChartError('Failed to load chart data');
    }
  }, [address]);

  const fetchTokenHolders = async () => {
    if (address) {
      try {
        const holders = await getTokenHolders(address as string);
        setTokenHolders(holders);
      } catch (error) {
        console.error('Error fetching token holders:', error);
        toast.error('Failed to fetch token holders');
      }
    }
  };

  const indexOfLastHolder = currentPage * holdersPerPage;
  const indexOfFirstHolder = indexOfLastHolder - holdersPerPage;
  const currentHolders = tokenHolders.slice(indexOfFirstHolder, indexOfLastHolder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const fetchAllData = useCallback(async () => {
    if (address) {
      try {
        const [, , holdersData] = await Promise.all([
          fetchTokenData(transactionPage),
          fetchHistoricalPriceData(),
          getTokenHoldersCount(address as string)
        ]);

        setHoldersCount(holdersData.token_holders_count);
        refetchCurrentPrice();
        refetchLiquidity();
        fetchTokenHolders();
        refetchUserBalance();

        try {
          const events = await getTokenLiquidityEvents(tokenInfo.id);
          setLiquidityEvents(events);
        } catch (error) {
          console.error('Error fetching liquidity events:', error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  }, [address, transactionPage, fetchTokenData, fetchHistoricalPriceData, tokenInfo.id, refetchCurrentPrice, refetchLiquidity, refetchUserBalance]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (tokenAllowance !== undefined && address) {
      setIsApproved(tokenAllowance > 0);
    }
  }, [tokenAllowance, address]);

  useEffect(() => {
    if (buyTokenAllowance !== undefined && address && isBuyApproval) {
      setIsBuyApproved(buyTokenAllowance > 0);
    }
  }, [buyTokenAllowance, address, isBuyApproval]);

  useEffect(() => {
    if (fetchedEthBalance) {
      setEthBalance(parseFloat(formatUnits(fetchedEthBalance, 18)).toFixed(3));
    }
    if (fetchedTokenBalance) {
      setTokenBalance(parseFloat(formatUnits(fetchedTokenBalance, 18)).toFixed(3));
    }
  }, [fetchedEthBalance, fetchedTokenBalance]);

  useEffect(() => {
    if (transactionReceipt && !transactionError) {
      if (isSwapped) {
        if (!isApproved) {
          setIsApproved(true);
          toast.success('Token approval successful');
        } else {
          toast.success('Tokens sold successfully');
        }
      } else {
        if (!isBuyApproved && isBuyApproval) {
          setIsBuyApproved(true);
          toast.success('Token buy approval successful');
        }else {
          toast.success('Tokens bought successfully');
        }
      }
      fetchAllData();
      setIsTransacting(false);
      setRefreshCounter(prev => prev + 1);
    } else if (transactionError) {
      toast.error('Transaction failed');
      setIsTransacting(false);
    }
  }, [transactionReceipt, transactionError, isSwapped, isApproved, isBuyApproved, isBuyApproval, fetchAllData]);

  useEffect(() => {
    if (debouncedFromAmount) {
      setIsCalculating(true);
      if (isSwapped) {
        // Selling tokens
        if (sellReturnData !== undefined && !isSellCalculating) {
          const ethAmount = formatUnits(sellReturnData, 18);
          setToToken((prev) => ({ ...prev, amount: ethAmount }));
          setIsCalculating(false);
        }
      } else {
        // Buying tokens
        if (buyReturnData !== undefined && !isBuyCalculating) {
          const tokenAmount = formatUnits(buyReturnData, 18);
          setToToken((prev) => ({ ...prev, amount: tokenAmount }));
          setIsCalculating(false);
        }
      }
    } else {
      setToToken((prev) => ({ ...prev, amount: '' }));
      setIsCalculating(false);
    }
  }, [debouncedFromAmount, buyReturnData, sellReturnData, isSwapped, isBuyCalculating, isSellCalculating]);

  useEffect(() => {
    setActionButtonText(isSwapped ? (isApproved ? 'Sell' : 'Approve') : ((isBuyApproved || !isBuyApproval) ? 'Buy' : 'Approve'));
  }, [isSwapped, isApproved, isBuyApproved, isBuyApproval]);

  const handleSwap = useCallback(() => {
    setIsSwapped((prev) => !prev);
    setFromToken((prev) => ({
      symbol: prev.symbol === '$AIMG' ? tokenInfo.symbol : '$AIMG',
      amount: '',
    }));
    setToToken((prev) => ({
      symbol: prev.symbol === '$AIMG' ? tokenInfo.symbol : '$AIMG',
      amount: '',
    }));
  }, [tokenInfo]);

  const handleFromAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && !/^\d+(\.\d*)?$/.test(e.target.value)) return;
    setFromToken((prev) => ({ ...prev, amount: e.target.value }));
    setIsCalculating(true);
  }, []);

  const handleAction = useCallback(async () => {
    if (!address || !fromToken.amount || !userAddress) {
      toast.error('Missing required information');
      return;
    }

    const amount = parseUnits(fromToken.amount, 18);
    setIsTransacting(true);

    try {
      let txHash;
      if (isSwapped) {
        if (!isApproved) {
          txHash = await approveTokens(address as `0x${string}`);
        } else {
          txHash = await sellTokens(address as `0x${string}`, amount);
        }
      } else {
        if (!isBuyApproved && isBuyApproval) {
          txHash = await approveBuyTokens(address as `0x${string}`);
        } else {
          txHash = await buyTokens(address as `0x${string}`, amount);
        }
      }
      console.log('Transaction hash:', txHash);
      setTransactionHash(txHash);
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed to initiate: ' + (error as Error).message);
      setIsTransacting(false);
    }
  }, [address, fromToken.amount, userAddress, isSwapped, isApproved, isBuyApproved, isBuyApproval, approveTokens, sellTokens, buyTokens]);

  useEffect(() => {
    if (!isWaiting && !transactionError) {
      setIsTransacting(false);
      setTransactionHash(undefined);
    }
  }, [isWaiting, transactionError]);

  const handlePageChange = useCallback((newPage: number) => {
    setTransactionPage(newPage);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const handleMaxClick = () => {
    if (isSwapped) {
      // For token balance, use the exact balance without formatting
      if (fetchedTokenBalance) {
        const exactTokenBalance = formatUnits(fetchedTokenBalance, 18);
        setFromToken(prev => ({ ...prev, amount: exactTokenBalance }));
      }
    } else {
      // For ETH balance, use 95% of the balance to reserve for gas
      if (fetchedEthBalance) {
        const exactEthBalance = formatUnits(fetchedEthBalance, 18);
        const maxEthAmount = (parseFloat(exactEthBalance) * 0.95).toString();
        setFromToken(prev => ({ ...prev, amount: maxEthAmount }));
      }
    }
  };

  if (!tokenInfo) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="large" />
        </div>
      </Layout>
    );
  }

  // const calculateProgress = (currentLiquidity: bigint): number => {
  //   const liquidityInEth = parseFloat(formatUnits(currentLiquidity, 18));
  //   const target = Number(process.env.NEXT_PUBLIC_DEX_TARGET);
  //   const progress = (liquidityInEth / target) * 100;
  //   return Math.min(progress, 100);
  // };

  return (
    <Layout>
      <SEO token={tokenInfo} />
      <div className="md:shine-overlay"></div>
      <div className="">
        {/* Right Column */}
        <div className="space-y-2.5 lg:mb-2.5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            {/* Token Info Header (shown only on desktop) */}
            <div className="card p-5">
              <TokenInfo 
                tokenInfo={tokenInfo} 
                showHeader={true} 
                refreshTrigger={refreshCounter}
                liquidityEvents={liquidityEvents}
                holdersCount={holdersCount}
              />
            </div>

            {/* Quick Actions (Swap) Section - Desktop Only */}
            <div className="hidden card p-5">
              <h2 className="text-base font-bold mb-5 text-title">Buy {tokenInfo.symbol}</h2>
              <div className="">
                {/* From Input */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2.5">
                    <span className="text-subtext">From</span>
                    <span className="text-subtext">
                      Balance: {isSwapped ? tokenBalance : ethBalance}
                    </span>
                  </div>
                  <div className="flex items-center relative">
                    <input
                      type="text"
                      value={fromToken.amount}
                      onInput={handleFromAmountChange}
                      className="w-full form-input pr-40"
                      placeholder="0.00"
                      disabled={isTransacting}
                    />
                    <div className='absolute top-2 right-4'>
                      <button
                        onClick={handleMaxClick}
                        className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] px-2 py-1 rounded transition-colors"
                      >
                        MAX
                      </button>
                      <span className="text-subtext ml-1">{fromToken.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <button 
                  onClick={handleSwap}
                  className="mb-2.5 w-full flex justify-center text-subtext hover:text-[var(--primary)]"
                >
                  <ArrowUpDownIcon size={20} />
                </button>

                {/* To Input */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2.5">
                    <span className="text-subtext">To (Estimated)</span>
                    <span className="text-subtext">
                      Balance: {isSwapped ? ethBalance : tokenBalance}
                    </span>
                  </div>
                  <div className="flex items-center relative">
                    <input
                      type="text"
                      value={isCalculating ? 'Calculating...' : toToken.amount}
                      readOnly
                      className="w-full form-input pr-24"
                      placeholder="0.00"
                    />
                    <div className='absolute top-2 right-4'>
                      <span className="text-subtext ml">{toToken.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAction}
                  disabled={!fromToken.amount || isCalculating || isTransacting}
                  className="w-full btn-primary"
                >
                  {isTransacting ? 'Processing...' : actionButtonText}
                </button>
              </div>
            </div>

            {/* Price Chart Section */}
            <div className="lg:col-span-2 card p-5 flex flex-col">
              <h2 className="text-sm mb-5 text-gray-subtext">Price Chart (USD)</h2>
              <div className="bg-[var(--card2)] rounded-[10px] p-2 grow min-h-[256px]">
                <TradingViewChart 
                  data={chartData} 
                  liquidityEvents={liquidityEvents} 
                  tokenInfo={tokenInfo}
                />
              </div>
            </div>
          </div>
          {/* Left Column (2 cols wide) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            <div>
              <div className="card p-5">
                <h2 className="text-base font-bold mb-5 text-title">{isSwapped ? 'Sell' : 'Buy'} {tokenInfo.symbol}</h2>
                <div className="">
                  {/* From Input */}
                  <div className="mb-5">
                    <div className="flex justify-between text-sm mb-2.5">
                      <span className="text-subtext">From</span>
                      <span className="text-subtext">
                        Balance: {isSwapped ? tokenBalance : ethBalance}
                      </span>
                    </div>
                    <div className="flex items-center relative">
                      <input
                        type="text"
                        value={fromToken.amount}
                        onInput={handleFromAmountChange}
                        className="w-full form-input pr-40"
                        placeholder="0.00"
                        disabled={isTransacting}
                      />
                      <div className='absolute top-2 right-4'>
                        <button
                          onClick={handleMaxClick}
                          className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] px-2 py-1 rounded transition-colors"
                        >
                          MAX
                        </button>
                        <span className="text-subtext ml-1">{fromToken.symbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button 
                    onClick={handleSwap}
                    className="mb-2.5 w-full flex justify-center text-subtext hover:text-[var(--primary)]"
                  >
                    <ArrowUpDownIcon size={20} />
                  </button>

                  {/* To Input */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2.5">
                      <span className="text-subtext">To (Estimated)</span>
                      <span className="text-subtext">
                        Balance: {isSwapped ? ethBalance : tokenBalance}
                      </span>
                    </div>
                    <div className="flex items-center relative">
                      <input
                        type="text"
                        value={isCalculating ? 'Calculating...' : toToken.amount}
                        readOnly
                        className="w-full form-input pr-24"
                        placeholder="0.00"
                      />
                      <div className='absolute top-2 right-4'>
                        <span className="text-subtext ml">{toToken.symbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleAction}
                    disabled={!fromToken.amount || isCalculating || isTransacting}
                    className="w-full btn-primary"
                  >
                    {isTransacting ? 'Processing...' : actionButtonText}
                  </button>
                </div>
              </div>
            </div>

            <div className='lg:col-span-2 '>
              {/* Trades and Chat Tabs */}
              <div className="bg-[var(--card)] rounded-[10px] p-5">
                <Tab.Group>
                  <Tab.List className="flex card2 mb-5 !p-0">
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-[10px] py-2.5 text-sm font-medium leading-5 transition-colors
                        ${
                          selected
                            ? 'bg-primary text-black'
                            : 'text-subtext hover:bg-[var(--card-hover)] hover:text-white'
                        }`
                      }
                    >
                      Trades
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-[10px] py-2.5 text-sm font-medium leading-5 transition-colors
                        ${
                          selected
                            ? 'bg-primary text-black'
                            : 'text-subtext hover:bg-[var(--card-hover)] hover:text-white'
                        }`
                      }
                    >
                      Token Holder
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-[10px] py-2.5 text-sm font-medium leading-5 transition-colors
                        ${
                          selected
                            ? 'bg-primary text-black'
                            : 'text-subtext hover:bg-[var(--card-hover)] hover:text-white'
                        }`
                      }
                    >
                      Chat
                    </Tab>
                  </Tab.List>
                  <Tab.Panels>
                    <Tab.Panel>
                      <TransactionHistory
                        transactions={transactions}
                        transactionPage={transactionPage}
                        totalTransactionPages={totalTransactionPages}
                        tokenSymbol={tokenInfo.symbol}
                        handlePageChange={handlePageChange}
                      />
                    </Tab.Panel>
                    <Tab.Panel>
                      {/* Token Holders Section (Full Width) */}
                      <div className="bg-[var(--card)] rounded-lg">
                        <p className="mb-2.5 text-subtext">Token Holders</p>
                        <TokenHolders
                          tokenHolders={currentHolders}
                          currentPage={currentPage}
                          totalPages={Math.ceil(tokenHolders.length / holdersPerPage)}
                          tokenSymbol={tokenInfo.symbol}
                          creatorAddress={tokenInfo.creatorAddress}
                          tokenAddress={address as string}
                          onPageChange={paginate}
                          allHolders={tokenHolders}
                        />
                      </div>
                    </Tab.Panel>
                    <Tab.Panel>
                      <Chats tokenAddress={address as string} tokenInfo={tokenInfo} />
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

//simple server-side rendering  just to get token info for seo - nothing more - nothing else  
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { address } = context.params as { address: string };

  try {
    const tokenInfo = await getTokenInfoAndTransactions(address, 1, 1);

    return {
      props: {
        initialTokenInfo: tokenInfo,
      },
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    return {
      notFound: true,
    };
  }
};

export default TokenDetail;