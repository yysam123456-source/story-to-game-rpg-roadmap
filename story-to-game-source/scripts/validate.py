#!/usr/bin/env python3
"""分支剧情游戏 JSON 验证器
用法：python validate.py <json文件路径>
"""
import json
import sys
from collections import deque


def validate(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    errors = []
    warnings = []
    nodes = data.get('nodes', {})
    achievements = data.get('achievements', {})
    variables = data.get('variables', {})
    start = data.get('startNodeId', '')

    # === 1. 基础结构 ===
    if 'meta' not in data:
        errors.append('缺少 meta 字段')
    if 'startNodeId' not in data:
        errors.append('缺少 startNodeId 字段')
    if 'nodes' not in data:
        errors.append('缺少 nodes 字段')
        return False
    if start not in nodes:
        errors.append(f'startNodeId "{start}" 不存在于 nodes 中')

    # === 2. 收集引用 ===
    referenced_nodes = set()
    referenced_achievements = set()
    endings = []
    non_endings = []

    for nid, node in nodes.items():
        if node.get('isEnding'):
            endings.append(nid)
            if node.get('achievement'):
                referenced_achievements.add(node['achievement'])
        else:
            non_endings.append(nid)

        if 'next' in node and isinstance(node['next'], str):
            referenced_nodes.add(node['next'])

        for choice in node.get('choices', []):
            if 'next' in choice:
                referenced_nodes.add(choice['next'])
            changes = choice.get('changes', {})
            if 'unlockAchievement' in changes:
                referenced_achievements.add(changes['unlockAchievement'])
            for a in changes.get('unlockAchievements', []):
                referenced_achievements.add(a)

        for route in node.get('routes', []):
            if 'next' in route:
                referenced_nodes.add(route['next'])

    # === 3. 引用完整性 ===
    for ref in referenced_nodes:
        if ref not in nodes:
            errors.append(f'节点引用 "{ref}" 不存在于 nodes 中')
    for ref in referenced_achievements:
        if ref not in achievements:
            errors.append(f'成就引用 "{ref}" 未在 achievements 中定义')

    # === 4. 节点可达性 (BFS) ===
    reachable = set()
    if start in nodes:
        queue = deque([start])
        while queue:
            nid = queue.popleft()
            if nid in reachable:
                continue
            reachable.add(nid)
            node = nodes.get(nid, {})
            if node.get('next') and node['next'] in nodes:
                queue.append(node['next'])
            for choice in node.get('choices', []):
                if choice.get('next') and choice['next'] in nodes:
                    queue.append(choice['next'])
            for route in node.get('routes', []):
                if route.get('next') and route['next'] in nodes:
                    queue.append(route['next'])

    unreachable = set(nodes.keys()) - reachable
    for nid in sorted(unreachable):
        warnings.append(f'节点 "{nid}" 不可达（从 startNodeId 无法到达）')

    # === 5. 死胡同检查 ===
    for nid in non_endings:
        node = nodes[nid]
        has_choices = bool(node.get('choices'))
        has_next = bool(node.get('next'))
        has_routes = bool(node.get('routes'))
        if not (has_choices or has_next or has_routes):
            errors.append(f'节点 "{nid}" 是死胡同（非结局但无 choices/next/routes）')

    # === 6. 结局可达性 ===
    reachable_endings = [e for e in endings if e in reachable]
    unreachable_endings = [e for e in endings if e not in reachable]
    for e in unreachable_endings:
        warnings.append(f'结局 "{e}" 不可达')
    if not reachable_endings:
        errors.append('没有任何可达的结局')

    # === 7. 成就 vs 结局数量 ===
    if len(achievements) <= len(endings):
        warnings.append(
            f'成就数量（{len(achievements)}）建议大于结局数量（{len(endings)}）'
        )

    # === 8. routes 兜底检查 ===
    for nid, node in nodes.items():
        routes = node.get('routes', [])
        if routes:
            has_default = any(
                r.get('condition') in ('default', None, True)
                for r in routes
            )
            if not has_default:
                errors.append(f'节点 "{nid}" 的 routes 没有 default 兜底（可能导致玩家无法到达任何结局）')

    # === 9. 结局节点完整性 ===
    for nid in endings:
        node = nodes[nid]
        if not node.get('description'):
            warnings.append(f'结局 "{nid}" 缺少 description')
        if not node.get('closing'):
            warnings.append(f'结局 "{nid}" 缺少 closing 收束语')
        if not node.get('title'):
            warnings.append(f'结局 "{nid}" 缺少 title')

    # === 10. 互动节奏检查 ===
    for nid in non_endings:
        node = nodes[nid]
        segments = node.get('segments', [])
        if len(segments) > 8:
            warnings.append(
                f'节点 "{nid}" 有 {len(segments)} 个 segments，'
                f'建议控制在 5 个以内以维持互动节奏'
            )

    # === 11. 同向选项 callback 检查（铁律） ===
    for nid, node in nodes.items():
        choices = node.get('choices', [])
        if len(choices) >= 2:
            # 按 next 分组
            from collections import defaultdict
            groups = defaultdict(list)
            for c in choices:
                groups[c.get('next', '')].append(c)

            for next_id, group in groups.items():
                if len(group) >= 2:
                    # 多个选项指向同一 next
                    # 检查目标节点是否是 callback（有 segments 且很快指向下一个节点）
                    # 如果直接指向同一节点且该节点无法区分来源 → 错误
                    target = nodes.get(next_id, {})
                    has_segments = bool(target.get('segments'))
                    # 如果目标有 segments 但没有 condition 或 routes → 可能是共享节点无差异化
                    if not has_segments:
                        errors.append(
                            f'节点 "{nid}" 有 {len(group)} 个选项指向 '
                            f'"{next_id}"，但目标节点无 segments——'
                            f'选择缺少文本 callback'
                        )
                    else:
                        # 有 segments 但仍然是多选项共享 → 警告（需人工确认差异化）
                        only_changes = all(
                            bool(c.get('changes')) and c.get('next') == next_id
                            for c in group
                        )
                        if only_changes:
                            warnings.append(
                                f'节点 "{nid}" 有 {len(group)} 个选项指向同一节点 '
                                f'"{next_id}" 且仅靠 changes 区分——'
                                f'建议为每个选项添加独立 callback 节点'
                            )

    # === 12. 选项直跳结局检查 ===
    for nid, node in nodes.items():
        for c in node.get('choices', []):
            target_id = c.get('next', '')
            target = nodes.get(target_id, {})
            if target.get('isEnding'):
                etype = target.get('type', '')
                if etype not in ('failure',):
                    errors.append(
                        f'节点 "{nid}" 的选项直接跳到非草率结局 '
                        f'"{target_id}"——结局前必须有收束节点'
                    )
                # 草率结局也应该有过渡，但降为警告
                else:
                    target_segs = target.get('segments', [])
                    if not target.get('description'):
                        warnings.append(
                            f'草率结局 "{target_id}" 被直接跳入且缺少 description'
                        )

    # === 13. progress 检查 ===
    for nid, node in nodes.items():
        p = node.get('progress')
        if p is not None and (p < 0 or p > 100):
            errors.append(f'节点 "{nid}" 的 progress 值 {p} 超出 0-100 范围')

    # === 14. 模板痕迹检查 ===
    banned_phrases = [
        '把事情推到极端', '把话咽回去', '继续问', '的余劲',
        '关于.*的那句话', '这条支线', '这条线', '这个分支',
        '玩家', '节点', '分支点', '选项A', '选项B',
        '带着.*往后走', '带着.*继续',
    ]
    import re
    for nid, node in nodes.items():
        for c in node.get('choices', []):
            text = c.get('text', '')
            for phrase in banned_phrases:
                if re.search(phrase, text):
                    errors.append(
                        f'节点 "{nid}" 的选项 "{text[:20]}..." '
                        f'包含模板痕迹 "{phrase}"'
                    )
        for seg in node.get('segments', []):
            seg_text = seg.get('text', '')
            for phrase in ['玩家', '节点', '分支', '这条支线', '选项']:
                if phrase in seg_text:
                    errors.append(
                        f'节点 "{nid}" 的正文包含元叙事词汇 "{phrase}"'
                    )

    # === 15. 连续 next 链长度检查 ===
    for nid, node in nodes.items():
        if node.get('next') and not node.get('choices') and not node.get('isEnding'):
            chain_len = 1
            current = node.get('next')
            visited_chain = {nid}
            while current and current in nodes and current not in visited_chain:
                visited_chain.add(current)
                cn = nodes[current]
                if cn.get('choices') or cn.get('isEnding') or cn.get('routes'):
                    break
                if cn.get('next'):
                    chain_len += 1
                    current = cn['next']
                else:
                    break
            if chain_len > 10:
                warnings.append(
                    f'从节点 "{nid}" 开始有连续 {chain_len} 个 next 节点'
                    f'无任何互动——建议插入伪互动'
                )

    # === 16. RPG meta.rpg 校验（RPG-001, RPG-002） ===
    rpg = data.get('meta', {}).get('rpg', {})
    if rpg.get('enabled'):
        for stat in rpg.get('primaryStats', []):
            key = stat.get('key', '')
            # RPG-001: primaryStats[].key 必须在 variables 中有对应初始值
            if key and key not in variables:
                errors.append(f'RPG-001: primaryStats key "{key}" 未在 variables 中定义')
            # RPG-002: primaryStats[].type 必须是 text/number/bar 之一
            if stat.get('type') and stat.get('type') not in ('text', 'number', 'bar'):
                errors.append(f'RPG-002: primaryStats "{key}" type "{stat.get("type")}" 无效，应为 text/number/bar')
            # 补充：type=bar 时 max 必填
            if stat.get('type') == 'bar' and 'max' not in stat:
                errors.append(f'RPG-002: primaryStats "{key}" type="bar" 缺少 max 字段')

    # === 17. choice.weight 校验（RPG-003） ===
    for nid, node in nodes.items():
        for c in node.get('choices', []):
            w = c.get('weight', 'minor')
            if w not in ('critical', 'branch', 'minor', 'cosmetic'):
                errors.append(f'RPG-003: 节点 "{nid}" choice.weight "{w}" 无效，应为 critical/branch/minor/cosmetic')

    # === 18. milestones 校验（RPG-004） ===
    for m in data.get('milestones', []):
        cond = m.get('condition')
        if cond:
            if isinstance(cond, dict):
                if not any(k in cond for k in ('all', 'any', 'not', 'var', 'flag', 'item', 'interaction')):
                    errors.append(f'RPG-004: milestone "{m.get("id")}" condition 格式异常，无法解析')
            elif isinstance(cond, str):
                # 字符串格式条件，检查基本格式
                if not any(cond.startswith(prefix) for prefix in ('val', 'trust', 'route', 'hasFlag', '!hasFlag', 'default')):
                    warnings.append(f'RPG-004: milestone "{m.get("id")}" condition 字符串格式可能异常')

    # === 19. endings 校验（RPG-005） ===
    ending_ids = [e.get('id', '') for e in data.get('endings', [])]
    for e in data.get('endings', []):
        cond = e.get('condition')
        if cond:
            if isinstance(cond, dict):
                if not any(k in cond for k in ('all', 'any', 'not', 'var', 'flag', 'item', 'interaction')):
                    errors.append(f'RPG-005: ending "{e.get("id")}" condition 格式异常，无法解析')
            elif isinstance(cond, str):
                if not any(cond.startswith(prefix) for prefix in ('val', 'trust', 'route', 'hasFlag', '!hasFlag', 'default')):
                    warnings.append(f'RPG-005: ending "{e.get("id")}" condition 字符串格式可能异常')

    # === 20. candidateEndings 校验（RPG-006） ===
    for nid, node in nodes.items():
        for cid in node.get('candidateEndings', []):
            if cid not in ending_ids:
                errors.append(f'RPG-006: 节点 "{nid}" candidateEndings "{cid}" 未在 endings 中定义')

    # === 21. delayedChanges 校验（RPG-007） ===
    for nid, node in nodes.items():
        for dc in node.get('delayedChanges', []):
            tn = dc.get('triggerNode', '')
            if tn and tn not in nodes:
                errors.append(f'RPG-007: 节点 "{nid}" delayedChanges.triggerNode "{tn}" 不存在于 nodes 中')

    # === 22. interactions id 唯一性校验（RPG-008） ===
    for nid, node in nodes.items():
        ids = [i.get('id') for i in node.get('interactions', [])]
        if len(ids) != len(set(ids)):
            errors.append(f'RPG-008: 节点 "{nid}" interactions 存在重复 id')

    # === 23. genre 枚举校验（RPG-009） ===
    genre = data.get('meta', {}).get('genre', 'literary')
    if genre not in ('literary', 'xianxia', 'horror', 'mystery', 'apocalypse', 'palace', 'custom'):
        warnings.append(f'RPG-009: meta.genre "{genre}" 不在枚举值内（应为 literary/xianxia/horror/mystery/apocalypse/palace/custom）')

    # === 24. milestones/endings 共存建议（RPG-010, RPG-011） ===
    if data.get('milestones') and not data.get('endings'):
        warnings.append('RPG-010: 存在 milestones 但无 endings，缺乏重玩动力')
    if data.get('endings') and not data.get('milestones'):
        warnings.append('RPG-011: 存在 endings 但无 milestones，缺乏成长仪式感')

    # === 25. 质量建议（RPG-012, RPG-013） ===
    if data.get('meta', {}).get('genre') == 'xianxia' and len(data.get('milestones', [])) < 3:
        warnings.append('RPG-012: 修仙类型建议至少包含 3 个 milestones')
    if len(data.get('endings', [])) < 2:
        warnings.append('RPG-013: 建议至少定义 2 个 endings（含隐藏结局）')

    # === 26. endings[].type 枚举校验（RPG-014） ===
    VALID_ENDING_TYPES = {"true", "dark", "romance", "neutral", "noble", "hidden", "failure"}
    if "endings" in data:
        for e in data["endings"]:
            if "type" in e and e["type"] not in VALID_ENDING_TYPES:
                errors.append(f"RPG-014: endings[{e.get('id','?')}] 的 type '{e['type']}' 不在允许范围内：{VALID_ENDING_TYPES}")

    # === 27. milestones[].celebration 枚举校验（RPG-015） ===
    VALID_CELEBRATION_TYPES = {"small", "medium", "large"}
    if "milestones" in data:
        for m in data["milestones"]:
            if "celebration" in m and m["celebration"] not in VALID_CELEBRATION_TYPES:
                errors.append(f"RPG-015: milestones[{m.get('id','?')}] 的 celebration '{m['celebration']}' 不在允许范围内：{VALID_CELEBRATION_TYPES}")

    # === 28. interactions[].depth 枚举校验（RPG-016） ===
    VALID_DEPTH_TYPES = {"surface", "deep", "ultimate"}
    if "nodes" in data:
        for nid, node in data["nodes"].items():
            for ia in node.get("interactions", []):
                if "depth" in ia and ia["depth"] not in VALID_DEPTH_TYPES:
                    errors.append(f"RPG-016: node[{nid}] interactions[{ia.get('id','?')}] 的 depth '{ia['depth']}' 不在允许范围内：{VALID_DEPTH_TYPES}")

    # === 29. condition 中 var 引用检查（RPG-017） ===
    def extract_var_refs(condition, prefix=""):
        """从条件对象中递归提取所有 var 引用"""
        refs = []
        if isinstance(condition, dict):
            if "var" in condition:
                refs.append(condition["var"])
            if "all" in condition:
                for sub in condition["all"]:
                    refs.extend(extract_var_refs(sub, prefix))
            if "any" in condition:
                for sub in condition["any"]:
                    refs.extend(extract_var_refs(sub, prefix))
            if "interaction" in condition:
                pass  # interaction 类型不引用 variables
        return refs

    all_vars = set(data.get("variables", {}).keys())
    all_conditions = []

    # 收集所有 condition
    if "nodes" in data:
        for nid, node in data["nodes"].items():
            for c in node.get("choices", []):
                if "condition" in c:
                    all_conditions.append(("node", nid, c["condition"]))
            for ia in node.get("interactions", []):
                if "condition" in ia:
                    all_conditions.append(("node", nid, ia["condition"]))

    if "milestones" in data:
        for m in data["milestones"]:
            if "condition" in m:
                all_conditions.append(("milestone", m.get("id","?"), m["condition"]))

    if "endings" in data:
        for e in data["endings"]:
            if "condition" in e:
                all_conditions.append(("ending", e.get("id","?"), e["condition"]))

    for src_type, src_id, cond in all_conditions:
        if isinstance(cond, dict):
            for var_ref in extract_var_refs(cond):
                if var_ref not in all_vars:
                    warnings.append(f"RPG-017: {src_type}[{src_id}] condition 引用了变量 '{var_ref}'，但该变量未在 variables 中定义")

    # === 30. hiddenStats 变量引用检查（RPG-018） ===
    if "meta" in data and "rpg" in data["meta"]:
        hidden = data["meta"]["rpg"].get("hiddenStats", [])
        for hvar in hidden:
            if hvar not in all_vars:
                errors.append(f"RPG-018: meta.rpg.hiddenStats 引用了 '{hvar}'，但该变量未在 variables 中定义")

    # === RPG Checks End ===

    # === 报告 ===
    print(f'\n{"="*50}')
    print(f'验证结果：{path}')
    print(f'{"="*50}')
    print(f'节点总数：{len(nodes)}')
    print(f'  - 剧情节点：{len(non_endings)}')
    print(f'  - 结局节点：{len(endings)}')
    print(f'成就数量：{len(achievements)}')
    print(f'可达节点：{len(reachable)} / {len(nodes)}')
    print(f'自定义变量：{len(variables)}')

    if errors:
        print(f'\n❌ 错误（{len(errors)}）：')
        for e in errors:
            print(f'  ✗ {e}')
    if warnings:
        print(f'\n⚠️  警告（{len(warnings)}）：')
        for w in warnings:
            print(f'  △ {w}')
    if not errors and not warnings:
        print('\n✅ 验证通过，无错误无警告。')
    elif not errors:
        print('\n✅ 无致命错误（但有警告需关注）。')
    else:
        print(f'\n❌ 存在 {len(errors)} 个致命错误，需要修复。')

    return len(errors) == 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('用法：python validate.py <json文件路径>')
        sys.exit(1)
    ok = validate(sys.argv[1])
    sys.exit(0 if ok else 1)
