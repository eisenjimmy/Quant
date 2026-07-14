import { useApp } from '../store';
import { AnalysisLab } from './AnalysisLab';
import { MarketPulse } from './MarketPulse';
import { NewsFeed } from './NewsFeed';
import { SignalBoard } from './SignalBoard';
import { SettingsPanel } from './SettingsPanel';
import '../styles/analysis.css';
import '../styles/signals.css';

export function CenterTabs() {
  const { state, actions } = useApp();
  return (
    <div className="center-tabs">
      <div className="ct-bar" role="tablist" aria-label="Center workspace">
        <button
          type="button"
          role="tab"
          aria-selected={state.centerTab === 'pulse'}
          className={state.centerTab === 'pulse' ? 'ct-tab is-active' : 'ct-tab'}
          onClick={() => actions.setCenterTab('pulse')}
        >
          Market Pulse
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={state.centerTab === 'news'}
          className={state.centerTab === 'news' ? 'ct-tab is-active' : 'ct-tab'}
          onClick={() => actions.setCenterTab('news')}
        >
          Market News
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={state.centerTab === 'analysis'}
          className={state.centerTab === 'analysis' ? 'ct-tab is-active' : 'ct-tab'}
          onClick={() => actions.setCenterTab('analysis')}
        >
          Analysis Lab
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={state.centerTab === 'signals'}
          className={state.centerTab === 'signals' ? 'ct-tab is-active' : 'ct-tab'}
          onClick={() => actions.setCenterTab('signals')}
        >
          Signal Board
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={state.centerTab === 'settings'}
          className={state.centerTab === 'settings' ? 'ct-tab is-active' : 'ct-tab'}
          onClick={() => actions.setCenterTab('settings')}
        >
          Settings
        </button>
      </div>
      <div className="ct-panel">
        {state.centerTab === 'pulse' && <MarketPulse />}
        {state.centerTab === 'news' && <NewsFeed />}
        {state.centerTab === 'analysis' && <AnalysisLab />}
        {state.centerTab === 'signals' && <SignalBoard />}
        {state.centerTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}
