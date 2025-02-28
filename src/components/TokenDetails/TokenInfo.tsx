import React, { useEffect, useState } from 'react';
import { ExternalLinkIcon, Copy } from 'lucide-react';
import { TokenWithTransactions, PriceCache } from '@/interface/types';
import { formatTimestamp, shortenAddress, formatTimestampV1, formatAddressV2, formatAmount, shortenWebsite } from '@/utils/blockchainUtils';
import { Globe, Twitter, Send as Telegram, Clock, Youtube, MessageCircle as Discord } from 'lucide-react';
import { useTokenLiquidity, useCurrentTokenPrice, useMarketCap, formatAmountV2 } from '@/utils/blockchainUtils';
import { formatUnits } from 'viem';
import { toast } from 'react-toastify';
import { getCurrentPrice } from '@/utils/api';
import { FaCircle } from "react-icons/fa";
import { AiFillDollarCircle } from "react-icons/ai";
import { IoLink } from "react-icons/io5";
import { RiTwitterXFill } from "react-icons/ri";
import { TbWorld } from "react-icons/tb";
import { FaTelegramPlane } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import dotenv from 'dotenv';

dotenv.config();

interface TokenInfoProps {
  tokenInfo: TokenWithTransactions;
  showHeader?: boolean;
  refreshTrigger?: number;
  liquidityEvents?: any;
  holdersCount?: number;
}

//  cache duration constant (5 minutes)
//  price cache outside component to share across instances
const CACHE_DURATION = 5 * 60 * 1000;
let priceCache: PriceCache | null = null;

const TokenInfo: React.FC<TokenInfoProps> = ({ tokenInfo, showHeader = false, refreshTrigger = 0, liquidityEvents, holdersCount = 0 }) => {
  const [flrPrice, setFlrPrice] = useState<string>('0');
  const tokenAddress = tokenInfo?.address as `0x${string}`;
  const shouldFetchLiquidity = !liquidityEvents?.liquidityEvents?.length;
  const { data: liquidityData, refetch: refetchLiquidity } = useTokenLiquidity(shouldFetchLiquidity ? tokenAddress : null);
  const { data: currentPrice, refetch: refetchPrice } = useCurrentTokenPrice(tokenAddress);
  const { data: marketCap, refetch: refetchMarketCap } = useMarketCap(tokenAddress);

  useEffect(() => {
    const fetchFlrPrice = async () => {
      try {
        // Check if we have a valid cached price
        if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
          setFlrPrice(priceCache.price);
          return;
        }

        // If no valid cache, fetch new price
        const price = await getCurrentPrice();
        
        // Update cache
        priceCache = {
          price,
          timestamp: Date.now()
        };
        
        setFlrPrice(price);
      } catch (error) {
        console.error('Error fetching $AIMG price:', error);
      }
    };

    fetchFlrPrice();
    const interval = setInterval(fetchFlrPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (shouldFetchLiquidity) {
      refetchLiquidity();
    }
    refetchPrice();
    refetchMarketCap();
  }, [refreshTrigger, refetchLiquidity, refetchPrice, refetchMarketCap, shouldFetchLiquidity]);

  const isCompleted = liquidityEvents?.liquidityEvents?.length > 0;

  const calculateProgress = (currentLiquidity: bigint): number => {
    if (isCompleted) return 100;
    
    const liquidityInEth = parseFloat(formatUnits(currentLiquidity, 18));
    const target = Number(process.env.NEXT_PUBLIC_DEX_TARGET);
    const progress = (liquidityInEth / target) * 100 || 0;
    return Math.min(progress, 100);
  };

  const truncateDescription = (description: string, maxLength: number = 250) => {
    if (description.length <= maxLength) return description;
    return `${description.slice(0, maxLength)}...`;
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

  const TokenDetails = () => {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <InfoItem 
            label="Contract" 
            value={tokenInfo?.address ? formatAddressV2(tokenInfo.address) : 'Loading...'}
            link={`${process.env.NEXT_PUBLIC_BLOCKSCOUT_URL}/address/${tokenInfo?.address}`}
            isExternal={true}
          />
          <InfoItem 
            label="Deployer" 
            value={tokenInfo?.creatorAddress ? shortenAddress(tokenInfo.creatorAddress) : 'Loading...'}
            link={`/profile/${tokenInfo?.creatorAddress}`}
            isExternal={false}
            copyValue={tokenInfo?.creatorAddress}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <InfoItem 
            label="Created" 
            value={tokenInfo?.createdAt ? formatTimestamp(tokenInfo.createdAt) : 'Loading...'}
          />
          <InfoItem 
            label="Current Price" 
            value={currentPrice ? `${formatAmount(currentPrice.toString())} $AIMG` : 'Loading...'}
          />
        </div>

        {/* Updated Market Cap and Holders grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="card2">
            <div className="text-sm text-subtext mb-1">Market Cap</div>
            <div className="text-base text-white">
              {marketCap ? (
                formatUsdValue(marketCap.toString())
              ) : (
                'Loading...'
              )}
            </div>
          </div>
          
          <div className="card2">
            <div className="text-sm text-subtext mb-1">Holders</div>
            <div className="text-base text-white">
              {holdersCount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showHeader) {
    return (
      <div className="">
        <div className="">
          <div className="flex flex-col gap-5">
            <div className="flex justify-between">
              <img 
                src={tokenInfo.logo} 
                alt={tokenInfo.name} 
                className="w-[70px] h-[70px] object-cover rounded-full"
              />
              <div>
                <div className='flex gap-2'>
                  <span className='badge badge-primary'>
                    <AiFillDollarCircle />
                    <span>Token</span>
                  </span>
                  <span className='badge badge-red'>
                    <span className='text-[10px]'><FaCircle /></span>
                    <span>LIVE</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className='flex justify-between gap-2.5'>
                <div className="flex gap-2">
                  <div className='truncateWrapper'>
                    <span className='text-md font-bold truncate'>{tokenInfo.name}</span>
                  </div>
                  <span className="badge badge-primary">${tokenInfo.symbol}</span>
                </div>
                <div className="flex items-center text-sm text-subtext">
                  <Clock size={16} className="mr-2" />
                  <span>{formatTimestampV1(tokenInfo.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-subtext break-all">{truncateDescription(tokenInfo.description)}</p>
              <div className='flex flex-wrap'>
                {
                  tokenInfo.website && (
                  <a href={tokenInfo.website} target="_blank" className='text-sm flex gap-1 items-center'>
                    <span className='text-base'><IoLink /></span>
                    <span>{shortenWebsite(tokenInfo.website)}</span>
                  </a>
                  )
                }
                <div className='flex gap-2.5 ml-auto'>
                  {tokenInfo.twitter && (
                    <a href={tokenInfo.twitter} target="_blank" rel="noopener noreferrer"
                      className="btn-circle">
                      <RiTwitterXFill size={20} />
                    </a>
                  )}
                  {tokenInfo.telegram && (
                    <a href={tokenInfo.telegram} target="_blank" rel="noopener noreferrer"
                      className="btn-circle">
                      <FaTelegramPlane size={20} />
                    </a>
                  )}
                  {tokenInfo.discord && (
                    <a href={tokenInfo.discord} target="_blank" rel="noopener noreferrer"
                      className="btn-circle">
                      <FaDiscord size={20} />
                    </a>
                  )}
                  {tokenInfo.youtube && (
                    <a href={tokenInfo.youtube} target="_blank" rel="noopener noreferrer"
                      className="btn-circle">
                      <FaYoutube size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar (shared between mobile and desktop) */}
        <div className="py-5 flex flex-col gap-2.5">
          <div className="w-full progress">
            <div className="bar" style={{ width: isCompleted 
                  ? '100%' 
                  : `${liquidityData ? calculateProgress(liquidityData[2]) : 0}%` }}
            />
            {
              !isCompleted ? <div className='label'>{`${liquidityData ? calculateProgress(liquidityData[2]) : 0}%`}</div> : <></>
            }
          </div>
          <div className="flex justify-between text-primary">
            <span className="text-xs pt-1">Bonding Curve Progress</span>
            <span className='font-bold'>87,567<span className='font-normal text-xs'>/120,000 $AIMG</span></span>
          </div>
          <p className='text-sm text-subtext'>An additional <span className='font-bold text-title'>18,870.59 $AIMG</span> are required before all the liquidity from the bonding curve will be deposited into Uniswap and burnt. Progression increases as the price goes up.</p>
        </div>

        {/* Token Details */}
        <TokenDetails />
      </div>
    );
  }

  // When showHeader is false, only show the token details
  return <TokenDetails />;
};

const InfoItem: React.FC<{ 
  label: string; 
  value?: string; 
  link?: string; 
  isExternal?: boolean;
  copyValue?: string;
}> = ({ label, value, link, isExternal, copyValue }) => (
  <div className="card2">
    <div className="text-sm text-subtext">{label}</div>
    <div className="text-base text-title flex items-center gap-2">
      {link ? (
        <div className="flex items-center gap-2 flex-grow">
          <a 
            href={link} 
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="hover:text-[var(--primary)] transition-colors flex items-center gap-1"
          >
            <span className='mt-0.5'>{value}</span>
            {isExternal && <ExternalLinkIcon size={16} />}
          </a>
          {copyValue && (
            <button
              onClick={() => copyToClipboard(copyValue)}
              className="text-title hover:text-[var(--primary)] transition-colors"
            >
              <Copy size={16} />
            </button>
          )}
        </div>
      ) : (
        value
      )}
    </div>
  </div>
);

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Address copied to clipboard!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  });
};

export default TokenInfo;
