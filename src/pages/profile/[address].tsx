import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import Layout from '@/components/layout/Layout';
import { getTransactionsByAddress, getAllTokenAddresses, getTokensByCreator } from '@/utils/api';
import { Transaction, PaginatedResponse, Token } from '@/interface/types';
import { formatTimestamp, formatAddressV2, formatAmountV3, useERC20Balance, formatAddressV3 } from '@/utils/blockchainUtils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import SEO from '@/components/seo/SEO';
import LoadingBar from '@/components/ui/LoadingBar';
import Image from 'next/image';
import dotenv from 'dotenv';

dotenv.config();

interface TransactionResponse extends Omit<PaginatedResponse<Transaction>, 'data'> {
    transactions: Transaction[];
}

interface TokenBalanceItemProps {
  tokenAddress: string;
  symbol: string;
  userAddress: string;
  onClick: () => void;
}

const TokenBalanceItem: React.FC<TokenBalanceItemProps> = ({ tokenAddress, symbol, userAddress, onClick }) => {
  const { balance } = useERC20Balance(tokenAddress as `0x${string}`, userAddress as `0x${string}`);
  
  if (!balance || balance.toString() === '0') {
    return null;
  }

  const handleAddressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${process.env.NEXT_PUBLIC_BLOCKSCOUT_URL}/address/${tokenAddress}`, '_blank');
  };

  return (
    <div 
      className="bg-[var(--card)] rounded-lg p-4 cursor-pointer hover:bg-[var(--card-hover)] transition-colors duration-200"
      onClick={onClick}
    >
      <h3 className="text-sm font-semibold text-white mb-2">{symbol}</h3>
      <p className="text-subtext text-[10px] sm:text-xs">Balance: {formatAmountV3(balance.toString())}</p>
      <p className="text-subtext text-[10px] sm:text-xs mt-2">
        Address: 
        <span 
          className="text-[var(--primary)] hover:underline ml-1 cursor-pointer"
          onClick={handleAddressClick}
        >
          {formatAddressV2(tokenAddress)}
        </span>
      </p>
    </div>
  );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-center items-center space-x-2 mt-6">
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
      <div className="flex items-center space-x-1">
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`btn-pagination ${
                  currentPage === page
                    ? 'active'
                    : ''
                }`}
              >
                {page}
              </button>
            );
          } else if (
            page === currentPage - 2 ||
            page === currentPage + 2
          ) {
            return (
              <span key={page} className="text-subtext text-sm">
                ...
              </span>
            );
          }
          return null;
        })}
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
  );
};

interface TokenTabProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const TokenTab: React.FC<TokenTabProps> = ({ title, isActive, onClick }) => (
  <button
    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
      isActive
        ? 'bg-[var(--card)] text-white'
        : 'text-subtext hover:bg-[var(--card-hover)] hover:text-white'
    }`}
    onClick={onClick}
  >
    {title}
  </button>
);

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const { address: profileAddress } = router.query;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAddresses, setTokenAddresses] = useState<Array<{address: string, symbol: string}>>([]);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'held' | 'created'>('held');
  const [createdTokens, setCreatedTokens] = useState<Token[]>([]);
  const [createdTokensPage, setCreatedTokensPage] = useState(1);
  const [createdTokensTotalPages, setCreatedTokensTotalPages] = useState(1);

  const addressToUse = (profileAddress as string) || connectedAddress || '';

  const fetchTransactions = useCallback(async (address: string, page: number) => {
    setIsLoading(true);
    try {
        const response: TransactionResponse = await getTransactionsByAddress(address, page);
      setTransactions(response.transactions); // Change this line
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTokenAddresses = useCallback(async () => {
    try {
      const addresses = await getAllTokenAddresses();
      setTokenAddresses(addresses);
    } catch (error) {
      console.error('Error fetching token addresses:', error);
    }
  }, []);

  const fetchCreatedTokens = useCallback(async (creatorAddress: string, page: number) => {
    setIsLoading(true);
    try {
      const response = await getTokensByCreator(creatorAddress, page);
      setCreatedTokens(response.tokens);
      setCreatedTokensTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching created tokens:', error);
      setCreatedTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (addressToUse) {
      fetchTransactions(addressToUse, currentPage);
      fetchTokenAddresses();
      fetchCreatedTokens(addressToUse, createdTokensPage);
    }
  }, [addressToUse, currentPage, createdTokensPage, fetchTransactions, fetchTokenAddresses, fetchCreatedTokens]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getTokenSymbol = (tokenAddress: string) => {
    const token = tokenAddresses.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    return token ? token.symbol : 'Unknown';
  };

  const handleTokenClick = (tokenAddress: string) => {
    setIsTokenLoading(true);
    router.push(`/token/${tokenAddress}`).finally(() => {
      setIsTokenLoading(false);
    });
  };

  const handleCreatedTokensPageChange = (newPage: number) => {
    setCreatedTokensPage(newPage);
  };

  return (
    <Layout>
      <div className="md:shine-overlay"></div>
      <SEO 
        title={`${addressToUse ? `${formatAddressV3(addressToUse)}` : 'Your Profile'} - Agent Pad`}
        description={`View token holdings and transactions for ${formatAddressV3(addressToUse)}.`}
        image="seo/profile.jpg"
      />
      <div className='md:flex gap-2 grow'>
        <div className='p-5 flex flex-col gap-5'>
          <div className=' mx-auto'>
            <p className='text-xl font-title'>MY PROFILE</p>
            <Image
              className='rounded-[26px]'
              src="/logo/wbone.png"
              alt="Profile"
              width={178}
              height={178}
            />
            <p className='text-title'>Your Address:</p>
            <div className='card px-5 py-2.5 text-subtext text-sm'>
            {`${formatAddressV3(addressToUse)}`}
            </div>
          </div>
        </div>
        <div className='grow grid grid-cols-1 gap-5 mb-5'>
          <div className='card p-5 flex-col flex'>
            <div className='text-title mb-2.5'>Token Held</div>
            <div className='card2 grow !px-5 !py-2.5 min-h-60 md:min-h-none'>
              {tokenAddresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokenAddresses.map((token) => (
                    <TokenBalanceItem
                      key={token.address}
                      tokenAddress={token.address}
                      symbol={token.symbol}
                      userAddress={addressToUse}
                      onClick={() => handleTokenClick(token.address)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-subtext text-sm sm:text-base">Buy your first token to see the information here</p>
              )}
            </div>
          </div>
          <div className='card p-5 flex-col flex'>
            <div className='text-title mb-2.5'>Tokens Created</div>
            <div className='card2 grow !px-5 !py-2.5 min-h-60 md:min-h-none'>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingBar size="medium" />
                </div>
              ) : createdTokens.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {createdTokens.map((token) => (
                    <div 
                      key={token.address}
                      className="bg-[var(--card)] rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-[var(--card-hover)] transition-colors duration-200 flex items-start"
                      onClick={() => handleTokenClick(token.address)}
                    >
                      {token.logo && (
                        <img src={token.logo} alt={`${token.name} logo`} className="w-16 h-16 mr-3 sm:mr-4 rounded-lg" />
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {token.name} <span className="text-subtext">({token.symbol})</span>
                        </h3>
                        <p className="text-subtext text-[9px] sm:text-xs">{token.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-subtext"><span className='text-primary font-bold'>Create</span> your First Token To See The information here.</p>
              )}
              {createdTokensTotalPages > 1 && (
                <Pagination
                  currentPage={createdTokensPage}
                  totalPages={createdTokensTotalPages}
                  onPageChange={handleCreatedTokensPageChange}
                />
              )}
            </div>
          </div>
          <div className='card p-5 flex-col flex'>
            <div className='text-title mb-2.5'>Recent Transactions</div>
            <div className='card2 grow !px-5 !py-2.5 min-h-60 md:min-h-none'>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingBar size="medium" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto bg-[var(--card)] rounded-lg">
                  <table className="min-w-full divide-y divide-[var(--card)]">
                    <thead className="bg-[var(--card2)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] sm:text-xs font-medium text-subtext uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-[10px] sm:text-xs font-medium text-subtext uppercase tracking-wider">Token</th>
                        <th className="px-4 py-3 text-left text-[10px] sm:text-xs font-medium text-subtext uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-[10px] sm:text-xs font-medium text-subtext uppercase tracking-wider">$AIMG</th>
                        <th className="px-4 py-3 text-left text-[10px] sm:text-xs font-medium text-subtext uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card)]">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[var(--card-hover)] transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{tx.type}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{getTokenSymbol(tx.recipientAddress)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{formatAmountV3(tx.tokenAmount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{formatAmountV3(tx.ethAmount)} $AIMG</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">{formatTimestamp(tx.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-subtext">No recent transactions.</p>
              )}
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {isTokenLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingBar size="large" />
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;
