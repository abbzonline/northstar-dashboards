/**
 * Customer-facing next steps. Written for Northstar's VP Customer Experience and VP Engineering.
 *
 * Joint actions mirror the account team's action list (same dates and owners), filtered to those with a
 * Northstar owner or the Deployment Strategist. A boundary test on the internal side checks the two
 * stay in step. This app never imports from the internal dashboard.
 */

export const PILOT = {
  brand: 'Ridgeline',
  window: 'Nov–Dec 2026, four weeks of live traffic',
  why: 'Closest to Atlas in product and customer, on the same Zendesk tooling, at moderate volume: it tests tone and return-policy transfer with limited exposure.',
  arms: [
    {
      name: 'Arm A',
      setup: 'Base model + Ridgeline system prompt + Ridgeline knowledge index',
      purpose: 'Lowest cost: no brand-specific training',
    },
    {
      name: 'Arm B',
      setup: 'Base model + Ridgeline adapter + Ridgeline system prompt + knowledge index',
      purpose: 'Brand-tuned: tone and policy behaviour learned from Ridgeline transcripts',
    },
  ],
  criteria: [
    { metric: 'Grounded answers', target: '≥ 95%' },
    { metric: 'Eval pass rate', target: '≥ 93%' },
    { metric: 'Escalation rate', target: '≤ 12%' },
    { metric: 'CSAT', target: '≥ Atlas week-4 (83.7)' },
    { metric: 'P95 latency', target: '≤ 1.3 s, held through one promotion peak' },
  ],
  evidence:
    'Wave 2 goes ahead when one arm clears every criterion over four weeks. The arm is chosen on quality, and if Arm A is enough no adapter is trained. Ridgeline baselines (handle time, CSAT) are captured before launch so the uplift can be measured directly this time.',
};

export interface CustomerDependency {
  item: string;
  owner: string;
  neededBy: string;
}

export const NORTHSTAR_DEPENDENCIES: CustomerDependency[] = [
  { item: 'Evaluation rubric and per-dimension results for Atlas', owner: 'Northstar CX operations', neededBy: '6 Nov' },
  { item: 'Ridgeline support transcripts', owner: 'Northstar CX operations', neededBy: '6 Nov' },
  { item: 'Ridgeline catalogue export for the knowledge index', owner: 'Northstar CX operations', neededBy: '6 Nov' },
  { item: 'Legal sign-off to use de-branded Atlas transcripts for shared support skills', owner: 'Northstar Legal', neededBy: '6 Nov' },
  { item: 'Routing layer supports a percentage traffic split with rollback', owner: 'Northstar Engineering', neededBy: '13 Nov' },
];

export interface JointAction {
  action: string;
  owner: string;
  due: string;
}

export const JOINT_ACTIONS: JointAction[] = [
  { action: 'Retune scale-up thresholds and agree a pre-warm runbook for planned promotions', owner: 'Fireworks Engineering + Northstar CX operations', due: '16 Oct' },
  { action: 'Share pre-launch handle-time and CSAT baselines for Atlas', owner: 'Deployment Strategist + Northstar CX', due: '16 Oct' },
  { action: 'Executive review: agree a group sponsor, the Ridgeline pilot and its success criteria', owner: 'Deployment Strategist + Account Executive', due: '22 Oct' },
  { action: 'Joint review of rising requests per ticket (4.6 → 6.2)', owner: 'Deployment Strategist + Northstar Engineering', due: '23 Oct' },
  { action: 'Train the Ridgeline adapter and run the two-arm pilot', owner: 'Fireworks Applied ML + Northstar Engineering', due: '18 Dec' },
  { action: 'Pilot readout and wave-2 decision', owner: 'Deployment Strategist + Northstar sponsor', due: '8 Jan 2027' },
];
