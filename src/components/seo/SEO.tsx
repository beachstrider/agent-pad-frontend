import Head from 'next/head';
import { useRouter } from 'next/router';
import dotenv from 'dotenv';

dotenv.config();

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  token?: {
    name: string;
    symbol: string;
    description: string;
    logo: string;
  };
}

const SEO: React.FC<SEOProps> = ({ title, description, image, token }) => {
  const router = useRouter();
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'https://flarelaunch.net';

  const seo = {
    title: token ? `${token.name} (${token.symbol}) - Agent Pad` : title || 'Agent Pad - Your Memecoin home',
    description: token?.description || description || 'Flare Launch enables safe, community-driven token launches with no presales or team allocations.',
    image: token?.logo || image || `${domain}/default-og-image.jpg`,
    url: `${domain}${router.asPath}`,
  };

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Head>
  );
};

export default SEO;