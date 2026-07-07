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

// ── Generation Pipeline (v2) ───────────────

export type JobStage =
  | 'PENDING'
  | 'ANALYZING'
  | 'SPLITTING'
  | 'OUTLINING'
  | 'STATE_DESIGNING'
  | 'CHAPTER_GENERATING'
  | 'ASSEMBLING'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'FAILED';

export interface JobStatus {
  id: string;
  stage: JobStage;
  progress: number; // 0-100
  currentStep: string;
  totalChapters: number;
  completedChapters: number;
  estimatedRemainingSeconds: number;
  error?: string;
  failedStage?: JobStage;
  recoverable: boolean;
  result?: {
    workId: string;
    title: string;
    nodeCount: number;
    endingCount: number;
  };
  chapterStatuses: Array<{
    index: number;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    nodeCount?: number;
  }>;
  [key: string]: unknown;
}

export type ProgressEventType =
  | 'analyze_start'
  | 'analyze_complete'
  | 'split_complete'
  | 'outline_start'
  | 'outline_chunk'
  | 'outline_complete'
  | 'state_design_start'
  | 'state_design_complete'
  | 'chapter_start'
  | 'chapter_progress'
  | 'chapter_complete'
  | 'assemble_start'
  | 'assemble_complete'
  | 'validate_result'
  | 'complete'
  | 'error';

export interface PipelineProgressEvent {
  type: ProgressEventType;
  jobId: string;
  stage: JobStage;
  progress: number;
  message: string;
  detail?: Record<string, unknown>;
  timestamp: number;
}

export interface ChapterAnalysis {
  index: number;
  title: string;
  wordCount: number;
  preview: string;
  contextHint: string;
}

export interface TextAnalysisResult {
  totalChapters: number;
  totalWords: number;
  chapters: ChapterAnalysis[];
}

export interface StoryOutline {
  title: string;
  genre: string;
  summary: string;
  totalNodesEstimate: number;
  endings: Array<{
    title: string;
    condition: string;
    type: string;
  }>;
  milestones: Array<{
    title: string;
    condition: string;
  }>;
  chapterPlans: Array<{
    chapterIndex: number;
    title: string;
    nodeCountEstimate: number;
    keyEvents: string[];
    branchPoints: string[];
  }>;
}

export interface StateDesign {
  variables: Record<string, number | string | boolean>;
  primaryStats: RPGStat[];
  npcRelations?: NPCRelations;
  timePressure?: TimePressure;
  achievements: Record<string, Achievement>;
}

export interface ChapterResult {
  chapterIndex: number;
  title: string;
  nodes: Record<string, StoryNode>;
  variablesDelta: Record<string, number | string | boolean>;
  flagsAdded: string[];
  npcAffinitiesDelta?: Record<string, number>;
}

export interface PipelineInput {
  text: string;
  genre: string;
  title?: string;
  enableRPG: boolean;
  rules?: CreatorRules;
}
