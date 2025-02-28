import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiConfig, createConfig, WagmiProvider } from 'wagmi'
import { flareTestnet, flare, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultConfig, RainbowKitProvider, darkTheme, Theme } from '@rainbow-me/rainbowkit'
import merge from 'lodash.merge';
import '@rainbow-me/rainbowkit/styles.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

const config = getDefaultConfig({
  appName: "agentpad",
  projectId: "YOUR_PROJECT_ID",
  chains: [sepolia],
  ssr: true,
});
// const config = getDefaultConfig({
//   appName: "Pump Fun",
//   projectId: "YOUR_PROJECT_ID",
//   chains: [
//     {
//       ...flareTestnet,
//       rpcUrls: {
//         default: {
//           http: ["https://coston2-api.flare.network/ext/C/rpc"],
//         },
//       },
//     },
//   ],
//   ssr: true,
// });


const queryClient = new QueryClient()

const myTheme = merge(darkTheme(), {
  colors: {
    modalBackground: '#0D0D0D',
  },
} as Theme);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={myTheme}>
          <WebSocketProvider>
            <Component {...pageProps} />
          </WebSocketProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
      <ToastContainer />
    </WagmiConfig>
  )
}