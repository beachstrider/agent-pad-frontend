import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Token, TokenWithLiquidityEvents } from '@/interface/types';
import { useTokenLiquidity, formatTimestampV1, formatTimestamp, formatAmountV2, shortenWebsite } from '@/utils/blockchainUtils';
import { useRouter } from 'next/router';
import { Globe, Twitter, Send as Telegram, Clock, Youtube, MessageCircle as Discord } from 'lucide-react';
import { CurrencyDollarIcon } from '@heroicons/react/20/solid';
import LoadingBar from '@/components/ui/LoadingBar';
import { FaCircle, FaYoutube } from "react-icons/fa";
import { AiFillDollarCircle } from "react-icons/ai";
import { IoLink } from "react-icons/io5";
import { FaDiscord, FaTelegramPlane, FaSkype } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import { TbWorld } from 'react-icons/tb';
import dotenv from 'dotenv';

dotenv.config();

interface TokenCardProps {
  token: Token | TokenWithLiquidityEvents;
  isEnded: boolean;
  onTokenClick: (address: string) => void;
  onLiquidityUpdate?: (liquidityAmount: bigint) => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, isEnded, onTokenClick, onLiquidityUpdate }) => {
  const [currentLiquidity, setCurrentLiquidity] = useState<string>('0');
  const tokenAddress = token.address as `0x${string}`;
  const shouldFetchLiquidity = !token._count?.liquidityEvents;
  const { data: liquidityData } = useTokenLiquidity(shouldFetchLiquidity ? tokenAddress : null);
  const router = useRouter();

  useEffect(() => {
    if (shouldFetchLiquidity && 
        liquidityData && 
        liquidityData[2] && 
        liquidityData[2].toString() !== currentLiquidity) {
      
      const newLiquidity = liquidityData[2].toString();
      setCurrentLiquidity(newLiquidity);
      
      if (onLiquidityUpdate) {
        onLiquidityUpdate(liquidityData[2]);
      }
    }
  }, [
    liquidityData, 
    shouldFetchLiquidity, 
    onLiquidityUpdate, 
    currentLiquidity, 
    token.address
  ]);

  const calculateProgress = (liquidity: string): number => {
    if (token._count?.liquidityEvents > 0) {
      return 100;
    }
    const currentValue = Number(liquidity) / 10**18;
    // console.log(token.name, token.symbol, currentValue);
    const target = Number(process.env.NEXT_PUBLIC_DEX_TARGET);
    const percentage = (currentValue / target) * 100 || 0;
    return Math.round(Math.min(percentage, 100) * 100) / 100;
  };

  const progress = calculateProgress(currentLiquidity);
  const isCompleted = token._count?.liquidityEvents > 0;

  const SocialLinks = () => (
    <div className="flex items-center gap-2 absolute top-3 right-3">
      {token.website && (
        <a 
          href={token.website} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-subtext hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe size={16} />
        </a>
      )}
      {token.twitter && (
        <a 
          href={token.twitter} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-subtext hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Twitter size={16} />
        </a>
      )}
      {token.telegram && (
        <a 
          href={token.telegram} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-subtext hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Telegram size={16} />
        </a>
      )}
      {token.discord && (
        <a 
          href={token.discord} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-subtext hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Discord size={16} />
        </a>
      )}
      {token.youtube && (
        <a 
          href={token.youtube} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-subtext hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Youtube size={16} />
        </a>
      )}
    </div>
  );

  const handleClick = () => {
    onTokenClick(token.address);
  };

  if (isEnded && 'liquidityEvents' in token && token.liquidityEvents.length > 0) {
    const liquidityEvent = token.liquidityEvents[0];
    const uniswapLink = `https://app.blazeswap.xyz/swap/?outputCurrency=${token.address}&chain=coston2`;

    return (
      <div className="cursor-pointer">
        <div className="bg-[var(--card)] rounded-lg overflow-hidden hover:bg-[var(--card-hover)] transition-colors duration-200">
          <div className="p-4">
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 flex-shrink-0">
                <img 
                  src={token.logo} 
                  alt={token.name} 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {token.name} <span className="text-subtext">{token.symbol}</span>
                </h3>
                <p className="text-sm text-subtext line-clamp-2">{token.description}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-subtext">Bonding Curve Progress</span>
                <span className="text-[var(--primary)]">Completed</span>
              </div>
              <div className="w-full bg-[var(--card)] rounded-full h-2">
                <div
                  className="bg-[var(--primary)] h-2 rounded-full transition-all duration-500 w-full"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={uniswapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 text-sm bg-[var(--primary)] text-black rounded-md hover:bg-[var(--primary-hover)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Trade
              </a>
              <Link
                href={`/token/${token.address}`}
                className="flex-1 text-center py-2 text-sm bg-[var(--card)] text-white rounded-md hover:bg-[#444444] transition-colors"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div >
      <div className="card">
        <div className="p-5 flex flex-col gap-5">
          <div className="flex justify-between">
            <img 
              src={token.logo} 
              alt={token.name} 
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
            <div className='flex justify-between mb-2.5 gap-2.5'>
              <div className="flex gap-2">
                <div className='truncateWrapper'>
                  <span className='text-md font-bold truncate'>{token.name}</span>
                </div>
                <span className="badge badge-primary">${token.symbol}</span>
              </div>
              <div className="flex items-center text-sm text-subtext">
                <Clock size={16} className="mr-2" />
                <span>{formatTimestampV1(token.createdAt)}</span>
              </div>
            </div>
            <p className="text-sm text-subtext line-clamp-2 min-h-[42px]">{token.description}</p>
            <div className='flex flex-wrap min-h-8'>
              {
                token.website && (
                <a href={token.website} target="_blank" className='text-sm flex gap-1 items-center'>
                  <span className='text-base'><IoLink /></span>
                  <span>{shortenWebsite(token.website)}</span>
                </a>
                )
              }
              <div className='flex gap-2.5 ml-auto'>
                {token.twitter && (
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer"
                    className="btn-circle">
                    <RiTwitterXFill size={20} />
                  </a>
                )}
                {token.telegram && (
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer"
                    className="btn-circle">
                    <FaTelegramPlane size={20} />
                  </a>
                )}
                {token.discord && (
                  <a href={token.discord} target="_blank" rel="noopener noreferrer"
                    className="btn-circle">
                    <FaDiscord size={20} />
                  </a>
                )}
                {token.youtube && (
                  <a href={token.youtube} target="_blank" rel="noopener noreferrer"
                    className="btn-circle">
                    <FaYoutube size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="">
            <div className="flex justify-between text-primary mb-2.5">
              <span className="text-xs pt-1">Bonding Curve Progress</span>
              <span className='font-bold'>87,567<span className='font-normal text-xs'>/120,000 $AIMG</span></span>
            </div>
            <div className="w-full progress">
              <div className="bar" style={{ width: `${progress}%` }}
              />
              {
                progress < 100 ? <div className='label'>{`${progress}%`}</div> : <></>
              }
            </div>
          </div>

          <div className='flex justify-between'>
            <div>
              <div className='text-small text-subtext'>Finished:</div>
              <div>2D : 2H : 30M : 23S</div>
            </div>
            <button 
              onClick={handleClick}
              className="px-6 xl:px-12 py-2.5 text-title border border-title rounded-full hover:bg-gray-500 hover:text-grey"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;
