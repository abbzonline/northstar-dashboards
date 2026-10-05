/**
 * Expansion-plan content for the internal view.
 *
 * SCENARIO ASSUMPTIONS: the brief promised short descriptions of the four sister brands but none were
 * supplied. Brand names, volumes, catalogues and tooling below are invented to be consistent with the
 * agreed scenario (Northstar is an outerwear holding company; each brand has its own catalogue, tone,
 * return policies, tooling and team; sister brands carry higher volumes than Atlas). Edit here.
 * Owners are roles, not named people. Dates assume the EBR is held in October 2026.
 */

export type Stage = 'Live' | 'Pilot' | 'Wave 2' | 'Wave 3';
export type Level = 'High' | 'Medium' | 'Low';

export interface Brand {
  name: string;
  positioning: string;
  /** Tier-1 tickets per day. Atlas comes from the dataset; the others are assumed. */
  ticketsPerDay: number | 'from-data';
  catalogue: string;
  toneAndReturns: string;
  tooling: string;
  stage: Stage;
  timing: string;
  /** Internal judgement of how likely the brand converts on this timeline. */
  confidence?: Level;
  note: string;
}

export const BRANDS: Brand[] = [
  {
    name: 'Atlas',
    positioning: 'Flagship. Premium technical outerwear',
    ticketsPerDay: 'from-data',
    catalogue: '~3k SKUs, spec-heavy',
    toneAndReturns: 'Expert, understated · 30-day returns',
    tooling: 'Zendesk',
    stage: 'Live',
    timing: 'Live since Aug 2026',
    note: 'Adapter loads unchanged onto the shared deployment',
  },
  {
    name: 'Ridgeline',
    positioning: 'Mountain and technical outerwear',
    ticketsPerDay: 6200,
    catalogue: '~4k SKUs, spec-heavy',
    toneAndReturns: 'Adventurous · 60-day returns',
    tooling: 'Zendesk',
    stage: 'Pilot',
    timing: 'Nov–Dec 2026',
    confidence: 'High',
    note: 'Closest to Atlas, same tooling, moderate volume: limits blast radius while testing tone and policy transfer',
  },
  {
    name: 'Halden',
    positioning: 'Mass-market everyday outerwear',
    ticketsPerDay: 13900,
    catalogue: '~18k SKUs, broad',
    toneAndReturns: 'Friendly, direct · 30-day returns',
    tooling: 'Salesforce Service Cloud',
    stage: 'Wave 2',
    timing: 'Q1 2027',
    confidence: 'Medium',
    note: 'Largest volume and value; new tooling integration; Agentforce is in the account',
  },
  {
    name: 'Polar',
    positioning: "Children's outerwear",
    ticketsPerDay: 7100,
    catalogue: '~6k SKUs, size-led',
    toneAndReturns: 'Warm, reassuring · 90-day returns',
    tooling: 'Gorgias',
    stage: 'Wave 2',
    timing: 'Q1 2027',
    confidence: 'Medium',
    note: 'Sizing and product-safety queries need strict grounding',
  },
  {
    name: 'Harbour & Hide',
    positioning: 'Heritage waxed and leather, repairs',
    ticketsPerDay: 5400,
    catalogue: '~2k SKUs plus repair services',
    toneAndReturns: 'Formal, heritage · repairs and warranty',
    tooling: 'In-house',
    stage: 'Wave 3',
    timing: 'Q2 2027',
    confidence: 'Low',
    note: 'Repair workflows and in-house tooling; prompt + RAG arm may suffice',
  },
];

export interface Stakeholder {
  role: string;
  side: 'Northstar' | 'Fireworks';
  status: 'Champion' | 'Engaged' | 'Gap';
  note: string;
}

export const STAKEHOLDERS: Stakeholder[] = [
  { role: 'Atlas CX operations lead', side: 'Northstar', status: 'Champion', note: 'Day-to-day owner; drove the move to production' },
  { role: 'VP Customer Experience (group)', side: 'Northstar', status: 'Engaged', note: 'EBR audience; candidate business sponsor for the rollout' },
  { role: 'VP Engineering (group)', side: 'Northstar', status: 'Engaged', note: 'EBR audience; owns routing, RAG and integration work' },
  { role: 'Group executive (COO / CDO)', side: 'Northstar', status: 'Gap', note: 'Needed for group-level approval and budget' },
  { role: 'Sister-brand CX leads (×4)', side: 'Northstar', status: 'Gap', note: 'No contact yet; pilot brand first' },
  { role: 'Legal / data protection', side: 'Northstar', status: 'Gap', note: 'Sign-off for de-branded Atlas transcripts' },
];

export interface Dependency {
  item: string;
  side: 'Fireworks' | 'Northstar';
  owner: string;
  neededBy: string;
  status: 'Not started' | 'In progress' | 'Done';
}

export const DEPENDENCIES: Dependency[] = [
  { item: 'Scale-up threshold retune and promotion pre-warm runbook on the Atlas deployment (no warm floor)', side: 'Fireworks', owner: 'Fireworks Engineering', neededBy: '16 Oct', status: 'In progress' },
  { item: 'BF16 capacity reserved for the shared multi-LoRA deployment (EU region; 1.5x region-restricted rate confirmed with Northstar)', side: 'Fireworks', owner: 'Fireworks Infrastructure', neededBy: '6 Nov', status: 'Not started' },
  { item: 'Ridgeline adapter training and per-brand eval sets', side: 'Fireworks', owner: 'Fireworks Applied ML', neededBy: '20 Nov', status: 'Not started' },
  { item: 'Ridgeline transcripts and catalogue export', side: 'Northstar', owner: 'Northstar CX operations', neededBy: '6 Nov', status: 'Not started' },
  { item: 'Legal sign-off on de-branded Atlas transcripts', side: 'Northstar', owner: 'Northstar Legal', neededBy: '6 Nov', status: 'Not started' },
  { item: 'Routing layer supports percentage traffic split and rollback', side: 'Northstar', owner: 'Northstar Engineering', neededBy: '13 Nov', status: 'Not started' },
];

export interface Competitor {
  threat: string;
  where: string;
  level: Level;
  response: string;
}

export const COMPETITORS: Competitor[] = [
  {
    threat: 'Salesforce Agentforce',
    where: 'Halden (Service Cloud)',
    level: 'High',
    response: 'Bundled with existing tooling. Counter with Atlas evidence: automation and cost per resolution on a model Northstar owns',
  },
  {
    threat: 'Zendesk AI agents',
    where: 'Atlas, Ridgeline (Zendesk)',
    level: 'Medium',
    response: 'Native to the helpdesk. Counter with brand-specific quality (tone, return-policy accuracy) the generic agent lacks',
  },
  {
    threat: 'Gorgias AI Agent',
    where: 'Polar (Gorgias)',
    level: 'Medium',
    response: 'E-commerce native. Counter with grounding on sizing and product-safety content',
  },
  {
    threat: 'Other inference providers (Together AI, Baseten)',
    where: 'Whole account',
    level: 'Medium',
    response: 'LoRA adapters are portable across providers serving the same base. Hold the account on consolidation economics, latency and support quality',
  },
  {
    threat: 'Frontier-lab APIs',
    where: 'Harbour & Hide (in-house build)',
    level: 'Low',
    response: 'Likely prototyping route for an in-house team. Counter on cost at volume and model ownership',
  },
];

export interface Decision {
  decision: string;
  owner: string;
  by: string;
  recommendation: string;
}

export const DECISIONS: Decision[] = [
  {
    decision: 'Fund the Ridgeline pilot',
    owner: 'Field CTO, Europe',
    by: '16 Oct',
    recommendation: 'Yes: Applied ML time for one adapter and eval set at no charge, in exchange for a named group sponsor and agreed success criteria',
  },
  {
    decision: 'Commercial structure for the group rollout',
    owner: 'Account Executive + Sales leadership',
    by: '20 Oct',
    recommendation: 'Committed spend on the shared deployment from wave 2, so the GPU floor is underwritten; pay-as-you-go during the pilot',
  },
  {
    decision: 'Reserve BF16 capacity before commitment',
    owner: 'Fireworks Infrastructure lead',
    by: '30 Oct',
    recommendation: 'Reserve for the pilot window only (weeks, not months); release if the pilot slips',
  },
  {
    decision: 'Availability target to offer on the shared deployment',
    owner: 'Field CTO + Engineering',
    by: '20 Oct',
    recommendation: 'Do not offer 99.9% on Atlas alone. A warm minimum replica costs ~$4.6k/month extra ($7.6k with EU placement) for ~22 minutes/month of availability (99.85% → 99.9%). Keep scale-to-zero, retune scale-up thresholds, pre-warm for known promotions via the scale API. Offer 99.9% with a warm floor on the shared deployment from the pilot onward, where five brands utilise it',
  },
];

export interface Action {
  action: string;
  owner: string;
  due: string;
  status: 'Not started' | 'In progress' | 'Done';
}

export const ACTIONS: Action[] = [
  { action: "Confirm Atlas's serving set-up (shape, minimum replicas, scale-to-zero) and how reported spend maps to the bill", owner: 'Deployment Strategist + Fireworks Engineering', due: '9 Oct', status: 'In progress' },
  { action: 'Retune scale-up thresholds and write the promotion pre-warm runbook (no warm floor on Atlas alone)', owner: 'Fireworks Engineering + Northstar CX operations', due: '16 Oct', status: 'Not started' },
  { action: 'Obtain pre-launch handle-time and CSAT baselines to substantiate the −35% and +12 claims', owner: 'Deployment Strategist + Northstar CX', due: '16 Oct', status: 'Not started' },
  { action: 'Hold the EBR: secure a group sponsor, agree the Ridgeline pilot and success criteria', owner: 'Deployment Strategist + Account Executive', due: '22 Oct', status: 'Not started' },
  { action: 'Joint review of rising requests per ticket (4.6 → 6.2)', owner: 'Deployment Strategist + Northstar Engineering', due: '23 Oct', status: 'Not started' },
  { action: 'Stand up the shared BF16 deployment, load the Atlas adapter, confirm parity on the eval set', owner: 'Fireworks Engineering', due: '13 Nov', status: 'Not started' },
  { action: 'Train the Ridgeline adapter and run the two-arm pilot', owner: 'Fireworks Applied ML + Northstar Engineering', due: '18 Dec', status: 'Not started' },
  { action: 'Pilot readout and wave-2 go / no-go', owner: 'Deployment Strategist + Northstar sponsor', due: '8 Jan 2027', status: 'Not started' },
];

export interface Risk {
  kind: 'Technical' | 'Relationship' | 'Execution';
  risk: string;
  evidence: string;
  mitigation: string;
  owner: string;
}

/** The top three risks the brief asks for. Distinct from the scoring-derived "Focus areas" on the health view. */
export const RISKS: Risk[] = [
  {
    kind: 'Technical',
    risk: 'Availability misses from scale-up behaviour under bursts',
    evidence: '27 of 31 days below 99.9%; P95 spikes on 9 and 21 Aug; a deployment scaled to zero answers the next request with a 503 while it spins up',
    mitigation: 'Retune scale-up thresholds and pre-warm for known promotions now; the warm floor arrives with the shared deployment, where five brands make it utilised capacity rather than idle cost (see Decisions)',
    owner: 'Fireworks Engineering',
  },
  {
    kind: 'Relationship',
    risk: 'No sponsor above brand level, so the account stays single-brand',
    evidence: 'Group executive and all four sister-brand CX leads are gaps in stakeholder coverage; Partnership scores 2',
    mitigation: 'Use the EBR to secure a named group sponsor and agree the Ridgeline pilot and success criteria jointly',
    owner: 'Deployment Strategist + Account Executive',
  },
  {
    kind: 'Execution',
    risk: 'Pilot slips on data: Ridgeline transcripts, catalogue export and legal sign-off on de-branded Atlas data',
    evidence: 'Three Northstar-owned dependencies due 6 Nov, none started; without them arm B cannot train and arm A cannot ground',
    mitigation: 'Dependencies tabled at the EBR with owners; fallback is arm A (prompt + RAG, no adapter) if transcripts are late',
    owner: 'Deployment Strategist + Northstar CX operations',
  },
];
