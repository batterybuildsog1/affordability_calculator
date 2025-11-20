import type { Metadata } from 'next';
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Inter } from 'next/font/google';
import './globals.css';
import { AffordabilityProvider } from '@/context/AffordabilityContext';
import GlobalDock from '@/components/controllers/GlobalDock';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Techridge Affordability Tool',
  description: 'Affordability and demand forecasting tool for Techridge residential development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}><StackProvider app={stackClientApp}><StackTheme>
        <AffordabilityProvider>
          <div className="min-h-screen pb-32">
            {/* Navigation */}
            <nav className="glass sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white">Techridge Affordability</h1>
                    <p className="text-sm text-space-300">Demand Forecasting Tool</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <a
                      href="/"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-space-300 hover:text-white hover:bg-space-800 transition-colors"
                    >
                      Overview
                    </a>
                    <a
                      href="/bands"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-space-300 hover:text-white hover:bg-space-800 transition-colors"
                    >
                      Income Bands
                    </a>
                    <a
                      href="/assumptions"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-space-300 hover:text-white hover:bg-space-800 transition-colors"
                    >
                      Assumptions
                    </a>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </main>

            {/* Global dock controller */}
            <GlobalDock />
          </div>
        </AffordabilityProvider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
