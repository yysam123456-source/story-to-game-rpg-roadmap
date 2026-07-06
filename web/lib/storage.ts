/**
 * 存储抽象层
 * 支持多环境：本地开发、Vercel Blob、国内对象存储
 * 通过环境变量切换，零代码改动
 */

import { WorkMeta, StoryScript } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_MODE = process.env.STORAGE_MODE || 'local'; // 'local' | 'vercel-blob' | 's3'
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data', 'works');

// ===== 本地文件系统存储（开发 & 国内部署）=====
async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // ignore
  }
}

async function localSaveWork(id: string, meta: WorkMeta, script: StoryScript): Promise<void> {
  await ensureDir(DATA_DIR);
  const metaPath = path.join(DATA_DIR, `${id}.meta.json`);
  const scriptPath = path.join(DATA_DIR, `${id}.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  await fs.writeFile(scriptPath, JSON.stringify(script, null, 2), 'utf-8');
}

async function localGetWorkMeta(id: string): Promise<WorkMeta | null> {
  try {
    const metaPath = path.join(DATA_DIR, `${id}.meta.json`);
    const content = await fs.readFile(metaPath, 'utf-8');
    return JSON.parse(content) as WorkMeta;
  } catch {
    return null;
  }
}

async function localGetWorkScript(id: string): Promise<StoryScript | null> {
  try {
    const scriptPath = path.join(DATA_DIR, `${id}.json`);
    const content = await fs.readFile(scriptPath, 'utf-8');
    return JSON.parse(content) as StoryScript;
  } catch {
    return null;
  }
}

async function localListWorks(): Promise<WorkMeta[]> {
  try {
    await ensureDir(DATA_DIR);
    const files = await fs.readdir(DATA_DIR);
    const metaFiles = files.filter(f => f.endsWith('.meta.json'));
    const works: WorkMeta[] = [];
    for (const f of metaFiles) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, f), 'utf-8');
        works.push(JSON.parse(content) as WorkMeta);
      } catch {
        // skip corrupt
      }
    }
    return works.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

async function localDeleteWork(id: string): Promise<void> {
  try {
    await fs.unlink(path.join(DATA_DIR, `${id}.meta.json`));
  } catch { /* ignore */ }
  try {
    await fs.unlink(path.join(DATA_DIR, `${id}.json`));
  } catch { /* ignore */ }
}

// ===== Vercel Blob 存储 =====
async function blobSaveWork(id: string, meta: WorkMeta, script: StoryScript): Promise<void> {
  // 延迟导入，仅在需要时加载
  // @ts-ignore
  const { put } = await import('@vercel/blob');
  await put(`works/${id}.meta.json`, JSON.stringify(meta), {
    access: 'public',
    contentType: 'application/json',
  });
  await put(`works/${id}.json`, JSON.stringify(script), {
    access: 'public',
    contentType: 'application/json',
  });
}

async function blobGetWorkMeta(id: string): Promise<WorkMeta | null> {
  try {
    // @ts-ignore
    const { head } = await import('@vercel/blob');
    const info = await head(`works/${id}.meta.json`);
    if (!info?.url) return null;
    const res = await fetch(info.url);
    if (!res.ok) return null;
    return await res.json() as WorkMeta;
  } catch {
    return null;
  }
}

async function blobGetWorkScript(id: string): Promise<StoryScript | null> {
  try {
    // @ts-ignore
    const { head } = await import('@vercel/blob');
    const info = await head(`works/${id}.json`);
    if (!info?.url) return null;
    const res = await fetch(info.url);
    if (!res.ok) return null;
    return await res.json() as StoryScript;
  } catch {
    return null;
  }
}

async function blobListWorks(): Promise<WorkMeta[]> {
  // Vercel Blob 列出功能有限，这里用本地索引文件
  try {
    // @ts-ignore
    const { get } = await import('@vercel/blob');
    const indexBlob = await get('works/index.json');
    if (!indexBlob) return [];
    const res = await fetch(indexBlob.url);
    if (!res.ok) return [];
    const ids: string[] = await res.json();
    const works: WorkMeta[] = [];
    for (const id of ids) {
      const meta = await blobGetWorkMeta(id);
      if (meta) works.push(meta);
    }
    return works;
  } catch {
    return [];
  }
}

async function blobDeleteWork(id: string): Promise<void> {
  // @ts-ignore
  const { del } = await import('@vercel/blob');
  try { await del(`works/${id}.meta.json`); } catch { /* ignore */ }
  try { await del(`works/${id}.json`); } catch { /* ignore */ }
}

// ===== 统一入口 =====
export async function saveWork(id: string, meta: WorkMeta, script: StoryScript): Promise<void> {
  if (STORAGE_MODE === 'vercel-blob') {
    return blobSaveWork(id, meta, script);
  }
  return localSaveWork(id, meta, script);
}

export async function getWorkMeta(id: string): Promise<WorkMeta | null> {
  if (STORAGE_MODE === 'vercel-blob') {
    return blobGetWorkMeta(id);
  }
  return localGetWorkMeta(id);
}

export async function getWorkScript(id: string): Promise<StoryScript | null> {
  if (STORAGE_MODE === 'vercel-blob') {
    return blobGetWorkScript(id);
  }
  return localGetWorkScript(id);
}

export async function listWorks(): Promise<WorkMeta[]> {
  if (STORAGE_MODE === 'vercel-blob') {
    return blobListWorks();
  }
  return localListWorks();
}

export async function deleteWork(id: string): Promise<void> {
  if (STORAGE_MODE === 'vercel-blob') {
    return blobDeleteWork(id);
  }
  return localDeleteWork(id);
}
