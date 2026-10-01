/**
 * The six provinces of the garden and the paths between them.
 * Positions are tuned for an 780 × 460 viewBox.
 */

export interface GardenNode {
  id: string;
  label: string;
  note: string;
  x: number;
  y: number;
}

export interface GardenEdge {
  source: string;
  target: string;
}

export const GARDEN_NODES: GardenNode[] = [
  { id: 'AI', label: 'AI', note: 'agents & memory', x: 480, y: 88 },
  { id: 'Programming', label: 'Programming', note: 'the craft', x: 208, y: 170 },
  { id: 'Literature', label: 'Literature', note: 'the canon', x: 118, y: 312 },
  { id: 'Philosophy', label: 'Philosophy', note: 'the questions', x: 322, y: 372 },
  { id: 'Systems', label: 'Systems', note: 'architecture', x: 664, y: 246 },
  { id: 'Cognition', label: 'Cognition', note: 'the mind', x: 508, y: 368 },
];

export const GARDEN_EDGES: GardenEdge[] = [
  { source: 'AI', target: 'Cognition' },
  { source: 'AI', target: 'Systems' },
  { source: 'AI', target: 'Programming' },
  { source: 'Programming', target: 'Systems' },
  { source: 'Programming', target: 'Cognition' },
  { source: 'Systems', target: 'Philosophy' },
  { source: 'Systems', target: 'Cognition' },
  { source: 'Philosophy', target: 'Literature' },
  { source: 'Philosophy', target: 'Cognition' },
  { source: 'Literature', target: 'Cognition' },
];