import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@northstar/shared/global.css';
import { loadMetrics } from '@northstar/shared';
// Bundled at build time. Replace the file in /data and restart `npm run dev:internal` to use new data.
import csvText from '../../data/northstar_flagship_30_day_metrics.csv?raw';
import { App } from './App';

const result = loadMetrics(csvText);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App result={result} />
  </StrictMode>,
);
