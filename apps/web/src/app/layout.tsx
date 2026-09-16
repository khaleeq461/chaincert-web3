import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NetworkBanner } from '@/components/layout/NetworkBanner';

export const metadata: Metadata = {
  title: 'ChainCert — Blockchain Certificate Verification Platform',
  description:
    'Decentralized credential issuance and instant public verification powered by smart contracts, cryptographic fingerprints, and IPFS storage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-brand-500 selection:text-white min-h-screen flex flex-col justify-between">
        <Web3Provider>
          <Navbar />
          <NetworkBanner />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
