// ============================================
// Story to Game - TypeScript Types (Schema v1.1)
// ============================================

// ── Creator Rules ──────────────────────────
export interface CreatorRules {
  pacing?: 'compact' | 'balanced' | 'relaxed';
  choiceStyle?: 'direct' | 'inner_monologue' | 'action';
  statImpact?: 'light' | 'medium' | 'heavy';
  hiddenContentRatio?: 'low' | 'medium' | 'high';
  endingBias?: 'heavy' | 'balanced' | 'dark' | 'random';
  narrativePerson?: 'first' | 'second';
  dialogueDensity?: 'low' | 'medium' | 'high';
  informationAsymmetry?: boolean;
  timePressure?: boolean;
  npcRelations?: boolean;
}

// ── NPC Relations ──────────────────────────
export interface NPC {
  id: string;
  name: string;
  defaultAffinity?: number;
  categories?: string[];
  avatar?: string;
  description?: string;
}

export interface NPCRelations {
  npcs: NPC[];
  affinityRanges?: Record<string, [number, number]>;
}

export interface AffinityChange {
  npcId: string;
  delta: number;
}

// ── Time Pressure ──────────────────────────
export interface TimePressure {
  enabled: boolean;
  mode: 'turn' | 'countdown';
  turnsPerCycle?: number;
  globalDecay?: Array<{ variable: string; delta: number }>;
  deadlineNodes?: string[];
}

export interface CountdownConfig {
  seconds: number;
  defaultChoiceIndex?: number;
}

// ── RPG ────────────────────────────────────
export interface RPGStat {
  key: string;
  label: string;
  type: 'text' | 'number' | 'bar';
  max?: number;
  min?: number;
  default?: string;
  tone?: 'positive' | 'danger' | 'neutral';
}

export interface RPGConfig {
  enabled?: boolean;
  mode?: 'light' | 'standard';
  conditionDisplay?: 'hide' | 'disabled';
  primaryStats?: RPGStat[];
  hiddenStats?: string[];
}

// ── Meta ───────────────────────────────────
export interface StoryMeta {
  title: string;
  author: string;
  version?: string;
  description?: string;
  genre: string;
  theme?: string;
  ambient?: string;
  cover?: {
    label?: string;
    tagline?: string;
  };
  variableName?: string;
  initialVariable?: number;
  rpg?: RPGConfig;
  rules?: CreatorRules;
}

// ── Scene ──────────────────────────────────
export interface Scene {
  id?: string;
  name: string;
  type?: 'major' | 'minor';
  description?: string;
  arrival?: string;
  duration?: number;
}

// ── Condition ──────────────────────────────
export interface Condition {
  variable?: string;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value?: number | string | boolean;
  flag?: string;
  item?: string;
  count?: number;
  interaction?: string;
  all?: Condition[];
  any?: Condition[];
  affinity?: {
    npcId: string;
    operator: string;
    value: number;
  };
}

// ── Change ─────────────────────────────────
export interface Change {
  variable?: string;
  value?: number | string | boolean;
  show?: boolean;
  addFlag?: string;
  addFlags?: string[];
  removeFlag?: string;
  importantFlag?: { flag: string; label: string };
  unlockAchievement?: string;
  unlockAchievements?: string[];
  inventory?: Array<{
    item: string;
    category?: string;
    qty?: number;
    desc?: string;
  }>;
  affinityChanges?: AffinityChange[];
}

// ── Choice ─────────────────────────────────
export interface Choice {
  id: string;
  text: string;
  targetNodeId: string;
  condition?: Condition;
  weight?: number;
  changes?: Change[];
  affinityChanges?: AffinityChange[];
  countdown?: CountdownConfig;
}

// ── Story Node ─────────────────────────────
export interface StoryNode {
  id: string;
  chapterTitle?: string;
  title?: string;
  scene?: Scene | string;
  progress?: number;
  theme?: string;
  ambient?: string;
  segments: string[];
  choices: Choice[];
  next?: string;
  routes?: Array<{
    condition: Condition;
    target: string;
  }>;
  isEnding?: boolean;
  candidateEndings?: string[];
  interactions?: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
  delayedChanges?: Array<{
    triggerNodeId: string;
    changes: Change[];
  }>;
  condition?: Condition;
  countdown?: CountdownConfig;
  npcDialogue?: Array<{
    npcId: string;
    text: string;
  }>;
}

// ── Achievement ────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  rarity?: 'common' | 'rare' | 'legendary';
  autoUnlock?: {
    condition: Condition;
    check: 'onStatChange' | 'onNodeEnter' | 'onEnding' | 'onFlagAdd';
  };
}

// ── Ending ─────────────────────────────────
export interface Ending {
  id: string;
  title: string;
  description: string;
  condition: Condition;
  type?: 'true' | 'dark' | 'romance' | 'neutral' | 'noble' | 'hidden';
  clue?: string;
}

// ── Mission ────────────────────────────────
export interface Mission {
  title?: string;
  objective?: string;
  deadline?: number;
}

// ── Story Script ───────────────────────────
export interface StoryScript {
  meta: StoryMeta;
  startNodeId: string;
  variables: Record<string, number | string | boolean>;
  flags: string[];
  achievements: Record<string, Achievement>;
  inventory: Record<string, Array<{ name: string; desc: string; qty: number }>>;
  milestones: Array<{
    id: string;
    name: string;
    desc: string;
    condition: Condition;
    category?: string;
  }>;
  endings: Record<string, Ending>;
  mission?: Mission;
  nodes: Record<string, StoryNode>;
  npcRelations?: NPCRelations;
  timePressure?: TimePressure;
}

// ── Work Meta ──────────────────────────────
export interface WorkMeta {
  id: string;
  title: string;
  genre: string;
  author: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  endingCount: number;
  playCount: number;
  coverImage?: string;
}

// ── API ────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GenerateRequest {
  text: string;
  genre: string;
  title?: string;
  enableRPG?: boolean;
  rules?: CreatorRules;
}

export interface GenerateProgress {
  step: number;
  totalSteps: number;
  message: string;
  status: 'running' | 'completed' | 'error';
}
