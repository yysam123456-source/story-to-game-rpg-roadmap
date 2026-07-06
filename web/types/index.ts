// 作品元数据
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

// RPG 数值定义
export interface RPGStat {
  key: string;
  label: string;
  type: 'text' | 'number' | 'bar';
  max?: number;
  maxKey?: string;
  icon?: string;
}

export interface RPGConfig {
  enabled: boolean;
  primaryStats: RPGStat[];
}

// 选择分支
export interface Choice {
  id: string;
  text: string;
  targetNodeId: string;
  condition?: Condition;
  weight?: number;
  changes?: Change[];
}

// 条件判断
export interface Condition {
  variable: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
}

// 数值变更
export interface Change {
  variable: string;
  value: number | string | boolean;
  show?: boolean;
}

// 故事节点
export interface StoryNode {
  id: string;
  segments: string[];
  choices: Choice[];
  background?: string;
  music?: string;
  isEnding?: boolean;
  endingType?: string;
  achievements?: string[];
}

// 成就
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// 故事剧本完整结构
export interface StoryScript {
  meta: {
    title: string;
    author: string;
    genre: string;
    version: string;
    description?: string;
    rpg?: RPGConfig;
  };
  variables: Record<string, number | string | boolean>;
  flags: string[];
  nodes: Record<string, StoryNode>;
  startNodeId: string;
  endings: Record<string, { title: string; description: string; condition: Condition }>;
  achievements: Record<string, Achievement>;
}

// API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 生成请求
export interface GenerateRequest {
  text: string;
  genre: string;
  title?: string;
  enableRPG?: boolean;
}

// 生成进度
export interface GenerateProgress {
  step: number;
  totalSteps: number;
  message: string;
  status: 'running' | 'completed' | 'error';
}
