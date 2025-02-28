import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { shortenAddress } from '@/utils/blockchainUtils'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'

const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            className='h-full'
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} className="text-medium font-title btn btn-primary h-full">
                    Connect
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} className="text-medium font-title btn btn-secondary h-full">
                    Wrong network
                  </button>
                )
              }

              return (
                <div className="flex items-center space-x-1 h-full">
                  <button
                    onClick={openChainModal}
                    className="text-medium btn btn-secondary px-2 h-full font-title"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="">{chain.name}</span>
                  </button>

                  <button onClick={openAccountModal} className="text-medium btn btn-primary px-2 h-full font-title">
                    {shortenAddress(account.address)}
                    {account.displayBalance
                      ? <span className="hidden sm:inline ml-1">({account.displayBalance})</span>
                      : ''}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { address } = useAccount()
  const router = useRouter()
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleScroll = () => {
    if (window.scrollY > lastScrollY) {
      // Scrolling down
      setIsScrollingDown(true);
    } else {
      // Scrolling up
      setIsScrollingDown(false);
    }
    setLastScrollY(window.scrollY);

    // Hide navbar when scrolling down, show when scrolling up
    if (window.scrollY > 50) {
      setIsVisible(!isScrollingDown);
    }
  };

  useEffect(() => {
    // Add event listener on mount
    window.addEventListener("scroll", handleScroll);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isScrollingDown, lastScrollY]);

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/');
  }

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/');
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error('Please connect your wallet first', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      return
    }
    router.push(`/profile/${address}`)
  }

  return (<div className='fixed main-wrapper w-full left-0 right-0'>

    <nav 
      style={{
        top: isVisible ? "0" : "-80px", // Hide navbar by moving it out of the viewport
        left: "0",
        width: "100%",
        transition: "top 0.3s ease-in-out", // Transition effect for top
      }}
      className="my-5 relative">
      <div className="card shadow-lg flex items-center h-[46px]">
        <Link href="/" className="flex items-center gap-2 pl-4 h-full mr-auto">
          <Image
            src="/logo/logo.png"
            alt="Agent Pad Logo"
            width={32}
            height={36}
          />
          <span className="text-white text-lg font-title mt-1">AGENT PAD</span>
        </Link>
        
        <div className="hidden md:flex items-center">
          <Link href="/"
            className={`text-medium font-title btn ${router.pathname == '/' ? 'btn-primary' : ''}`}
          >
            HOME
          </Link>
          <Link href="/create"
            className={`text-medium font-title btn ${router.pathname == '/create' ? 'btn-primary' : ''}`}
          >
            CREATE
          </Link>
          <button 
            onClick={handleProfileClick}
            className={`text-medium font-title btn ${router.pathname.startsWith('/profile') ? 'btn-primary' : ''}`}
          >
            PROFILE
          </button>
        </div>
        <div className='hidden md:flex h-full ml-auto'>
          <CustomConnectButton />
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center h-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-primary h-full !px-3"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu - Updated background and styling */}
      {isOpen && (
        <div className="md:hidden mt-2.5 right-0 absolute z-[1000]">
          <div className='card flex flex-col gap-2 text-center font-title text-base font-normal'>
            <Link href="/"
              className={`btn ${router.pathname == '/' ? 'btn-primary' : ''}`}
            >
              HOME
            </Link>
            <Link href="/create"
              className={`btn ${router.pathname == '/create' ? 'btn-primary' : ''}`}
            >
              CREATE
            </Link>
            <button 
              onClick={handleProfileClick}
              className={`btn text-center ${router.pathname.startsWith('/profile') ? 'btn-primary' : ''}`}
            >
              PROFILE
            </button>
          </div>
        </div>
      )}
    </nav>
  </div>
  )
}

export default Navbar