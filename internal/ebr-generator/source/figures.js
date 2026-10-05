// Loads the customer dashboard's own data model, so every figure in the deck is computed by the same code
// that renders customer-health/ (no hand-copied numbers). esbuild compiles the TypeScript at build time.
const path = require('path');
const fs = require('fs');

// The deliverable code lives in send/; this generator is internal and reads from it.
const ROOT = path.resolve(__dirname, '..', '..', '..', 'send');
const esbuild = require(path.join(ROOT, 'node_modules', 'esbuild'));

// The deck only needs data, formatting and scoring, not the React components in the shared index.
const SHARED_DATA = ['data/schema', 'data/loadMetrics', 'data/derive', 'data/events', 'account', 'format', 'pricing', 'health/rampup'];

const entry = `
  export * from '@northstar/shared';
  export { buildModel, AVAILABILITY_TARGET } from './customer-health/src/model';
  export { PILOT, JOINT_ACTIONS, NORTHSTAR_DEPENDENCIES } from './customer-health/src/content';
  export { pctChange, ppChange, fmtPct2, round100 } from './customer-health/src/views/format';
`;

const sharedSlim = {
  name: 'shared-slim',
  setup(build) {
    build.onResolve({ filter: /^@northstar\/shared$/ }, () => ({ path: 'shared-slim', namespace: 'slim' }));
    build.onLoad({ filter: /.*/, namespace: 'slim' }, () => ({
      contents: SHARED_DATA.map((m) => `export * from './${m}';`).join('\n'),
      resolveDir: path.join(ROOT, 'shared', 'src'),
      loader: 'ts',
    }));
  },
};

async function loadFigures() {
  const out = await esbuild.build({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    plugins: [sharedSlim],
    nodePaths: [path.join(ROOT, 'node_modules')],
    logLevel: 'error',
  });
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
  const lib = mod.exports;

  const csv = fs.readFileSync(path.join(ROOT, 'data', 'northstar_flagship_30_day_metrics.csv'), 'utf8');
  const result = lib.loadMetrics(csv);
  if (!result.ok) throw new Error(`CSV failed validation:\n${result.errors.join('\n')}`);
  return { lib, m: lib.buildModel(result.rows) };
}

module.exports = { loadFigures };
