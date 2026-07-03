import React from 'react';
import { AppProvider, useApp } from './store';
import { TopBar } from './components/TopBar';
import { Watchlist } from './components/Watchlist';
import { NewsFeed } from './components/NewsFeed';
import { EarningsCalendar } from './components/EarningsCalendar';
import { ChartModal } from './components/ChartModal';
import { OnboardingWizard } from './components/OnboardingWizard';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <div>
            <h1>Something went wrong</h1>
            <p>{String(this.state.error)}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Shell() {
  const { state } = useApp();
  return (
    <div className="app-shell">
      <div className="topbar-slot">
        <TopBar />
      </div>
      <aside className="sidebar-slot" aria-label="Watchlist">
        <Watchlist />
      </aside>
      <main className="center-slot" aria-label="Market news">
        <NewsFeed />
      </main>
      <section className="right-slot" aria-label="Earnings calendar">
        <EarningsCalendar />
      </section>
      {state.modalSymbol && (
        <ChartModal key={state.modalSymbol} symbol={state.modalSymbol} />
      )}
      <OnboardingWizard />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ErrorBoundary>
  );
}
