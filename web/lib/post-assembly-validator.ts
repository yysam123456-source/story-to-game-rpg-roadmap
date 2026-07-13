/**
 * Post-Assembly Validator — 剧本组装完成后全量验证
 *
 * 参考 Python 验证器 validate.py 的 34 项规则，在 TypeScript 侧实现
 * 覆盖 8 大类验证规则：
 *   1. 基础完整性
 *   2. 引用完整性
 *   3. 可达性分析（BFS）
 *   4. 选项质量
 *   5. 跳跃距离检查
 *   6. 结局节点验证
 *   7. 变量引用验证
 *   8. 章间衔接验证
 *
 * 同时提供 autoFixScript 自动修复常见问题。
 */

import type { StoryScript, StoryNode, Choice } from '@/types';

// ── 验证结果类型 ──────────────────────────

export interface ValidationResultStats {
  totalNodes: number;
  storyNodes: number;
  endingNodes: number;
  reachableNodes: number;
  unreachableNodes: number;
  totalChoices: number;
  totalEndings: number;
  totalVariables: number;
  totalAchievements: number;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  stats: ValidationResultStats;
}

export interface AutoFixResult {
  script: StoryScript;
  fixes: string[];
}

// ── 常量 ──────────────────────────────────

/** 占位符 ID 模式（如 "node_next"、"TODO"、"待定" 等） */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^node_next$/i,
  /^next_node$/i,
  /^node_\d*_next$/i,
  /^chapter_next$/i,
  /^next_chapter$/i,
  /^todo/i,
  /^placeholder/i,
  /^tbd$/i,
  /^xxx+$/i,
  /^pending/i,
  /^fixme/i,
  /^待定$/,
  /^占位/,
];

/** 跳跃距离阈值 */
const JUMP_WARN_THRESHOLD = 5;
const JUMP_ERROR_THRESHOLD = 10;

/** 不可达比例阈值 */
const UNREACHABLE_ERROR_RATIO = 0.3;

/** 最小节点数 */
const MIN_NODES = 3;

/** 非结局节点最小选项数 */
const MIN_CHOICES = 2;

// ── 辅助函数 ──────────────────────────────

/**
 * 判断一个 ID 是否为占位符
 */
function isPlaceholder(id: string): boolean {
  if (!id) return false;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(id));
}

/**
 * 收集一个节点的所有出边目标（next + choices + routes）
 */
function getNodeTargets(node: StoryNode): string[] {
  const targets: string[] = [];
  if (node.next) {
    targets.push(node.next);
  }
  for (const choice of node.choices ?? []) {
    if (choice.targetNodeId) {
      targets.push(choice.targetNodeId);
    }
  }
  for (const route of node.routes ?? []) {
    if (route.target) {
      targets.push(route.target);
    }
  }
  return targets;
}

/**
 * 深拷贝（StoryScript 仅含 JSON 可序列化数据）
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * 循环引用检测（DFS 白/灰/黑三色标记法）
 * 返回所有检测到的环路，每个环路为节点 ID 数组（已去重）
 */
function detectCycles(
  nodes: Record<string, StoryNode>,
  validNodeIds: Set<string>
): string[][] {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map<string, number>();
  for (const id of Array.from(validNodeIds)) {
    color.set(id, WHITE);
  }

  const foundKeys = new Set<string>();
  const cycles: string[][] = [];
  const stack: string[] = [];

  function dfs(u: string): void {
    color.set(u, GRAY);
    stack.push(u);

    const node = nodes[u];
    if (node) {
      for (const target of getNodeTargets(node)) {
        if (!validNodeIds.has(target)) continue;
        const c = color.get(target);
        if (c === GRAY) {
          // 发现回边 → 存在环
          const cycleStart = stack.indexOf(target);
          const cycle = stack.slice(cycleStart);
          if (cycle.length > 0) {
            // 归一化：旋转到最小元素开头，用于去重
            const minVal = cycle.reduce((a, b) => (a < b ? a : b));
            const minIdx = cycle.indexOf(minVal);
            const normalized = [
              ...cycle.slice(minIdx),
              ...cycle.slice(0, minIdx),
            ];
            const key = normalized.join('|');
            if (!foundKeys.has(key)) {
              foundKeys.add(key);
              cycles.push(normalized);
            }
          }
        } else if (c === WHITE) {
          dfs(target);
        }
      }
    }

    stack.pop();
    color.set(u, BLACK);
  }

  for (const id of Array.from(validNodeIds)) {
    if (color.get(id) === WHITE) {
      dfs(id);
    }
  }

  return cycles;
}

// ── 主验证函数 ────────────────────────────

/**
 * 对组装完成的剧本进行全量验证
 *
 * @param script 待验证的剧本
 * @returns errors（致命错误）、warnings（警告）、stats（统计信息）
 */
export function validateScript(script: StoryScript): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodes = script.nodes ?? {};
  const nodeIds = Object.keys(nodes);
  const nodeSet = new Set(nodeIds);

  // ================================================================
  // 1. 基础完整性
  // ================================================================

  // 1.1 meta.title 不为空
  if (!script.meta?.title?.trim()) {
    errors.push('[基础完整性] meta.title 为空');
  }

  // 1.2 startNodeId 存在且指向有效节点
  if (!script.startNodeId) {
    errors.push('[基础完整性] startNodeId 缺失');
  } else if (!nodeSet.has(script.startNodeId)) {
    errors.push(
      `[基础完整性] startNodeId "${script.startNodeId}" 不存在于 nodes 中`
    );
  }

  // 1.3 节点数 >= 3
  if (nodeIds.length < MIN_NODES) {
    errors.push(
      `[基础完整性] 节点数 ${nodeIds.length} 少于最小要求 ${MIN_NODES}`
    );
  }

  // 1.4 每个节点必须有 id、segments（非空数组）、choices（数组）
  for (const [nid, node] of Object.entries(nodes)) {
    if (!node.id) {
      errors.push(`[基础完整性] 节点 "${nid}" 缺少 id 字段`);
    }
    if (!Array.isArray(node.segments) || node.segments.length === 0) {
      errors.push(`[基础完整性] 节点 "${nid}" 缺少非空 segments 数组`);
    }
    if (!Array.isArray(node.choices)) {
      errors.push(`[基础完整性] 节点 "${nid}" 缺少 choices 数组`);
    }
  }

  // ================================================================
  // 2. 引用完整性
  // ================================================================

  for (const [nid, node] of Object.entries(nodes)) {
    const choices = node.choices ?? [];

    // 2.1 所有 choice.targetNodeId 指向存在的节点
    for (let idx = 0; idx < choices.length; idx++) {
      const target = choices[idx].targetNodeId;
      if (target && !nodeSet.has(target)) {
        errors.push(
          `[引用完整性] 节点 "${nid}" choice[${idx}].targetNodeId "${target}" 指向不存在的节点`
        );
      }
    }

    // 2.2 所有 node.next 指向存在的节点
    if (node.next && !nodeSet.has(node.next)) {
      errors.push(
        `[引用完整性] 节点 "${nid}" next "${node.next}" 指向不存在的节点`
      );
    }

    // 2.3 所有 routes[].target 指向存在的节点
    const routes = node.routes ?? [];
    for (let idx = 0; idx < routes.length; idx++) {
      const target = routes[idx].target;
      if (target && !nodeSet.has(target)) {
        errors.push(
          `[引用完整性] 节点 "${nid}" routes[${idx}].target "${target}" 指向不存在的节点`
        );
      }
    }
  }

  // ================================================================
  // 3. 可达性分析（BFS）
  // ================================================================

  const reachable = new Set<string>();
  const bfsQueue: string[] = [];

  if (script.startNodeId && nodeSet.has(script.startNodeId)) {
    bfsQueue.push(script.startNodeId);
    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift() as string;
      if (reachable.has(current)) continue;
      reachable.add(current);

      const node = nodes[current];
      if (!node) continue;

      for (const target of getNodeTargets(node)) {
        if (nodeSet.has(target) && !reachable.has(target)) {
          bfsQueue.push(target);
        }
      }
    }
  }

  const unreachable = nodeIds.filter((id) => !reachable.has(id));

  // 3.1 报告不可达的节点（warnings）
  for (const nid of unreachable) {
    warnings.push(
      `[可达性] 节点 "${nid}" 不可达（从 startNodeId 无法到达）`
    );
  }

  // 3.2 超过 30% 的节点不可达 → error
  if (nodeIds.length > 0) {
    const unreachableRatio = unreachable.length / nodeIds.length;
    if (unreachableRatio > UNREACHABLE_ERROR_RATIO) {
      errors.push(
        `[可达性] ${unreachable.length}/${nodeIds.length}（${Math.round(
          unreachableRatio * 100
        )}%）节点不可达，超过 ${UNREACHABLE_ERROR_RATIO * 100}% 阈值`
      );
    }
  }

  // ================================================================
  // 4. 选项质量
  // ================================================================

  for (const [nid, node] of Object.entries(nodes)) {
    const choices = node.choices ?? [];

    if (!node.isEnding) {
      // 4.1 每个非结局节点至少有 2 个选项（不足则 warning）
      if (choices.length < MIN_CHOICES) {
        warnings.push(
          `[选项质量] 非结局节点 "${nid}" 仅有 ${choices.length} 个选项（建议至少 ${MIN_CHOICES} 个）`
        );
      }

      // 4.3 检测单选项节点：只有 1 个 choice 的节点（warning）
      if (choices.length === 1) {
        warnings.push(
          `[选项质量] 节点 "${nid}" 只有 1 个 choice（单选项节点，缺乏选择自由度）`
        );
      }
    }

    // 4.2 检测"伪选择"：一个节点的所有 choice 都指向同一个 targetNodeId
    if (choices.length >= MIN_CHOICES) {
      const targets = choices
        .map((c) => c.targetNodeId)
        .filter((t): t is string => Boolean(t));
      const uniqueTargets = new Set(targets);
      if (targets.length === choices.length && uniqueTargets.size === 1) {
        warnings.push(
          `[选项质量] 节点 "${nid}" 的 ${choices.length} 个选项全部指向同一节点 "${targets[0]}"（伪选择，缺乏实际分支）`
        );
      }
    }
  }

  // ================================================================
  // 5. 跳跃距离检查
  // ================================================================

  const orderMap = new Map<string, number>();
  nodeIds.forEach((id, idx) => orderMap.set(id, idx));

  for (const [nid, node] of Object.entries(nodes)) {
    const currentIdx = orderMap.get(nid);
    if (currentIdx === undefined) continue;

    const choices = node.choices ?? [];
    for (let idx = 0; idx < choices.length; idx++) {
      const target = choices[idx].targetNodeId;
      if (!target) continue;
      const targetIdx = orderMap.get(target);
      if (targetIdx === undefined) continue;

      const distance = Math.abs(targetIdx - currentIdx);
      if (distance > JUMP_ERROR_THRESHOLD) {
        errors.push(
          `[跳跃距离] 节点 "${nid}" choice[${idx}] 跳跃距离 ${distance}（位置 ${currentIdx}→${targetIdx}），超过 ${JUMP_ERROR_THRESHOLD}`
        );
      } else if (distance > JUMP_WARN_THRESHOLD) {
        warnings.push(
          `[跳跃距离] 节点 "${nid}" choice[${idx}] 跳跃距离 ${distance}（位置 ${currentIdx}→${targetIdx}），超过 ${JUMP_WARN_THRESHOLD}`
        );
      }
    }
  }

  // ================================================================
  // 6. 结局节点验证
  // ================================================================

  const endingNodeIds = nodeIds.filter((id) => nodes[id]?.isEnding === true);

  for (const nid of endingNodeIds) {
    const node = nodes[nid];

    // 6.1 结局节点不应有 choices
    if ((node.choices ?? []).length > 0) {
      errors.push(
        `[结局节点] 结局节点 "${nid}" 不应包含 choices（已有 ${(node.choices ?? []).length} 个）`
      );
    }

    // 6.2 结局节点应有 candidateEndings
    if (!node.candidateEndings || node.candidateEndings.length === 0) {
      warnings.push(
        `[结局节点] 结局节点 "${nid}" 缺少 candidateEndings`
      );
    }
  }

  // 6.3 至少有一个结局节点
  if (endingNodeIds.length === 0) {
    errors.push(
      '[结局节点] 不存在任何结局节点（isEnding=true），至少需要一个结局'
    );
  }

  // ================================================================
  // 7. 变量引用验证
  // ================================================================

  const variableSet = new Set(Object.keys(script.variables ?? {}));

  // 7.1 choice.changes 中的 variable 名应存在于 script.variables 中
  for (const [nid, node] of Object.entries(nodes)) {
    const choices = node.choices ?? [];
    for (let cidx = 0; cidx < choices.length; cidx++) {
      const changes = choices[cidx].changes ?? [];
      for (let chidx = 0; chidx < changes.length; chidx++) {
        const varName = changes[chidx].variable;
        if (varName && !variableSet.has(varName)) {
          warnings.push(
            `[变量引用] 节点 "${nid}" choice[${cidx}].changes[${chidx}] 引用变量 "${varName}" 未在 variables 中定义`
          );
        }
      }
    }
  }

  // 7.2 achievement 的 autoUnlock.condition.variable 应存在
  for (const [aid, adef] of Object.entries(script.achievements ?? {})) {
    const cond = adef.autoUnlock?.condition;
    if (cond?.variable && !variableSet.has(cond.variable)) {
      warnings.push(
        `[变量引用] achievement "${aid}" autoUnlock.condition 引用变量 "${cond.variable}" 未在 variables 中定义`
      );
    }
  }

  // ================================================================
  // 8. 章间衔接验证
  // ================================================================

  // 8.1 检查是否存在 "node_next" 或类似的占位符 ID（error）
  for (const [nid, node] of Object.entries(nodes)) {
    // 检查节点 ID 本身是否为占位符
    if (isPlaceholder(nid)) {
      errors.push(`[章间衔接] 节点 ID "${nid}" 为占位符，需要替换为真实 ID`);
    }

    // 检查 choice.targetNodeId
    const choices = node.choices ?? [];
    for (let idx = 0; idx < choices.length; idx++) {
      const target = choices[idx].targetNodeId;
      if (target && isPlaceholder(target)) {
        errors.push(
          `[章间衔接] 节点 "${nid}" choice[${idx}].targetNodeId "${target}" 为占位符`
        );
      }
    }

    // 检查 node.next
    if (node.next && isPlaceholder(node.next)) {
      errors.push(
        `[章间衔接] 节点 "${nid}" next "${node.next}" 为占位符`
      );
    }

    // 检查 routes[].target
    const routes = node.routes ?? [];
    for (let idx = 0; idx < routes.length; idx++) {
      const target = routes[idx].target;
      if (target && isPlaceholder(target)) {
        errors.push(
          `[章间衔接] 节点 "${nid}" routes[${idx}].target "${target}" 为占位符`
        );
      }
    }
  }

  // 8.2 检查是否存在循环引用（A→B→A）
  const cycles = detectCycles(nodes, nodeSet);
  for (const cycle of cycles) {
    errors.push(
      `[章间衔接] 检测到循环引用：${cycle.join(' → ')} → ${cycle[0]}`
    );
  }

  // ================================================================
  // 统计信息
  // ================================================================

  const stats: ValidationResultStats = {
    totalNodes: nodeIds.length,
    storyNodes: nodeIds.length - endingNodeIds.length,
    endingNodes: endingNodeIds.length,
    reachableNodes: reachable.size,
    unreachableNodes: unreachable.length,
    totalChoices: Object.values(nodes).reduce(
      (sum, n) => sum + (n.choices?.length ?? 0),
      0
    ),
    totalEndings: Object.keys(script.endings ?? {}).length,
    totalVariables: Object.keys(script.variables ?? {}).length,
    totalAchievements: Object.keys(script.achievements ?? {}).length,
  };

  return { errors, warnings, stats };
}

// ── 自动修复函数 ──────────────────────────

/**
 * 自动修复剧本中的常见问题
 *
 * 修复内容：
 *   1. 将 "node_next" 等占位符替换为同章下一个节点或下一章首节点
 *   2. 为不足 2 个选项的节点补充一个"继续"选项（指向下一个顺序节点）
 *   3. 将指向不存在节点的引用替换为最近的可用节点
 *   4. 为结局节点清除 choices
 *
 * @param script 待修复的剧本（不会被修改，返回新副本）
 * @returns 修复后的剧本及修复记录
 */
export function autoFixScript(script: StoryScript): AutoFixResult {
  const fixes: string[] = [];
  const fixed: StoryScript = deepClone(script);

  const nodes = fixed.nodes ?? {};
  const nodeIds = Object.keys(nodes);
  const nodeSet = new Set(nodeIds);
  const orderMap = new Map<string, number>();
  nodeIds.forEach((id, idx) => orderMap.set(id, idx));

  // 结局节点 & 兜底节点
  const endingNodeIds = nodeIds.filter((id) => nodes[id]?.isEnding === true);
  const firstEndingId = endingNodeIds[0] ?? nodeIds[0] ?? '';

  // ── 构建章节分组（按 chapterTitle） ──
  const chapterOrder: string[] = [];
  const chapterMap = new Map<string, string[]>();

  for (const id of nodeIds) {
    const ch = nodes[id].chapterTitle ?? '__default__';
    if (!chapterMap.has(ch)) {
      chapterMap.set(ch, []);
      chapterOrder.push(ch);
    }
    chapterMap.get(ch)!.push(id);
  }

  /**
   * 获取"下一个顺序节点"：
   * 优先返回同章下一个节点，其次返回下一章首节点，最后兜底结局节点
   */
  function getNextSequential(currentId: string): string {
    const ch = nodes[currentId]?.chapterTitle ?? '__default__';
    const group = chapterMap.get(ch);

    if (group) {
      const idxInChapter = group.indexOf(currentId);
      if (idxInChapter >= 0 && idxInChapter + 1 < group.length) {
        return group[idxInChapter + 1];
      }
    }

    // 下一章首节点
    const chapterIdx = chapterOrder.indexOf(ch);
    if (chapterIdx >= 0 && chapterIdx + 1 < chapterOrder.length) {
      const nextGroup = chapterMap.get(chapterOrder[chapterIdx + 1]);
      if (nextGroup && nextGroup.length > 0) {
        return nextGroup[0];
      }
    }

    return firstEndingId;
  }

  /**
   * 获取最近的可用节点（按索引距离最近）
   */
  function getNearestAvailable(currentId: string, invalidId: string): string {
    // 优先用下一个顺序节点
    const next = getNextSequential(currentId);
    if (next && next !== invalidId) {
      return next;
    }

    // 否则找全局索引距离最近的可用节点
    const currentIdx = orderMap.get(currentId) ?? 0;
    let best = '';
    let bestDist = Infinity;

    for (const id of nodeIds) {
      if (id === invalidId) continue;
      const dist = Math.abs((orderMap.get(id) ?? 0) - currentIdx);
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }

    return best || firstEndingId;
  }

  // ================================================================
  // Fix 1: 将 "node_next" 等占位符替换为同章下一个节点或下一章首节点
  // ================================================================

  for (const [nid, node] of Object.entries(nodes)) {
    const choices = node.choices ?? [];
    for (let idx = 0; idx < choices.length; idx++) {
      const target = choices[idx].targetNodeId;
      if (target && isPlaceholder(target)) {
        const replacement = getNextSequential(nid);
        fixes.push(
          `节点 "${nid}" choice[${idx}] 占位符 "${target}" → "${replacement}"`
        );
        choices[idx].targetNodeId = replacement;
      }
    }

    if (node.next && isPlaceholder(node.next)) {
      const replacement = getNextSequential(nid);
      fixes.push(
        `节点 "${nid}" next 占位符 "${node.next}" → "${replacement}"`
      );
      node.next = replacement;
    }

    const routes = node.routes ?? [];
    for (let idx = 0; idx < routes.length; idx++) {
      const target = routes[idx].target;
      if (target && isPlaceholder(target)) {
        const replacement = getNextSequential(nid);
        fixes.push(
          `节点 "${nid}" routes[${idx}] 占位符 "${target}" → "${replacement}"`
        );
        routes[idx].target = replacement;
      }
    }
  }

  // ================================================================
  // Fix 2: 将指向不存在节点的引用替换为最近的可用节点
  // ================================================================

  for (const [nid, node] of Object.entries(nodes)) {
    const choices = node.choices ?? [];
    for (let idx = 0; idx < choices.length; idx++) {
      const target = choices[idx].targetNodeId;
      if (target && !nodeSet.has(target)) {
        const replacement = getNearestAvailable(nid, target);
        fixes.push(
          `节点 "${nid}" choice[${idx}] 无效引用 "${target}" → "${replacement}"`
        );
        choices[idx].targetNodeId = replacement;
      }
    }

    if (node.next && !nodeSet.has(node.next)) {
      const replacement = getNearestAvailable(nid, node.next);
      fixes.push(
        `节点 "${nid}" next 无效引用 "${node.next}" → "${replacement}"`
      );
      node.next = replacement;
    }

    const routes = node.routes ?? [];
    for (let idx = 0; idx < routes.length; idx++) {
      const target = routes[idx].target;
      if (target && !nodeSet.has(target)) {
        const replacement = getNearestAvailable(nid, target);
        fixes.push(
          `节点 "${nid}" routes[${idx}] 无效引用 "${target}" → "${replacement}"`
        );
        routes[idx].target = replacement;
      }
    }
  }

  // ================================================================
  // Fix 3: 为不足 2 个选项的非结局节点补充"继续"选项
  // ================================================================

  let continueChoiceCounter = 0;

  for (const [nid, node] of Object.entries(nodes)) {
    if (node.isEnding) continue;

    const choices = node.choices ?? [];
    if (choices.length < MIN_CHOICES) {
      const target = getNextSequential(nid);
      const newChoice: Choice = {
        id: `auto_continue_${nid}_${continueChoiceCounter++}`,
        text: '继续',
        targetNodeId: target,
      };
      choices.push(newChoice);
      node.choices = choices;
      fixes.push(
        `节点 "${nid}" 选项不足 ${MIN_CHOICES} 个，已补充"继续"选项 → "${target}"`
      );
    }
  }

  // ================================================================
  // Fix 4: 为结局节点清除 choices
  // ================================================================

  for (const [nid, node] of Object.entries(nodes)) {
    if (node.isEnding && (node.choices?.length ?? 0) > 0) {
      const removed = node.choices!.length;
      node.choices = [];
      fixes.push(`结局节点 "${nid}" 已清除 ${removed} 个 choices`);
    }
  }

  return { script: fixed, fixes };
}
