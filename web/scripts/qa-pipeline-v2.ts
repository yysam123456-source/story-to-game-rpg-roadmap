/**
 * Pipeline v2 全流程 QA 校验脚本
 * 模拟大模型视角，验证每个模块的输入输出和行为
 */

import { JobQueue } from '../lib/job-queue';
import { TextSplitter } from '../lib/text-splitter';
import { assembleScript } from '../lib/script-assembler';
import {
  TextAnalysisResult,
  StoryOutline,
  StateDesign,
  ChapterResult,
  PipelineInput,
  StoryScript,
} from '../types';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${msg}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${msg}`);
  }
}

console.log('========================================');
console.log('Pipeline v2 全流程 QA 校验');
console.log('========================================\n');

// ========== 1. JobQueue 状态机校验 ==========
console.log('【模块 1】JobQueue 状态机');
{
  const jq = new JobQueue();

  // 1.1 创建任务
  const jobId = jq.createJob({ textLength: 10000, genre: 'xianxia', title: '测试作品' });
  assert(typeof jobId === 'string' && jobId.startsWith('job_'), '创建任务返回合法 jobId');

  const job = jq.getJob(jobId);
  assert(job?.stage === 'PENDING', '初始状态为 PENDING');
  assert(job?.progress === 0, '初始进度为 0');
  assert(job?.totalChapters === 0, '初始章节数为 0');
  assert(job?.recoverable === true, '默认可恢复');

  // 1.2 状态推进
  jq.updateStage(jobId, 'ANALYZING', 0, '分析中');
  assert(jq.getJob(jobId)?.stage === 'ANALYZING', 'updateStage 成功');

  jq.setChapterCount(jobId, 5);
  assert(jq.getJob(jobId)?.totalChapters === 5, 'setChapterCount 成功');
  assert(jq.getJob(jobId)?.chapterStatuses.length === 5, '章节状态数组长度正确');

  jq.updateChapterStatus(jobId, 0, 'running', '第一章');
  assert(jq.getJob(jobId)?.chapterStatuses[0].status === 'running', 'updateChapterStatus 成功');

  jq.updateChapterStatus(jobId, 0, 'completed', '第一章', 8);
  assert(jq.getJob(jobId)?.completedChapters === 1, 'completedChapters 自动计算');
  assert(jq.getJob(jobId)?.chapterStatuses[0].nodeCount === 8, 'nodeCount 记录正确');

  jq.setEstimatedTime(jobId, 120);
  assert(jq.getJob(jobId)?.estimatedRemainingSeconds === 120, '预计时间设置正确');

  // 1.3 失败与重试
  jq.failJob(jobId, 'AI API 超时', 'CHAPTER_GENERATING', true);
  assert(jq.getJob(jobId)?.stage === 'FAILED', 'failJob 设置 FAILED');
  assert(jq.getJob(jobId)?.error === 'AI API 超时', '错误信息记录');
  assert(jq.getJob(jobId)?.recoverable === true, '可恢复标记正确');

  const resetOk = jq.resetForRetry(jobId);
  assert(resetOk === true, 'resetForRetry 成功');
  assert(jq.getJob(jobId)?.stage === 'CHAPTER_GENERATING', '重试后恢复到失败前阶段');
  assert(jq.getJob(jobId)?.error === undefined, '错误信息已清除');

  // 1.4 SSE 订阅
  const events: any[] = [];
  const unsub = jq.subscribe(jobId, (e) => events.push(e));
  jq.broadcast(jobId, 'chapter_start', '测试广播', { foo: 1 });
  assert(events.length === 1, '广播事件被订阅者接收');
  assert(events[0].type === 'chapter_start', '事件类型正确');
  assert(events[0].jobId === jobId, '事件 jobId 正确');
  unsub();

  // 1.5 不可恢复任务
  const jobId2 = jq.createJob({ textLength: 100, genre: 'general' });
  jq.failJob(jobId2, '永久错误', 'ASSEMBLING', false);
  assert(jq.resetForRetry(jobId2) === false, '不可恢复任务拒绝重试');

  // 1.6 动态属性存储（Pipeline 阶段间传递数据）
  const jobId3 = jq.createJob({ textLength: 1000, genre: 'horror' });
  const job3 = jq.getJob(jobId3)!;
  (job3 as any).__analysis = { totalChapters: 3 };
  assert((job3 as any).__analysis.totalChapters === 3, 'JobStatus 支持动态属性存储');

  console.log('');
}

// ========== 2. TextSplitter 文本分析校验 ==========
console.log('【模块 2】TextSplitter 文本分析');
{
  const splitter = new TextSplitter();

  // 2.1 带章节标题的长文本
  const longText = `
第一章 初入江湖

江湖风云变幻，少年李白怀揣梦想踏入江湖。他手持长剑，背负行囊，眼中闪烁着对未知的渴望。

第二章 剑道传承

在深山古寺中，李白遇到了隐世高人。高人见他资质不凡，决定将毕生剑法传授于他。

第三章 决战巅峰

十年磨一剑，李白终于迎来了与宿敌的决战。两人于华山之巅展开惊天对决。
`.trim();

  const analysis = splitter.analyze(longText);
  assert(analysis.totalChapters === 3, '识别出 3 个章节');
  assert(analysis.totalWords > 0, '字数统计大于 0');
  assert(analysis.chapters[0].title.includes('第一章'), '第一章标题识别正确');
  assert(analysis.chapters[1].title.includes('第二章'), '第二章标题识别正确');
  assert(analysis.chapters[2].title.includes('第三章'), '第三章标题识别正确');
  assert(analysis.chapters.every(c => c.wordCount > 0), '每章字数均大于 0');
  assert(analysis.chapters.every(c => c.preview.length > 0), '每章均有预览摘要');

  // 2.2 无标题文本（语义分块）
  const plainText = Array(20).fill('这是一个没有章节标题的普通段落，讲述了一个平凡的故事。').join('\n\n');
  const analysis2 = splitter.analyze(plainText);
  assert(analysis2.totalChapters >= 1, '无标题文本也能拆分出至少 1 个块');

  // 2.3 上下文提取
  const context = splitter.extractChapterContext(longText, analysis.chapters[1], analysis.chapters);
  assert(context.content.length > 0, '上下文内容非空');
  assert(context.prevHint.includes('第一章'), 'prevHint 包含前一章信息');
  assert(context.nextHint.includes('第三章'), 'nextHint 包含后一章信息');

  // 2.4 章节摘要
  const summary = splitter.generateChapterSummary(analysis.chapters[0]);
  assert(summary.includes('第一章'), '摘要包含章节标题');
  assert(summary.includes('字'), '摘要包含字数信息');

  console.log('');
}

// ========== 3. ScriptAssembler 组装校验 ==========
console.log('【模块 3】ScriptAssembler 组装逻辑');
{
  const outline: StoryOutline = {
    title: '测试大纲',
    genre: 'xianxia',
    summary: '测试摘要',
    totalNodesEstimate: 10,
    endings: [
      { title: '真结局', condition: '达到100层', type: 'true' },
      { title: '普通结局', condition: '未达到', type: 'neutral' },
    ],
    milestones: [
      { title: '初入门派', condition: '加入门派' },
    ],
    chapterPlans: [
      { chapterIndex: 0, title: '第一章', nodeCountEstimate: 5, keyEvents: ['入门'], branchPoints: ['选择门派'] },
    ],
  };

  const stateDesign: StateDesign = {
    variables: { strength: 10, mana: 5 },
    primaryStats: [{ key: 'strength', label: '力量', type: 'number', max: 100, tone: 'positive' }],
    achievements: {
      first_step: { id: 'first_step', title: '第一步', description: '开始冒险', category: 'general', rarity: 'common' },
    },
  };

  const chapterResults: ChapterResult[] = [
    {
      chapterIndex: 0,
      title: '第一章',
      nodes: {
        node_0_001: {
          id: 'node_0_001',
          chapterTitle: '第一章',
          segments: ['你站在山门前。'],
          choices: [
            { id: 'c1', text: '进入', targetNodeId: 'node_0_002', changes: [{ variable: 'strength', value: 1, show: true }] },
            { id: 'c2', text: '离开', targetNodeId: 'node_0_003' },
          ],
        },
        node_0_002: {
          id: 'node_0_002',
          chapterTitle: '第一章',
          segments: ['你进入了山门。'],
          choices: [],
        },
        node_0_003: {
          id: 'node_0_003',
          chapterTitle: '第一章',
          segments: ['你转身离开。'],
          choices: [],
        },
      },
      variablesDelta: { strength: 1 },
      flagsAdded: ['entered_gate'],
    },
  ];

  const input: PipelineInput = {
    text: '测试文本',
    genre: 'xianxia',
    title: '测试作品',
    enableRPG: true,
    rules: { pacing: 'balanced' },
  };

  const script = assembleScript(outline, stateDesign, chapterResults, input);

  assert(script.meta.title === '测试大纲', 'meta.title 优先使用 outline.title');
  assert(script.meta.genre === 'xianxia', 'meta.genre 正确');
  assert(script.meta.rpg?.enabled === true, 'RPG 启用标记正确');
  assert(Object.keys(script.nodes).length === 3, '节点总数正确（3个）');
  assert(script.startNodeId === 'node_0_001' || script.startNodeId === 'node_start', 'startNodeId 合法');
  assert(script.variables.strength === 10, 'variables 继承正确');
  assert(Object.keys(script.achievements).length === 1, 'achievements 组装正确');
  assert(Object.keys(script.endings).length === 2, 'endings 组装正确');
  assert(script.milestones.length === 1, 'milestones 组装正确');

  // next 引用补全测试：指向不存在的节点会被修复
  const badChapter: ChapterResult = {
    chapterIndex: 1,
    title: '第二章',
    nodes: {
      node_1_001: {
        id: 'node_1_001',
        segments: ['你看到一扇门。'],
        choices: [
          { id: 'c3', text: '开门', targetNodeId: 'nonexistent_node' },
        ],
      },
    },
    variablesDelta: {},
    flagsAdded: [],
  };

  const script2 = assembleScript(outline, stateDesign, [chapterResults[0], badChapter], input);
  const fixedNode = script2.nodes['node_1_001'];
  assert(fixedNode.choices[0].targetNodeId !== 'nonexistent_node', '不存在的 targetNodeId 被修复');

  // ID 去重测试
  const dupChapter: ChapterResult = {
    chapterIndex: 2,
    title: '第三章',
    nodes: {
      node_0_001: {
        id: 'node_0_001',
        segments: ['重复的ID。'],
        choices: [],
      },
    },
    variablesDelta: {},
    flagsAdded: [],
  };

  const script3 = assembleScript(outline, stateDesign, [chapterResults[0], dupChapter], input);
  const nodeIds = Object.keys(script3.nodes);
  assert(nodeIds.length === 4, '重复 ID 被去重后为 4 个节点');

  console.log('');
}

// ========== 4. API 路由接口校验 ==========
console.log('【模块 4】API 路由接口');
{
  // 4.1 验证路由文件存在
  const fs = require('fs');
  const path = require('path');

  const apiDir = path.join(__dirname, '..', 'app', 'api', 'generate');
  assert(fs.existsSync(path.join(apiDir, 'route.ts')), 'POST 启动路由存在');
  assert(fs.existsSync(path.join(apiDir, '[id]', 'route.ts')), 'SSE 查询+重试路由存在');

  // 4.2 验证路由导出
  const postRoute = require('../app/api/generate/route.ts');
  // Next.js 路由导出的是命名导出 POST/GET，这里主要确认文件可加载
  assert(typeof postRoute === 'object' || typeof postRoute === 'function', 'POST 路由模块可加载');

  console.log('');
}

// ========== 5. 端到端流程推演 ==========
console.log('【模块 5】端到端流程推演');
{
  // 模拟用户输入百万字小说的场景
  const megaText = Array(500).fill('这是第X章的内容。江湖风云变幻，少年英雄踏遍山河。').join('\n\n第一章 开篇\n\n');

  const splitter = new TextSplitter();
  const analysis = splitter.analyze(megaText);

  // 即使文本很长，也会被拆分成多个块
  assert(analysis.totalChapters >= 1, '长文本被拆分');
  assert(analysis.totalWords > 0, '字数统计正确');

  // 模拟 Pipeline 阶段流转
  const jq = new JobQueue();
  const jobId = jq.createJob({ textLength: megaText.length, genre: 'xianxia' });

  // PENDING -> ANALYZING
  jq.updateStage(jobId, 'ANALYZING', 0, '正在分析文本结构...');
  assert(jq.getJob(jobId)?.stage === 'ANALYZING', '阶段 0: ANALYZING');

  // ANALYZING -> SPLITTING
  jq.updateStage(jobId, 'SPLITTING', 5, '文本拆分完成');
  jq.setChapterCount(jobId, analysis.totalChapters);
  assert(jq.getJob(jobId)?.stage === 'SPLITTING', '阶段 1: SPLITTING');

  // SPLITTING -> OUTLINING
  jq.updateStage(jobId, 'OUTLINING', 10, '正在构思剧情骨架...');
  assert(jq.getJob(jobId)?.stage === 'OUTLINING', '阶段 2: OUTLINING');

  // OUTLINING -> STATE_DESIGNING
  jq.updateStage(jobId, 'STATE_DESIGNING', 15, '正在设计数值系统...');
  assert(jq.getJob(jobId)?.stage === 'STATE_DESIGNING', '阶段 3: STATE_DESIGNING');

  // STATE_DESIGNING -> CHAPTER_GENERATING（核心阶段）
  jq.updateStage(jobId, 'CHAPTER_GENERATING', 20, '开始逐章生成...');
  assert(jq.getJob(jobId)?.stage === 'CHAPTER_GENERATING', '阶段 4: CHAPTER_GENERATING');

  // 模拟逐章完成
  for (let i = 0; i < analysis.totalChapters; i++) {
    jq.updateChapterStatus(jobId, i, 'completed', `第${i + 1}章`, 8);
  }
  assert(jq.getJob(jobId)?.completedChapters === analysis.totalChapters, '所有章节标记完成');

  // CHAPTER_GENERATING -> ASSEMBLING
  jq.updateStage(jobId, 'ASSEMBLING', 95, '正在组装完整剧本...');
  assert(jq.getJob(jobId)?.stage === 'ASSEMBLING', '阶段 5: ASSEMBLING');

  // ASSEMBLING -> VALIDATING
  jq.updateStage(jobId, 'VALIDATING', 98, '正在校验剧本格式...');
  assert(jq.getJob(jobId)?.stage === 'VALIDATING', '阶段 6: VALIDATING');

  // VALIDATING -> COMPLETED
  jq.updateStage(jobId, 'COMPLETED', 100, '生成完成');
  jq.setResult(jobId, { workId: 'work_test', title: '测试', nodeCount: 50, endingCount: 3 });
  assert(jq.getJob(jobId)?.stage === 'COMPLETED', '阶段 7: COMPLETED');
  assert(jq.getJob(jobId)?.result?.workId === 'work_test', '结果保存正确');

  console.log('');
}

// ========== 6. 边界情况校验 ==========
console.log('【模块 6】边界情况');
{
  const splitter = new TextSplitter();
  const jq = new JobQueue();

  // 6.1 空文本
  const emptyAnalysis = splitter.analyze('');
  assert(emptyAnalysis.totalChapters === 0 || emptyAnalysis.totalChapters === 1, '空文本处理不崩溃');

  // 6.2 超短文本
  const shortAnalysis = splitter.analyze('hello');
  assert(shortAnalysis.totalChapters >= 1, '超短文本处理不崩溃');

  // 6.3 不存在 jobId 的查询
  assert(jq.getJob('nonexistent') === undefined, '不存在 jobId 返回 undefined');
  jq.updateStage('nonexistent', 'ANALYZING', 0, 'test');
  assert(jq.getJob('nonexistent') === undefined, '对不存在 jobId 的更新无副作用');

  // 6.4 多次 failJob
  const jobId = jq.createJob({ textLength: 100, genre: 'general' });
  jq.failJob(jobId, '错误1', 'OUTLINING', true);
  jq.failJob(jobId, '错误2', 'CHAPTER_GENERATING', false);
  assert(jq.getJob(jobId)?.error === '错误2', 'failJob 覆盖之前的错误');
  assert(jq.getJob(jobId)?.recoverable === false, '最后一次 failJob 的 recoverable 生效');

  console.log('');
}

// ========== 总结 ==========
console.log('========================================');
console.log(`QA 校验完成: ${passCount} 通过, ${failCount} 失败`);
console.log('========================================');

if (failCount > 0) {
  process.exit(1);
}
