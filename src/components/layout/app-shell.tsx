"use client";

import { BackgroundOrbs } from "./background-orbs";
import { IconSidebar } from "./icon-sidebar";
import { MarketTickerBar } from "./market-ticker-bar";
import { TopBar } from "./top-bar";
import { PageTransition } from "./page-transition";
import { OnboardingOverlay } from "./onboarding-overlay";
import { Disclaimer } from "./disclaimer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0a0a12]">
      <BackgroundOrbs />
      <IconSidebar />
      <div className="relative flex min-h-screen flex-col lg:pl-[72px]">
        <MarketTickerBar />
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 lg:px-8 lg:pb-8">
          <Disclaimer compact />
          <div className="mt-4">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <OnboardingOverlay />
    </div>
  );
}
