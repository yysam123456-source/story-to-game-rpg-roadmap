"use client";

import Link from "next/link";
import { BookOpen, Sparkles, Library, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0c] to-[#12121a]">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
            <Sparkles className="h-4 w-4" />
            <span>AI 驱动的互动叙事平台</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            将你的小说
            <br />
            <span className="text-primary">变成可玩的游戏</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
            粘贴你的小说文本，AI 自动生成互动叙事剧本。
            支持修仙、悬疑、恐怖、末世、宫斗等多种类型。
            零门槛创作，一键发布分享。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/instant"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
              立即体验
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-card/80"
            >
              <Library className="h-5 w-5" />
              浏览作品库
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            三步创建互动叙事
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="粘贴小说"
              desc="将你的小说原文粘贴到创作区，支持任意体量"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI 生成"
              desc="AI 自动分析叙事结构，生成分支剧情和数值系统"
            />
            <FeatureCard
              icon={<Library className="h-8 w-8" />}
              title="发布游玩"
              desc="一键发布到作品库，玩家点击即可游玩"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center glass rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-muted-foreground mb-8">
            不需要任何编程知识，粘贴文本即可生成
          </p>
          <Link
            href="/instant"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Sparkles className="h-5 w-5" />
            免费体验
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>Story to Game - AI 互动叙事平台</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass glass-hover rounded-xl p-8 text-center transition-all">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}
