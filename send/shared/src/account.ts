/**
 * Scenario details shared by both dashboards. The brief leaves the brand unnamed, so these are assumptions:
 * Northstar is an outerwear-fashion holding company and Atlas is its flagship brand.
 * The CSV's own `deployment` column still reads `northstar-flagship-support-ft-v1`; the dashboards
 * show the model ID below instead.
 */
export const ACCOUNT = {
  company: 'Northstar Retail Group',
  sector: 'Outerwear fashion holding company',
  brand: 'Atlas',
  modelId: 'northstar-atlas-support-ft-v1',
} as const;
