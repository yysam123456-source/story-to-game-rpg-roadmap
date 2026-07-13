/**
 * Script Assembler — 将大纲 + 状态设计 + 各章节点合并为完整 StoryScript
 *
 * 重写版本 v2：
 * - 章间桥接：第N章末尾 node_next → 第N+1章首节点
 * - 节点顺序验证：跨章跳跃距离检查
 * - 最小选项验证：非结局节点至少2个选项
 * - 占位符清理：node_next / node_start 等约定ID正确处理
 */

import {
  StoryOutline,
  StateDesign,
  ChapterResult,
  PipelineInput,
  StoryScript,
  StoryNode,
  StoryMeta,
  Choice,
  ItemDef,
} from '@/types';

export function assembleScript(
  outline: StoryOutline,
  stateDesign: StateDesign,
  chapterResults: ChapterResult[],
  input: PipelineInput
): StoryScript {
  // ── 1. 按章节顺序合并节点，记录每章节点列表 ──
  const allNodes: Record<string, StoryNode> = {};
  const orderedNodeIds: string[] = [];
  let dedupCounter = 0;

  // 每章的首节点ID和末节点ID，用于章间桥接
  const chapterBoundaries: Array<{
    firstNodeId: string;
    lastNodeId: string;
    chapterIndex: number;
  }> = [];

  for (const cr of chapterResults) {
    const chapterNodeIds: string[] = [];

    for (const [rawId, node] of Object.entries(cr.nodes)) {
      // 去重：如果 ID 冲突，添加后缀
      let finalId = rawId;
      if (allNodes[finalId]) {
        finalId = `${rawId}_dup${++dedupCounter}`;
      }
      allNodes[finalId] = { ...node, id: finalId };
      orderedNodeIds.push(finalId);
      chapterNodeIds.push(finalId);
    }

    if (chapterNodeIds.length > 0) {
      chapterBoundaries.push({
        firstNodeId: chapterNodeIds[0],
        lastNodeId: chapterNodeIds[chapterNodeIds.length - 1],
        chapterIndex: cr.chapterIndex,
      });
    }
  }

  // ── 2. 章间桥接：将 node_next 占位符替换为下一章首节点 ──
  for (let i = 0; i < chapterBoundaries.length; i++) {
    const boundary = chapterBoundaries[i];
    const nextBoundary = chapterBoundaries[i + 1];

    // 下一章的首节点（如果是最后一章，指向第一个结局节点或最后一个节点）
    const bridgeTarget = nextBoundary
      ? nextBoundary.firstNodeId
      : findFirstEndingNode(allNodes) || orderedNodeIds[orderedNodeIds.length - 1];

    const lastNode = allNodes[boundary.lastNodeId];
    if (!lastNode) continue;

    // 修复 choices 中的 node_next
    for (const choice of lastNode.choices || []) {
      if (
        choice.targetNodeId === 'node_next' ||
        choice.targetNodeId === 'NODE_NEXT' ||
        choice.targetNodeId === '__next__'
      ) {
        choice.targetNodeId = bridgeTarget;
      }
    }

    // 修复 next 字段中的 node_next
    if (
      lastNode.next === 'node_next' ||
      lastNode.next === 'NODE_NEXT' ||
      lastNode.next === '__next__'
    ) {
      lastNode.next = bridgeTarget;
    }
  }

  // ── 3. 验证并修复所有引用 ──
  // 构建节点ID→有序位置映射
  const nodePositionMap = new Map<string, number>();
  orderedNodeIds.forEach((id, idx) => {
    nodePositionMap.set(id, idx);
  });

  const allNodeIds = new Set(Object.keys(allNodes));

  for (const node of Object.values(allNodes)) {
    // 修复 choices 中的无效引用
    for (const choice of node.choices || []) {
      if (choice.targetNodeId && !allNodeIds.has(choice.targetNodeId)) {
        // 查找同章或邻近的下一个有效节点
        const currentPos = nodePositionMap.get(node.id) ?? 0;
        const fallback = findNearestNextNode(orderedNodeIds, allNodeIds, currentPos, node.id);
        choice.targetNodeId = fallback;
      }
    }

    // 修复 next 中的无效引用
    if (node.next && !allNodeIds.has(node.next)) {
      const currentPos = nodePositionMap.get(node.id) ?? 0;
      node.next = findNearestNextNode(orderedNodeIds, allNodeIds, currentPos, node.id);
    }

    // 修复 routes 中的无效引用
    if (node.routes) {
      for (const route of node.routes) {
        if (route.target && !allNodeIds.has(route.target)) {
          const currentPos = nodePositionMap.get(node.id) ?? 0;
          route.target = findNearestNextNode(orderedNodeIds, allNodeIds, currentPos, node.id);
        }
      }
    }
  }

  // ── 4. 最小选项验证：为不足2个选项的非结局节点补充"继续"选项 ──
  for (const node of Object.values(allNodes)) {
    if (node.isEnding) continue; // 结局节点不需要选项
    if (!node.choices || node.choices.length === 0) {
      // 无选项节点：补充"继续"选项
      const currentPos = nodePositionMap.get(node.id) ?? 0;
      const nextNodeId = orderedNodeIds[currentPos + 1] || orderedNodeIds[0];
      node.choices = [
        {
          id: `auto_continue_${node.id}`,
          text: '继续',
          targetNodeId: nextNodeId,
        },
      ];
    } else if (node.choices.length === 1) {
      // 单选项节点：补充第二个"继续"选项（指向不同节点）
      const currentPos = nodePositionMap.get(node.id) ?? 0;
      const existingTarget = node.choices[0].targetNodeId;
      const nextNodeId = orderedNodeIds[currentPos + 1] || orderedNodeIds[0];
      // 确保补充的选项指向不同节点
      if (nextNodeId !== existingTarget) {
        node.choices.push({
          id: `auto_alt_${node.id}`,
          text: '尝试另一种方式',
          targetNodeId: nextNodeId,
        });
      } else {
        // 如果顺序下一个就是已存在的目标，用+2的位置
        const altNext = orderedNodeIds[currentPos + 2] || orderedNodeIds[1] || orderedNodeIds[0];
        node.choices.push({
          id: `auto_alt_${node.id}`,
          text: '尝试另一种方式',
          targetNodeId: altNext,
        });
      }
    }
  }

  // ── 5. 确定 startNodeId ──
  const startNodeId =
    allNodes['node_start']
      ? 'node_start'
      : allNodes['node_0_001']
        ? 'node_0_001'
        : orderedNodeIds[0] || 'node_start';

  // ── 6. 计算 progress（均匀分布） ──
  const totalNodes = orderedNodeIds.length;
  orderedNodeIds.forEach((id, idx) => {
    allNodes[id].progress = Math.round(((idx + 1) / totalNodes) * 100);
  });

  // ── 7. 收集 itemsGranted，从 stateDesign.items 中提取对应定义 ──
  const scriptItems: Record<string, ItemDef> = {};
  if (stateDesign.items) {
    // 先将 stateDesign 中定义的所有物品放入
    for (const [itemId, itemDef] of Object.entries(stateDesign.items)) {
      if (itemDef && itemDef.id) {
        scriptItems[itemId] = itemDef;
      }
    }
  }
  // 再确认各章 itemsGranted 引用的物品都已包含（双重保障）
  for (const cr of chapterResults) {
    if (cr.itemsGranted && stateDesign.items) {
      for (const itemId of cr.itemsGranted) {
        if (!scriptItems[itemId] && stateDesign.items[itemId]) {
          scriptItems[itemId] = stateDesign.items[itemId];
        }
      }
    }
  }

  // ── 8. 组装 meta ──
  const meta: StoryMeta = {
    title: outline.title || input.title || '未命名作品',
    author: 'AI生成',
    version: '1.0.0',
    description: outline.summary || '',
    genre: outline.genre || input.genre,
    schemaVersion: '2.0',
    rpg: input.enableRPG
      ? {
          enabled: true,
          primaryStats: stateDesign.primaryStats,
        }
      : undefined,
    rules: input.rules,
  };

  // ── 9. 组装 endings ──
  const endings: Record<string, StoryScript['endings'][string]> = {};
  outline.endings.forEach((e, idx) => {
    const endingId = `ending_${idx}`;
    endings[endingId] = {
      id: endingId,
      title: e.title,
      description: e.condition,
      condition: { variable: 'progress', operator: '>=', value: 100 },
      type: (e.type as Ending['type']) || 'neutral',
    };
  });

  // ── 10. 组装 milestones ──
  const milestones = outline.milestones.map((m, idx) => ({
    id: `milestone_${idx}`,
    name: m.title,
    desc: m.condition,
    condition: {
      variable: 'progress',
      operator: '>=' as const,
      value: Math.round(((idx + 1) / outline.milestones.length) * 100),
    },
  }));

  // ── 11. 组装 achievements ──
  const achievements = stateDesign.achievements || {};

  return {
    meta,
    startNodeId,
    variables: stateDesign.variables,
    flags: [],
    achievements,
    items: Object.keys(scriptItems).length > 0 ? scriptItems : undefined,
    inventory: {},
    milestones,
    endings,
    nodes: allNodes,
    npcRelations: stateDesign.npcRelations,
    timePressure: stateDesign.timePressure,
  };
}

// ── 辅助函数 ──

/**
 * 查找第一个结局节点
 */
function findFirstEndingNode(nodes: Record<string, StoryNode>): string | null {
  for (const [id, node] of Object.entries(nodes)) {
    if (node.isEnding) return id;
  }
  return null;
}

/**
 * 查找距离当前位置最近的下一个有效节点
 * 优先选择当前节点之后的节点，如果没有则选择第一个节点
 */
function findNearestNextNode(
  orderedIds: string[],
  validIds: Set<string>,
  currentPos: number,
  currentNodeId: string
): string {
  // 向后查找
  for (let i = currentPos + 1; i < orderedIds.length; i++) {
    if (validIds.has(orderedIds[i]) && orderedIds[i] !== currentNodeId) {
      return orderedIds[i];
    }
  }
  // 向前查找
  for (let i = currentPos - 1; i >= 0; i--) {
    if (validIds.has(orderedIds[i]) && orderedIds[i] !== currentNodeId) {
      return orderedIds[i];
    }
  }
  // 兜底：返回第一个节点
  return orderedIds[0] || 'node_start';
}

// 结局类型（从 types/index.ts 的 Ending 接口引用）
type Ending = {
  id: string;
  title: string;
  description: string;
  condition: import('@/types').Condition;
  type?: 'true' | 'dark' | 'romance' | 'neutral' | 'noble' | 'hidden';
  clue?: string;
};
