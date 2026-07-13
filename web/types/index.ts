// ============================================
// Story to Game - TypeScript Types (Schema v2.0)
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
  title?: string;
  defaultAffinity?: number;
  categories?: string[];
  avatar?: string;
  stand?: string;
  color?: string;
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
  /** v2.0: narrative description shown when stat reaches certain thresholds */
  narrativeHint?: string;
}

export interface RPGConfig {
  enabled?: boolean;
  mode?: 'light' | 'standard';
  conditionDisplay?: 'hide' | 'disabled';
  primaryStats?: RPGStat[];
  hiddenStats?: string[];
  /** v2.0: check configuration */
  checkStyle?: 'dice_2d6' | 'percentile' | 'threshold';
  /** v2.0: whether to show check dice roll animation */
  showCheckAnimation?: boolean;
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
  /** v2.0: schema version for frontend compatibility detection */
  schemaVersion?: string;
}

// ── Scene ──────────────────────────────────
export interface Scene {
  id?: string;
  name: string;
  type?: 'major' | 'minor';
  description?: string;
  arrival?: string;
  duration?: number;
  /** v2.0: background image identifier */
  background?: string;
  /** v2.0: whether this scene has explorable elements */
  explorable?: boolean;
}

// ── Condition ──────────────────────────────
export interface Condition {
  variable?: string;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value?: number | string | boolean;
  flag?: string;
  /** v2.0: negate condition */
  not?: boolean;
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
  /** v2.0: check if a specific skill/stat meets a threshold (for passive checks) */
  skill?: string;
  min?: number;
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
    /** v2.0: item usage definition */
    usable?: boolean;
    /** v2.0: which scenes/nodes this item can be used in (null = any) */
    usableIn?: string[] | null;
    /** v2.0: effect when item is used */
    onUse?: {
      text: string;
      changes?: Record<string, number>;
      flag?: string;
      unlock?: string;
      consume?: boolean;
    };
  }>;
  affinityChanges?: AffinityChange[];
}

// ── Segment ────────────────────────────────
export type Segment =
  | string
  | { type: 'narrative' | 'dialogue' | 'inner_monologue'; text: string; speaker?: string; effect?: string; };

// ── v2.0: Check Definition ─────────────────
export interface CheckDef {
  /** Which skill/stat to roll against */
  skill: string;
  /** Difficulty class — target number to beat */
  dc: number;
  /** Resource cost to attempt (e.g. hun_li: 5) */
  cost?: Record<string, number>;
  /** Narrative text when check succeeds */
  onSuccess: {
    text: string | Segment[];
    changes?: Record<string, number>;
    /** Items granted on success */
    grantItems?: string[];
    /** Info flags unlocked */
    unlock?: string;
    /** NPC affinity changes */
    affinityChanges?: AffinityChange[];
    /** Additional segments to append */
    extraSegments?: Segment[];
  };
  /** Narrative text when check fails — always valid, never a dead end */
  onFailure: {
    text: string | Segment[];
    changes?: Record<string, number>;
    /** Flags set on failure */
    flag?: string;
    /** Additional segments to append */
    extraSegments?: Segment[];
  };
  /** Whether this check is passive (auto-triggered) vs active (player clicks) */
  passive?: boolean;
  /** Whether this check can be retried */
  retryable?: boolean;
  /** Custom label shown in UI (default: "【技能名】检定") */
  label?: string;
}

// ── v2.0: Explorable Element ───────────────
export interface Explorable {
  id: string;
  /** Label shown in UI as the interactive element */
  label: string;
  /** Brief description on hover */
  description?: string;
  /** Optional skill check to investigate */
  check?: CheckDef;
  /** Direct result if no check (or check auto-passed) */
  result?: {
    text: string | Segment[];
    changes?: Record<string, number>;
    grantItems?: string[];
    unlock?: string;
    affinityChanges?: AffinityChange[];
  };
  /** Condition to show this explorable (e.g. player has a certain flag) */
  condition?: Condition;
  /** Whether this can only be examined once */
  once?: boolean;
  /** Icon identifier */
  icon?: string;
}

// ── v2.0: Dialogue Topic ───────────────────
export interface DialogueTopic {
  id: string;
  /** What the player says/asks (shown as button text) */
  text: string;
  /** NPC's response */
  response: string | Segment[];
  /** Condition to unlock this topic */
  condition?: Condition;
  /** Changes from this dialogue exchange */
  changes?: Record<string, number>;
  /** NPC affinity changes */
  affinityChanges?: AffinityChange[];
  /** Items granted from this dialogue */
  grantItems?: string[];
  /** Info/flag unlocked */
  unlock?: string;
  /** Whether to show a "use item" option in this dialogue */
  canUseItem?: boolean;
  /** Hint text (optional, for weight/importance indication) */
  hint?: string;
}

// ── v2.0: Dialogue Config ──────────────────
export interface DialogueConfig {
  /** NPC id to talk to */
  npc: string;
  /** List of available topics */
  topics: DialogueTopic[];
  /** Custom greeting when opening dialogue */
  greeting?: string | Segment[];
  /** Custom farewell when closing dialogue */
  farewell?: string;
  /** Condition to enter this dialogue node at all */
  condition?: Condition;
}

// ── v2.0: Conditional Segment ──────────────
export interface ConditionalSegment {
  /** Condition for this segment to appear */
  condition: Condition;
  /** Segments to inject when condition is met */
  segments: Segment[];
}

// ── Node Type ──────────────────────────────
export type NodeType =
  | 'narrative'          // Pure narrative, auto-advance via `next`
  | 'exploration'        // Scene with explorable elements
  | 'dialogue'           // NPC dialogue with topic selection
  | 'check'              // Skill check gate
  | 'choice'             // True branch point
  | 'scene_transition'   // Scene change with transition text
  | 'ending';            // Story ending

// ── Choice ─────────────────────────────────
export interface Choice {
  id: string;
  text: string;
  targetNodeId: string;
  condition?: Condition;
  weight?: number | 'minor' | 'major' | 'critical' | 'branch';
  changes?: Change[];
  affinityChanges?: AffinityChange[];
  countdown?: CountdownConfig;
  /** v2.0: hint about risk/reward (shown on hover/long-press) */
  hint?: string;
  /** v2.0: delayed changes that trigger in a later chapter */
  delayedChanges?: Array<{
    /** Chapter index or node ID when changes trigger */
    triggerAt: string;
    changes: Record<string, number | string | boolean>;
    /** Text shown to player when delayed change activates */
    reminderText?: string;
  }>;
}

// ── Story Node (v2.0) ─────────────────────
export interface StoryNode {
  id: string;
  /** v2.0: node type determines rendering and interaction mode */
  type?: NodeType;
  chapterTitle?: string;
  title?: string;
  chapter?: string;
  scene?: Scene | string;
  progress?: number;
  theme?: string;
  ambient?: string;

  // ── Narrative Content ──
  /** Main narrative segments (can be strings or structured objects) */
  segments?: Segment[];

  // ── v2.0: Exploration ──
  /** List of explorable elements (only for type=exploration or scenes with explorable=true) */
  explorables?: Explorable[];

  // ── v2.0: Dialogue ──
  /** Dialogue configuration (only for type=dialogue) */
  dialogue?: DialogueConfig;

  // ── v2.0: Skill Check ──
  /** Check configuration (only for type=check) */
  check?: CheckDef;

  // ── v2.0: Conditional Segments ──
  /** Extra segments injected based on player state */
  conditionalSegments?: ConditionalSegment[];

  // ── Choices (only for type=choice) ──
  choices?: Choice[];

  // ── Auto-advance ──
  next?: string;
  routes?: Array<{
    condition: Condition | string;
    target: string;
  }>;

  // ── Legacy compat ──
  isEnding?: boolean;
  candidateEndings?: string[];
  interactions?: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
  delayedChanges?: Array<{
    triggerNodeId: string;
    changes: Change[] | Record<string, number>;
  }>;
  condition?: Condition;
  countdown?: CountdownConfig;
  /** @deprecated Use dialogue.topics instead */
  npcDialogue?: Array<{
    npcId: string;
    text: string;
  }>;

  // ── v2.0: Item Grants ──
  /** Items automatically granted when entering this node */
  grantItems?: Array<{
    item: string;
    category?: string;
    qty?: number;
    desc?: string;
  }>;
}

// ── v2.0: Item Definition (in StoryScript) ──
export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  category?: string;
  qty?: number;
  /** Whether this item can be used by the player */
  usable?: boolean;
  /** In which node IDs / scene names this item can be used (null = anywhere) */
  usableIn?: string[] | null;
  /** Effect when used */
  onUse?: {
    text: string;
    changes?: Record<string, number>;
    flag?: string;
    unlock?: string;
    consume?: boolean;
  };
  /** Icon identifier */
  icon?: string;
}

// ── Achievement ────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  autoUnlock?: {
    condition: Condition;
    check: 'onStatChange' | 'onNodeEnter' | 'onEnding' | 'onFlagAdd' | 'onItemUse' | 'onCheckSuccess' | 'onDialogueComplete';
  };
}

// ── Ending ─────────────────────────────────
export interface Ending {
  id: string;
  title: string;
  description: string;
  condition: Condition;
  type?: 'true' | 'dark' | 'romance' | 'neutral' | 'noble' | 'hidden' | 'good' | 'bad' | 'bittersweet' | 'epic' | 'peaceful';
  tone?: string;
  clue?: string;
}

// ── Mission ────────────────────────────────
export interface Mission {
  title?: string;
  objective?: string;
  deadline?: number;
}

// ── Story Script (v2.0) ────────────────────
export interface StoryScript {
  meta: StoryMeta;
  startNodeId: string;
  variables: Record<string, number | string | boolean>;
  flags?: string[];
  achievements: Record<string, Achievement> | Array<Achievement>;
  /** v2.0: full item definitions with usage */
  items?: Record<string, ItemDef>;
  /** @deprecated Use items instead */
  inventory?: Record<string, Array<{ name: string; desc: string; qty: number }>>;
  milestones: Array<{
    id: string;
    name: string;
    desc: string;
    condition: Condition;
    category?: string;
  }>;
  endings: Record<string, Ending> | Array<Ending>;
  mission?: Mission;
  nodes: Record<string, StoryNode> | Array<StoryNode>;
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
  /** v2.0: schema version of the stored script */
  schemaVersion?: string;
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
  progress: number;
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
  | 'assemble_progress'
  | 'assemble_fixes'
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
    /** v2.0: explicit type annotations for each branch point */
    branchPoints: Array<{
      description: string;
      type: 'choice' | 'check' | 'exploration' | 'dialogue';
      skill?: string;
    }>;
    /** v2.0: planned exploration elements */
    explorations?: string[];
    /** v2.0: planned check points */
    checks?: Array<{ skill: string; dc: number; description: string }>;
    /** v2.0: planned dialogue scenes */
    dialogues?: Array<{ npcId: string; topicCount: number }>;
  }>;
}

export interface StateDesign {
  variables: Record<string, number | string | boolean>;
  primaryStats: RPGStat[];
  npcRelations?: NPCRelations;
  timePressure?: TimePressure;
  achievements: Record<string, Achievement>;
  /** v2.0: item definitions designed at state design stage */
  items?: Record<string, ItemDef>;
}

export interface ChapterResult {
  chapterIndex: number;
  title: string;
  nodes: Record<string, StoryNode>;
  variablesDelta: Record<string, number | string | boolean>;
  flagsAdded: string[];
  npcAffinitiesDelta?: Record<string, number>;
  /** v2.0: items granted in this chapter */
  itemsGranted?: string[];
}

export interface PipelineInput {
  text: string;
  genre: string;
  title?: string;
  enableRPG: boolean;
  rules?: CreatorRules;
}