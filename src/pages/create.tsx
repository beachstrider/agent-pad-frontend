import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { useCreateToken } from '@/utils/blockchainUtils';
import { updateToken } from '@/utils/api';
import { ChevronDownIcon, ChevronUpIcon, CloudArrowUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { parseUnits } from 'viem';
import PurchaseConfirmationPopup from '@/components/notifications/PurchaseConfirmationPopup';
import Modal from '@/components/notifications/Modal';
import Image from 'next/image';
import { TbWorld } from "react-icons/tb";
import { FaTelegramPlane } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import { FaDiscord } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB image size limit


const CreateToken: React.FC = () => {
  const router = useRouter();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [tokenImageUrl, setTokenImageUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [creationStep, setCreationStep] = useState<'idle' | 'uploading' | 'creating' | 'updating' | 'completed' | 'error'>('idle');
  const [isSocialExpanded, setIsSocialExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);
  const [showPreventNavigationModal, setShowPreventNavigationModal] = useState(false);
  const [proMode, setProMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createToken, isLoading: isBlockchainLoading, UserRejectedRequestError } = useCreateToken();

  const uploadToIPFS = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 1MB limit. Please choose a smaller file.');
      return null;
    }

    setIsUploading(true);
    setCreationStep('uploading');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Uploading image to IPFS...');
      const response = await axios.post('/api/upload-to-ipfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.url) {
        console.log('Image uploaded successfully:', response.data.url);
        setTokenImageUrl(response.data.url);
        toast.success('Image uploaded to IPFS successfully!');
        return response.data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to upload image: ${error.response.data.error || error.message}`);
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
      return null;
    } finally {
      setIsUploading(false);
      setCreationStep('idle');
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setTokenImage(file);
    const newImageUrl = await uploadToIPFS(file);
    if (newImageUrl) {
      setTokenImageUrl(newImageUrl);
    }
  }, [uploadToIPFS]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenImageUrl) {
      toast.error('Please upload an image before creating the token.');
      return;
    }
    setShowPurchasePopup(true);
  }, [tokenImageUrl]);

  const handlePurchaseConfirm = useCallback(async (purchaseAmount: bigint) => {
    setShowPurchasePopup(false);
    setCreationStep('creating');
    let tokenAddress: string | null = null;

    try {
      console.log('Creating token on blockchain...');
      tokenAddress = await createToken(tokenName, tokenSymbol, purchaseAmount);
      console.log('Token created on blockchain:', tokenAddress);

      setCreationStep('updating');

      // Add a 4-second delay before updating the server - gives the backend time to catch event and process
      await new Promise(resolve => setTimeout(resolve, 4000));

      console.log('Updating token in backend...');
      if (tokenAddress && tokenImageUrl) {
        await updateToken(tokenAddress, {
          logo: tokenImageUrl,
          description: tokenDescription,
          website,
          telegram,
          discord,
          twitter,
          youtube
        });
        console.log('Token updated in backend');
      } else {
        throw new Error('Token address or image URL is missing');
      }

      setCreationStep('completed');
      toast.success('Token created and updated successfully!');
      router.push(`/token/${tokenAddress}`);
    } catch (error) {
      console.error('Error in token creation/update process:', error);

      // Reset creation step to allow resubmission
      setCreationStep('idle');

      if (error instanceof Error) {
        if (error instanceof UserRejectedRequestError) {
          // MetaMask rejection or similar
          toast.error('Transaction was cancelled. Please try again.');
        } else if (!tokenAddress) {
          // Error occurred before token creation on blockchain
          toast.error('Failed to create token on blockchain. Please try again.');
        } else {
          // Token created on blockchain but backend update failed
          toast.error('Token created on blockchain but failed to update in backend. Please try updating later in your portfolio.');
        }
      } else {
        // Fallback error message
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  }, [tokenName, tokenSymbol, tokenImageUrl, tokenDescription, website, telegram, discord, twitter, youtube, createToken, router]);

  const getButtonText = useCallback(() => {
    switch (creationStep) {
      case 'uploading': return 'Uploading image...';
      case 'creating': return isBlockchainLoading ? 'Waiting for blockchain confirmation...' : 'Creating token on blockchain...';
      case 'updating': return 'Updating token in backend...';
      case 'completed': return 'Token created successfully!';
      case 'error': return 'Error occurred. Visit Portfolio to Update TokenInfo';
      default: return 'Create Token';
    }
  }, [creationStep, isBlockchainLoading]);

  const isButtonDisabled = creationStep !== 'idle' || !tokenName || !tokenSymbol || !tokenImageUrl;

  const toggleSocialSection = () => setIsSocialExpanded(!isSocialExpanded);

  function checkProQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pro') === 'true';
  }


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (creationStep === 'creating' || creationStep === 'updating') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [creationStep]);
  useEffect(() => {
    if (creationStep === 'creating' || creationStep === 'updating') {
      setShowPreventNavigationModal(true);
    } else {
      setShowPreventNavigationModal(false);
    }

    if (checkProQuery()) {
      setProMode(true)
    }
    else {
      setProMode(false)
    }
  }, [creationStep]);

  return (
    <Layout>
      <SEO
        title="Launch Your Own Token with Agent Pad"
        description="Create a token that&apos;s immediately tradable without needing to provide initial liquidity—enabling a fair and seamless launch"
        image="/seo/create.jpg"
      />
      <div className="md:shine-overlay"></div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        <div>
          <div className='flex flex-col gap-2.5'>
            <p className='text-xl text-title font-title'>Create New Token</p>
            <ul className='text-subtext mb-2 space-y-2 list-disc'>
              <li>
                Have 1% of agents&apos; tokens sent to our protocol wallet from Pump.fun (so when they deploy a token we should take 1% of the supply).  - it will be done by the smart contract (FYI)
              </li>
              <li>
                Commission for trading/purchase and sale - 1%, we also keep 1% from purchases by the deployer - FYI
              </li>
              <li>
                Deployer should be able to buy any % of supply.<br/>
              </li>
            </ul>
            {/* Info button with tooltip */}
            <div className="relative">
              <button
                type="button"
                className="btn-primary-light flex items-center"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                <span className="">Deployment Cost Info</span>
              </button>
              {/* {showTooltip && (
                <div className="absolute left-0 transform top-12 bg-grey text-subtext p-4 rounded-md shadow-lg z-10 w-64 border border-[var(--card2)]">
                  <p className="text-sm">
                    Cost to deploy: 0 $AIMG
                    This serves as an initial boost to the bonding curve.
                  </p>
                </div>
              )} */}
            </div>
          </div>
          <div className='hidden lg:block static xl:relative'>
            <Image
              className='lg:max-w-none h-none'
              src="/back/create.png"
              alt="Create Back"
              width={750}
              height={649}
            />
          </div>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="card p-5">
            <div className='flex flex-col gap-5'>
              {/* Token Name and Symbol inputs */}
              <div className="grid gap-5 grid-cols-2">
                <div className='space-y-2.5'>
                  <label htmlFor="tokenName" className="text-sm text-subtext">
                    Token Name
                  </label>
                  <input
                    type="text"
                    id="tokenName"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Enter token name"
                  />
                </div>
                <div className='space-y-2.5'>
                  <label htmlFor="tokenSymbol" className="text-sm text-subtext">
                    Token Symbol
                  </label>
                  <input
                    type="text"
                    id="tokenSymbol"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Enter token symbol"
                  />
                </div>
              </div>

              {/* Token Name and Symbol inputs */}
              {
                proMode &&
                <div className="grid gap-5 grid-cols-2">
                  <div className='space-y-2.5'>
                    <label htmlFor="tokenSupply" className="text-sm text-subtext">
                      Token Supply
                    </label>
                    <input
                      type="text"
                      id="tokenSupply"
                      className="form-input"
                      placeholder="Enter token name"
                    />
                  </div>
                  <div className='space-y-2.5'>
                    <label htmlFor="marketCap" className="text-sm text-subtext">
                      Market Cap
                    </label>
                    <input
                      type="text"
                      id="marketCap"
                      className="form-input"
                      placeholder="Enter token symbol"
                    />
                  </div>
                </div>
              }

              {/* Token Description textarea */}
              <div className='space-y-2.5'>
                <label htmlFor="tokenDescription" className="text-sm text-subtext">
                  Token Description
                </label>
                <textarea
                  id="tokenDescription"
                  value={tokenDescription}
                  onChange={(e) => setTokenDescription(e.target.value)}
                  rows={4}
                  className="form-input"
                  placeholder="Describe your token"
                />
              </div>

              {/* Token Image upload */}
              <div className='space-y-2.5'>
                <label htmlFor="tokenImage" className="text-sm text-subtext">
                  Token Image
                </label>
                <div
                  className="mt-1 flex justify-center items-center px-4 py-4 border-2 border-[var(--card)] border-dashed rounded-md hover:border-[var(--primary-hover)] transition duration-150 ease-in-out bg-[var(--card2)]"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <div className="flex flex-col items-center">
                      <CloudArrowUpIcon className="mx-auto h-10 w-10 text-subtext mb-2" />
                      <div className="flex flex-col sm:flex-row text-sm text-subtext items-center">
                        <label
                          htmlFor="tokenImage"
                          className="outline-none cursor-pointer rounded-md text-[var(--primary)] hover:text-[var(--primary-hover)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--primary)] transition duration-150 ease-in-out px-3 py-2 mb-2 sm:mb-0 sm:mr-2"
                        >
                          <span>Upload File Drag and Drop</span>
                          <input
                            id="tokenImage"
                            name="tokenImage"
                            type="file"
                            accept="image/*"
                            className="sr-only outline-none"
                            onChange={handleImageChange}
                            disabled={isUploading}
                            ref={fileInputRef}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-subtext mt-2">PNG up to 1MB</p>
                    </div>
                  </div>
                </div>
                {isUploading && <p className="text-sm text-subtext mt-2">Uploading image to IPFS...</p>}
              </div>

              {/* Token Image preview */}
              {tokenImageUrl && (
                <div className="mt-4 flex justify-center">
                  <div className="text-center">
                    <img
                      src={tokenImageUrl}
                      alt="Token preview"
                      className="h-24 w-24 object-cover rounded-full mx-auto border-2 border-[var(--primary)]"
                    />
                  </div>
                </div>
              )}

              {/* Collapsible Social Media Section */}
              <div className="space-y-2.5 border border-[var(--card)] rounded-md overflow-hidden">
                <label className="text-sm text-subtext">
                  Social Media Links (Optional)
                </label>
                <div className="bg-[var(--card)] grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {[
                    { id: 'website', label: 'Website link', class: "sm:col-span-4", icon: <TbWorld/>, value: website, setter: setWebsite },
                    { id: 'telegram', label: 'Telegram link', class: "sm:col-span-4", icon: <FaTelegramPlane/>, value: telegram, setter: setTelegram },
                    { id: 'twitter', label: 'X link', class: "sm:col-span-4", icon: <RiTwitterXFill/>, value: twitter, setter: setTwitter },
                    { id: 'discord', label: 'Discord link', class: "sm:col-span-6", icon: <FaDiscord/>, value: discord, setter: setDiscord },
                    { id: 'youtube', label: 'YouTube link', class: "sm:col-span-6", icon: <FaYoutube/>, value: youtube, setter: setYoutube },
                  ].map((item) => (
                    <div className={`${item.class} relative`} key={item.id}>
                      <span className='absolute top-2.5 left-3 text-md text-subtext'>{item.icon}</span>
                      <input
                        type="url"
                        id={item.id}
                        value={item.value}
                        onChange={(e) => item.setter(e.target.value)}
                        className="form-input pl-10 text-sm"
                        placeholder={item.label}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  className={`btn-primary w-full ${
                    isButtonDisabled
                      ? '!bg-[var(--primary-hover)] text-grey cursor-not-allowed'
                      : 'cursor-pointer hover:bg-[var(--primary-hover)]'
                  }`}
                >
                  {getButtonText()}
                </button>
              </div>
            </div>
          </form>

          {showPurchasePopup && (
            <PurchaseConfirmationPopup
              onConfirm={handlePurchaseConfirm}
              onCancel={() => setShowPurchasePopup(false)}
              tokenSymbol={tokenSymbol}
            />
          )}

          {showPreventNavigationModal && (
            <Modal
              isOpen={showPreventNavigationModal}
              onClose={() => { }} // Empty function to prevent closing
            >
              <div className="p-6">
                <h3 className="text-md text-[var(--primary)] mb-2">Please Wait...</h3>
                <p className="text-sm text-gray-500">
                  Your token is being {creationStep === 'creating' ? 'created' : 'updated'}. This
                  process may take a few moments. Please do not navigate away or close the browser
                  until the process is complete.
                </p>
              </div>
            </Modal>
          )}
        </div>
        <div className='static lg:hidden'>
          <Image
            className='lg:max-w-none h-none'
            src="/back/create.png"
            alt="Create Back"
            width={750}
            height={649}
          />
        </div>
      </div>
      <Toaster />
    </Layout>
  );
};

export default CreateToken;