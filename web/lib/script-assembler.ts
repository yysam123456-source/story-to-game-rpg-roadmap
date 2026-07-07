/**
 * Script Assembler — 将大纲 + 状态设计 + 各章节点合并为完整 StoryScript
 * 处理：节点 ID 去重、next 引用补全、progress 计算、meta 组装
 */

import {
  StoryOutline,
  StateDesign,
  ChapterResult,
  PipelineInput,
  StoryScript,
  StoryNode,
  StoryMeta,
} from '@/types';

export function assembleScript(
  outline: StoryOutline,
  stateDesign: StateDesign,
  chapterResults: ChapterResult[],
  input: PipelineInput
): StoryScript {
  // 1. 合并所有节点
  const allNodes: Record<string, StoryNode> = {};
  let nodeCounter = 0;

  for (const cr of chapterResults) {
    for (const [rawId, node] of Object.entries(cr.nodes)) {
      // 去重：如果 ID 冲突，添加后缀
      let finalId = rawId;
      if (allNodes[finalId]) {
        finalId = `${rawId}_${++nodeCounter}`;
      }
      allNodes[finalId] = { ...node, id: finalId };
    }
  }

  // 2. 补全不存在的 next 引用（指向最后一章的最后一个节点，或者生成一个兜底节点）
  const nodeIds = Object.keys(allNodes);
  const fallbackNodeId = nodeIds[0] || 'node_start';

  for (const node of Object.values(allNodes)) {
    for (const choice of node.choices || []) {
      if (choice.targetNodeId && !allNodes[choice.targetNodeId]) {
        choice.targetNodeId = fallbackNodeId;
      }
    }
    if (node.next && !allNodes[node.next]) {
      node.next = fallbackNodeId;
    }
  }

  // 3. 确定 startNodeId
  const startNodeId = allNodes['node_start']
    ? 'node_start'
    : nodeIds[0] || 'node_start';

  // 4. 计算 progress（均匀分布）
  const totalNodes = nodeIds.length;
  nodeIds.forEach((id, idx) => {
    allNodes[id].progress = Math.round(((idx + 1) / totalNodes) * 100);
  });

  // 5. 组装 meta
  const meta: StoryMeta = {
    title: outline.title || input.title || '未命名作品',
    author: 'AI生成',
    version: '1.0.0',
    description: outline.summary || '',
    genre: outline.genre || input.genre,
    rpg: input.enableRPG
      ? {
          enabled: true,
          primaryStats: stateDesign.primaryStats,
        }
      : undefined,
    rules: input.rules,
  };

  // 6. 组装 endings
  const endings: Record<string, StoryScript['endings'][string]> = {};
  outline.endings.forEach((e, idx) => {
    endings[`ending_${idx}`] = {
      id: `ending_${idx}`,
      title: e.title,
      description: e.condition,
      condition: { variable: 'progress', operator: '>=', value: 100 },
      type: (e.type as any) || 'neutral',
    };
  });

  // 7. 组装 milestones
  const milestones = outline.milestones.map((m, idx) => ({
    id: `milestone_${idx}`,
    name: m.title,
    desc: m.condition,
    condition: { variable: 'progress', operator: '>=' as const, value: Math.round(((idx + 1) / outline.milestones.length) * 100) },
  }));

  // 8. 组装 achievements
  const achievements = stateDesign.achievements || {};

  return {
    meta,
    startNodeId,
    variables: stateDesign.variables,
    flags: [],
    achievements,
    inventory: {},
    milestones,
    endings,
    nodes: allNodes,
    npcRelations: stateDesign.npcRelations,
    timePressure: stateDesign.timePressure,
  };
}
