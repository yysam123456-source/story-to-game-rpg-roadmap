/**
 * data.js — Genre Data Configuration
 * All genre configs: stats, interactions, inventory categories, demo stories.
 * Exposes window.GENRE_CONFIGS for other modules.
 */

window.GENRE_CONFIGS = {

  /* ==================================================================
   * Xianxia — Cultivation
   * ================================================================== */
  xianxia: {
    name: '修仙',
    statusTitle: '修行状态',
    stats: [
      { key: 'cultivation', label: '修为', icon: 'icon-fire',   type: 'progress', maxKey: null },
      { key: 'spiritual',   label: '灵力', icon: 'icon-bolt',   type: 'progress', maxKey: null },
      { key: 'mind',        label: '心境', icon: 'icon-brain',  type: 'progress', maxKey: null },
      { key: 'reputation',  label: '声望', icon: 'icon-star',   type: 'progress', maxKey: null },
      { key: 'hp',          label: '气血', icon: 'icon-heart',  type: 'gauge',    maxKey: 'maxHp' },
      { key: 'mp',          label: '真元', icon: 'icon-drop',   type: 'gauge',    maxKey: 'maxMp' }
    ],
    interactions: [
      { type: 'meditate',  label: '冥想',     icon: 'icon-meditate' },
      { type: 'explore',   label: '探索秘境', icon: 'icon-compass' },
      { type: 'practice',  label: '修炼功法', icon: 'icon-book' },
      { type: 'socialize', label: '论道交友', icon: 'icon-users' },
      { type: 'trade',     label: '坊市交易', icon: 'icon-coin' }
    ],
    inventoryCategories: ['丹药', '法宝', '材料', '功法', '符箓'],
    story: {
      chapter: '第一章 · 初入仙门',
      text: '你站在青云宗的山门前，云雾缭绕间隐约可见亭台楼阁。一位白须老者缓缓走来，目光如炬地打量着你。\n\n"年轻人，你可知修仙之路艰辛万分？前方无路可退，唯有一往无前。"他说道。\n\n你深吸一口气，感受到体内微弱的灵气在流转。虽然刚踏上这条路，但你的心中充满坚定。',
      choices: [
        { text: '恭敬行礼，请求拜入宗门', effect: { reputation: 5, mind: 3 } },
        { text: '展示自己修炼所得，证明资质', effect: { cultivation: 3, spiritual: 5 } },
        { text: '询问关于修仙界的疑问', effect: { mind: 8 } }
      ]
    }
  },

  /* ==================================================================
   * Horror — Infinite Horror
   * ================================================================== */
  horror: {
    name: '无限恐怖',
    statusTitle: '生存状态',
    stats: [
      { key: 'sanity',      label: '理智值', icon: 'icon-brain',      type: 'gauge',    maxKey: 'maxSanity' },
      { key: 'hp',          label: '生命值', icon: 'icon-heart',       type: 'gauge',    maxKey: 'maxHp' },
      { key: 'fear',        label: '恐惧度', icon: 'icon-ghost',       type: 'progress', maxKey: null },
      { key: 'courage',     label: '勇气',   icon: 'icon-shield',      type: 'progress', maxKey: null },
      { key: 'insight',     label: '洞察力', icon: 'icon-eye',         type: 'progress', maxKey: null },
      { key: 'stamina',     label: '体力',   icon: 'icon-run',         type: 'gauge',    maxKey: 'maxStamina' }
    ],
    interactions: [
      { type: 'investigate', label: '调查环境', icon: 'icon-search' },
      { type: 'hide',        label: '躲避',     icon: 'icon-eye-off' },
      { type: 'fight',       label: '战斗',     icon: 'icon-sword' },
      { type: 'rest',        label: '休息恢复', icon: 'icon-moon' },
      { type: 'escape',      label: '寻找出路', icon: 'icon-back' }
    ],
    inventoryCategories: ['武器', '药品', '照明', '工具', '文件'],
    story: {
      chapter: '第一章 · 恐怖开端',
      text: '你在一间陌生的房间里醒来，四周漆黑一片。空气中弥漫着一股腐烂的气味，远处传来若有若无的低语声。\n\n你的手摸到了一个冰冷的金属物体——一把生锈的钥匙。墙上的时钟停在午夜十二点，但滴答声仍在回响。\n\n门把手在缓缓转动，有什么东西正从外面试图进来……',
      choices: [
        { text: '用钥匙锁住房门，寻找其他出口', effect: { sanity: -5, insight: 8 } },
        { text: '拿起身边的物体准备战斗', effect: { courage: 10, hp: -5 } },
        { text: '躲到床下，屏住呼吸观察', effect: { fear: 15, sanity: -3, stamina: -10 } }
      ]
    }
  },

  /* ==================================================================
   * Mystery — Detective
   * ================================================================== */
  mystery: {
    name: '悬疑',
    statusTitle: '侦探状态',
    stats: [
      { key: 'logic',     label: '逻辑推理', icon: 'icon-puzzle', type: 'progress', maxKey: null },
      { key: 'intuition', label: '直觉感知', icon: 'icon-bulb',   type: 'progress', maxKey: null },
      { key: 'evidence',  label: '证据收集', icon: 'icon-file',   type: 'progress', maxKey: null },
      { key: 'charisma',  label: '社交魅力', icon: 'icon-person', type: 'progress', maxKey: null },
      { key: 'alertness', label: '警觉性',   icon: 'icon-bell',   type: 'progress', maxKey: null },
      { key: 'stress',    label: '精神压力', icon: 'icon-drop',   type: 'progress', maxKey: null }
    ],
    interactions: [
      { type: 'investigate_crime', label: '现场勘查', icon: 'icon-search' },
      { type: 'interrogate',      label: '询问证人', icon: 'icon-users' },
      { type: 'analyze',          label: '分析线索', icon: 'icon-brain' },
      { type: 'search',           label: '搜查档案', icon: 'icon-folder' },
      { type: 'stakeout',         label: '跟踪监视', icon: 'icon-eye' }
    ],
    inventoryCategories: ['证据', '线索', '工具', '档案', '通讯录'],
    story: {
      chapter: '第一章 · 雨夜来客',
      text: '大雨滂沱的夜晚，事务所的门被急促地敲响。一位浑身湿透的女人闯了进来，她的眼中满是惊恐。\n\n"侦探先生，有人要杀我！"她颤抖着说道，"我发现了一个关于这座城市最大的秘密……"\n\n就在这时，窗外的路灯忽明忽暗地闪烁起来，一辆黑色轿车缓缓停在了事务所门口。',
      choices: [
        { text: '先安抚她的情绪，详细询问细节', effect: { charisma: 5, evidence: 3 } },
        { text: '立即拉上窗帘，观察窗外情况', effect: { alertness: 8, logic: 3 } },
        { text: '记录她的每句话，寻找矛盾之处', effect: { logic: 10, intuition: 2, stress: 5 } }
      ]
    }
  },

  /* ==================================================================
   * Apocalypse — Post-Apocalyptic Survival
   * ================================================================== */
  apocalypse: {
    name: '末日',
    statusTitle: '生存状态',
    stats: [
      { key: 'food',      label: '食物',   icon: 'icon-food',     type: 'gauge',    maxKey: 'maxFood' },
      { key: 'water',     label: '饮水',   icon: 'icon-drop',     type: 'gauge',    maxKey: 'maxWater' },
      { key: 'health',    label: '健康',   icon: 'icon-heart',    type: 'gauge',    maxKey: 'maxHealth' },
      { key: 'morale',    label: '士气',   icon: 'icon-person',   type: 'progress', maxKey: null },
      { key: 'defense',   label: '防御力', icon: 'icon-shield',   type: 'progress', maxKey: null },
      { key: 'survivors', label: '幸存者', icon: 'icon-users',    type: 'progress', maxKey: null }
    ],
    interactions: [
      { type: 'scavenge', label: '搜索物资', icon: 'icon-search' },
      { type: 'build',    label: '建设营地', icon: 'icon-map' },
      { type: 'explore',  label: '探索区域', icon: 'icon-compass' },
      { type: 'heal',     label: '治疗伤员', icon: 'icon-heart' },
      { type: 'recruit',  label: '招募幸存者', icon: 'icon-person' }
    ],
    inventoryCategories: ['食物', '水', '武器', '医疗', '建材'],
    story: {
      chapter: '第一章 · 文明崩塌',
      text: '距离"大崩溃"已经过去了七天。你站在一栋废弃超市的二楼，透过破碎的玻璃窗向外望去——曾经繁华的街道如今空无一人，到处是废弃的车辆和倒塌的路灯。\n\n远处，几只行尸走肉的丧尸在漫无目的地游荡。你的无线电突然发出一阵刺耳的静电声，随后传来一个断断续续的声音……\n\n"……救援点……坐标……三十六……注意……"',
      choices: [
        { text: '仔细记录坐标，规划前往路线', effect: { morale: 5, defense: 3 } },
        { text: '立即出发，趁天黑前赶到救援点', effect: { food: -10, water: -10, health: -5, morale: 8 } },
        { text: '先在超市搜集剩余物资再行动', effect: { food: 15, water: 15, morale: -3 } }
      ]
    }
  },

  /* ==================================================================
   * Palace — Palace Intrigue
   * ================================================================== */
  palace: {
    name: '宫斗',
    statusTitle: '宫廷地位',
    stats: [
      { key: 'favour',       label: '圣宠', icon: 'icon-crown',  type: 'progress', maxKey: null },
      { key: 'intelligence', label: '智谋', icon: 'icon-brain',  type: 'progress', maxKey: null },
      { key: 'charm',       label: '魅力', icon: 'icon-star',   type: 'progress', maxKey: null },
      { key: 'influence',   label: '权势', icon: 'icon-map',    type: 'progress', maxKey: null },
      { key: 'loyalty',     label: '忠心', icon: 'icon-heart',  type: 'progress', maxKey: null },
      { key: 'suspicion',   label: '疑心', icon: 'icon-eye',    type: 'progress', maxKey: null }
    ],
    interactions: [
      { type: 'attend',    label: '参加宴会', icon: 'icon-coin' },
      { type: 'scheme',    label: '暗中谋划', icon: 'icon-brain' },
      { type: 'gossip',    label: '打探消息', icon: 'icon-users' },
      { type: 'gift',      label: '送礼拉拢', icon: 'icon-box' },
      { type: 'pray',      label: '祈福念经', icon: 'icon-meditate' }
    ],
    inventoryCategories: ['首饰', '药材', '信物', '食谱', '衣饰'],
    story: {
      chapter: '第一章 · 初入宫廷',
      text: '凤辇缓缓停在宫门前，你掀开珠帘，映入眼帘的是红墙金瓦、雕梁画栋。宫女们鱼贯而出，恭迎你踏入这座锦绣牢笼。\n\n"娘娘，太后娘娘请您去慈宁宫请安。"一位嬷嬷走上前来，面带微笑，但眼底却闪过一丝审视的意味。\n\n你知道，从踏入这宫门的那一刻起，每一步都如履薄冰。',
      choices: [
        { text: '精心打扮后前往，展现端庄得体', effect: { charm: 8, favour: 3 } },
        { text: '带上亲手烹制的点心作为见面礼', effect: { favour: 5, suspicion: -3 } },
        { text: '先向身边宫女打听太后的喜好', effect: { intelligence: 8, influence: 2 } }
      ]
    }
  }
};

/**
 * Interaction logic map: each action maps to stat changes + inventory consumption.
 */
window.INTERACTION_LOGIC = {
  /* Xianxia */
  meditate:  { changes: { cultivation: [2, 5], mind: [1, 3], mp: [-5, 0] },         consume: null },
  explore:   { changes: { cultivation: [1, 3], spiritual: [2, 5], hp: [-10, -2] },   consume: null },
  practice:  { changes: { cultivation: [3, 8], mp: [-15, -5] },                       consume: null },
  socialize: { changes: { reputation: [2, 6], mind: [0, 2] },                         consume: null },
  trade:     { changes: { cultivation: [-1, 0], spiritual: [3, 8] },                   consume: { category: '材料', cost: 1 } },

  /* Horror */
  investigate: { changes: { insight: [3, 8], sanity: [-3, -1], stamina: [-10, -5] },   consume: null },
  hide:        { changes: { fear: [-5, -2], stamina: [-5, -2] },                        consume: null },
  fight:       { changes: { courage: [3, 8], hp: [-15, -5], stamina: [-15, -8] },      consume: { category: '武器', cost: 0 } },
  rest:        { changes: { hp: [5, 15], sanity: [2, 5], stamina: [10, 20] },         consume: { category: '药品', cost: 1 } },
  escape:      { changes: { insight: [1, 4], stamina: [-20, -10], fear: [2, 5] },     consume: null },

  /* Mystery */
  investigate_crime: { changes: { evidence: [2, 5], alertness: [1, 3], stress: [2, 5] },   consume: null },
  interrogate:      { changes: { charisma: [2, 5], evidence: [1, 3], stress: [3, 6] },   consume: null },
  analyze:          { changes: { logic: [3, 8], intuition: [1, 3], stress: [2, 4] },     consume: null },
  search:           { changes: { evidence: [3, 6], alertness: [0, 2] },                    consume: null },
  stakeout:         { changes: { alertness: [2, 5], evidence: [0, 2], stress: [-10, -5] }, consume: null },

  /* Apocalypse */
  scavenge: { changes: { food: [5, 15], water: [3, 10], defense: [0, 2] },              consume: null },
  build:    { changes: { defense: [3, 8], morale: [1, 3] },                               consume: { category: '建材', cost: 2 } },
  explore:  { changes: { defense: [0, 2], morale: [-3, 0], health: [-5, -2] },            consume: { category: '食物', cost: 1 } },
  heal:     { changes: { health: [10, 25], morale: [2, 5] },                              consume: { category: '医疗', cost: 1 } },
  recruit:  { changes: { survivors: [1, 2], morale: [3, 8], food: [-5, -2] },            consume: { category: '食物', cost: 2 } },

  /* Palace */
  attend:   { changes: { favour: [2, 6], charm: [1, 3], suspicion: [0, 2] },             consume: { category: '首饰', cost: 0 } },
  scheme:   { changes: { intelligence: [3, 8], influence: [1, 4], suspicion: [1, 3] },  consume: null },
  gossip:   { changes: { intelligence: [1, 4], suspicion: [-2, 0] },                    consume: null },
  gift:     { changes: { favour: [3, 8], loyalty: [1, 3] },                             consume: { category: '药材', cost: 1 } },
  pray:     { changes: { loyalty: [3, 6], suspicion: [-3, -1] },                        consume: null }
};

/**
 * Initial inventory data per genre.
 */
window.INITIAL_INVENTORY = {
  xianxia: {
    '丹药': [
      { name: '回气丹',   desc: '恢复 20 点真元',     qty: 3 },
      { name: '疗伤丹',   desc: '恢复 30 点气血',     qty: 2 }
    ],
    '法宝': [
      { name: '碧水剑',   desc: '灵力 +5',            qty: 1 }
    ],
    '材料': [],
    '功法': [
      { name: '基础吐纳术', desc: '修为 +2/次',       qty: 1 }
    ],
    '符箓': []
  },
  horror: {
    '武器': [
      { name: '生锈匕首', desc: '攻击力 5',           qty: 1 }
    ],
    '药品': [
      { name: '止痛药',   desc: '恢复 15 点生命',     qty: 2 }
    ],
    '照明': [
      { name: '手电筒',   desc: '电池电量 60%',       qty: 1 }
    ],
    '工具': [],
    '文件': []
  },
  mystery: {
    '证据': [
      { name: '模糊照片', desc: '现场拍摄的关键照片', qty: 1 }
    ],
    '线索': [],
    '工具': [
      { name: '放大镜',   desc: '洞察力 +3',          qty: 1 }
    ],
    '档案': [],
    '通讯录': []
  },
  apocalypse: {
    '食物': [
      { name: '罐头', desc: '恢复 15 点食物',         qty: 5 },
      { name: '饼干', desc: '恢复 5 点食物',          qty: 8 }
    ],
    '水': [
      { name: '瓶装水', desc: '恢复 10 点饮水',       qty: 4 }
    ],
    '武器': [
      { name: '铁管', desc: '防御力 +3',             qty: 1 }
    ],
    '医疗': [
      { name: '急救包', desc: '恢复 20 点健康',       qty: 1 }
    ],
    '建材': []
  },
  palace: {
    '首饰': [
      { name: '玉镯', desc: '魅力 +3',               qty: 1 }
    ],
    '药材': [
      { name: '燕窝', desc: '圣宠 +2',               qty: 2 }
    ],
    '信物': [],
    '食谱': [],
    '衣饰': []
  }
};

/**
 * Initial stat values per genre.
 */
window.INITIAL_STATS = {
  xianxia:    { cultivation: 10, spiritual: 10, mind: 10, reputation: 10, hp: 100, maxHp: 100, mp: 50, maxMp: 50 },
  horror:     { sanity: 80, maxSanity: 100, hp: 80, maxHp: 100, fear: 0, courage: 10, insight: 10, stamina: 100, maxStamina: 100 },
  mystery:    { logic: 10, intuition: 10, evidence: 0, charisma: 10, alertness: 10, stress: 0 },
  apocalypse: { food: 50, maxFood: 100, water: 50, maxWater: 100, health: 80, maxHealth: 100, morale: 70, defense: 10, survivors: 3 },
  palace:     { favour: 20, intelligence: 10, charm: 10, influence: 10, loyalty: 50, suspicion: 10 }
};
