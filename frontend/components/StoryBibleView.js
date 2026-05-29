"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import API from "../lib/api";
import {
  BookOpen,
  Loader2,
  RefreshCw,
  GitBranch,
  Users,
  Heart,
  Globe,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Zap,
  Circle,
} from "lucide-react";
import {
  normalizeStoryBibleForDisplay,
  formatStoryBibleText,
  getStoryBibleLines,
} from "../lib/storyBibleUtils";

/** Renders plain text or labeled rows — never raw `{...}` JSON */
function BibleEntry({ value, plainClass = "text-sm text-zinc-200 leading-relaxed" }) {
  const lines = getStoryBibleLines(value);
  const plain = formatStoryBibleText(value);

  if (lines && lines.length > 0) {
    return (
      <dl className="space-y-2.5">
        {lines.map((line, i) => (
          <div
            key={`${line.label}-${i}`}
            className="grid grid-cols-1 sm:grid-cols-[minmax(5rem,7rem)_1fr] gap-1 sm:gap-3 items-baseline"
          >
            <dt className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70 font-bold">
              {line.label}
            </dt>
            <dd className={plainClass}>{line.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className={plainClass}>{plain}</p>;
}

const TABS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "events", label: "Events", icon: Zap },
  { id: "threads", label: "Threads", icon: GitBranch },
  { id: "characters", label: "Cast", icon: Users },
  { id: "relationships", label: "Bonds", icon: Heart },
];

function parseRelationshipPair(pair) {
  const text = formatStoryBibleText(pair, pair);
  if (text.includes("->")) {
    const [from, to] = text.split("->").map((s) => s.trim());
    return { from, to };
  }
  if (text.includes("—")) {
    const [from, to] = text.split("—").map((s) => s.trim());
    if (to) return { from, to };
  }
  const dash = text.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (dash) return { from: dash[1].trim(), to: dash[2].trim() };
  return { from: text, to: null };
}

export default function StoryBibleView() {
  const { activeProject, setActiveView } = useStore();
  const [bible, setBible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchStoryBible = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get("/story-bible", {
        params: { projectId: activeProject.id },
      });
      setBible(normalizeStoryBibleForDisplay(data));
    } catch (err) {
      setError("Could not reach the story bible engine. Is the AI backend running?");
      setBible(normalizeStoryBibleForDisplay(null));
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchStoryBible();
  }, [fetchStoryBible]);

  const stats = useMemo(() => {
    if (!bible) return { events: 0, threads: 0, characters: 0, bonds: 0 };
    return {
      events: bible.important_events?.length || 0,
      threads: bible.active_story_threads?.length || 0,
      characters: Object.keys(bible.character_summaries || {}).length,
      bonds: Object.keys(bible.relationship_summaries || {}).length,
    };
  }, [bible]);

  const isEmpty =
    bible &&
    stats.events === 0 &&
    stats.threads === 0 &&
    stats.characters === 0 &&
    stats.bonds === 0 &&
    !bible.world_summary;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap max-w-6xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Narrative direction
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Story Bible</h2>
            <p className="text-sm text-zinc-500 max-w-xl leading-relaxed">
              What <span className="text-zinc-300 font-medium">matters</span> in your story — not every
              detail. Updated automatically after each scene you generate.
            </p>
          </div>
          <button
            onClick={fetchStoryBible}
            disabled={loading}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Bible
          </button>
        </div>

        {/* Memory vs Bible hint */}
        {!isEmpty && !loading && (
          <div className="mt-5 flex flex-wrap gap-3 max-w-6xl">
            <HintChip label="Memory" desc="What happened" muted />
            <ArrowRight className="w-4 h-4 text-zinc-700 self-center hidden sm:block" />
            <HintChip label="Story Bible" desc="What matters & where it's going" accent />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        {error && (
          <div className="mb-6 flex items-start gap-3 text-sm text-amber-200/90 bg-amber-950/25 border border-amber-900/40 px-4 py-3.5 rounded-2xl max-w-3xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            {error}
          </div>
        )}

        {loading && !bible ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState onGoStudio={() => setActiveView("Scene Studio")} />
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Major events" value={stats.events} color="amber" />
              <StatCard label="Open threads" value={stats.threads} color="orange" />
              <StatCard label="Characters" value={stats.characters} color="purple" />
              <StatCard label="Relationships" value={stats.bonds} color="pink" />
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-zinc-900/80 border border-zinc-850 rounded-2xl overflow-x-auto scrollbar-thin">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const count =
                  tab.id === "events"
                    ? stats.events
                    : tab.id === "threads"
                      ? stats.threads
                      : tab.id === "characters"
                        ? stats.characters
                        : tab.id === "relationships"
                          ? stats.bonds
                          : null;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/25 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {count !== null && count > 0 && (
                      <span
                        className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                          isActive ? "bg-amber-500/30 text-amber-200" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab panels */}
            {activeTab === "overview" && (
              <OverviewPanel bible={bible} stats={stats} onNavigate={setActiveTab} />
            )}
            {activeTab === "events" && (
              <EventsPanel events={bible.important_events || []} />
            )}
            {activeTab === "threads" && (
              <ThreadsPanel threads={bible.active_story_threads || []} />
            )}
            {activeTab === "characters" && (
              <CharactersPanel summaries={bible.character_summaries || {}} />
            )}
            {activeTab === "relationships" && (
              <RelationshipsPanel summaries={bible.relationship_summaries || {}} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HintChip({ label, desc, muted, accent }) {
  return (
    <div
      className={`px-3 py-2 rounded-xl border text-xs ${
        accent
          ? "bg-amber-500/5 border-amber-500/20 text-amber-100/90"
          : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
      }`}
    >
      <span className={`font-bold block ${accent ? "text-amber-400" : "text-zinc-400"}`}>
        {label}
      </span>
      <span className="text-[10px] opacity-80">{desc}</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    amber: "from-amber-500/10 border-amber-500/20 text-amber-400",
    orange: "from-orange-500/10 border-orange-500/20 text-orange-400",
    purple: "from-purple-500/10 border-purple-500/20 text-purple-400",
    pink: "from-pink-500/10 border-pink-500/20 text-pink-400",
  };
  return (
    <div
      className={`p-4 rounded-2xl border bg-gradient-to-br to-transparent ${colors[color]}`}
    >
      <span className="text-2xl font-extrabold text-white tabular-nums">{value}</span>
      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mt-1">
        {label}
      </span>
    </div>
  );
}

function OverviewPanel({ bible, stats, onNavigate }) {
  const hasWorld = Boolean(formatStoryBibleText(bible.world_summary));

  return (
    <div className="space-y-6">
      {hasWorld && (
        <div className="relative overflow-hidden rounded-3xl border border-cyan-900/30 bg-gradient-to-br from-cyan-950/40 via-zinc-950/60 to-zinc-950 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
              <Globe className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="space-y-2 min-w-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Story in one line
              </h3>
              <BibleEntry value={bible.world_summary} plainClass="text-base text-zinc-200 leading-relaxed" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PreviewCard
          title="Latest major events"
          count={stats.events}
          emptyText="No pivotal events recorded yet."
          onSeeAll={() => onNavigate("events")}
          accent="amber"
        >
          {(bible.important_events || []).slice(0, 3).map((event, i) => (
            <PreviewRow key={i} index={i + 1} value={event} accent="amber" />
          ))}
        </PreviewCard>

        <PreviewCard
          title="Unresolved threads"
          count={stats.threads}
          emptyText="No open plot threads — story feels settled."
          onSeeAll={() => onNavigate("threads")}
          accent="orange"
        >
          {(bible.active_story_threads || []).slice(0, 3).map((thread, i) => (
            <PreviewRow key={i} value={thread} accent="orange" open />
          ))}
        </PreviewCard>

        <PreviewCard
          title="Character arcs"
          count={stats.characters}
          emptyText="Generate scenes with characters to track evolution."
          onSeeAll={() => onNavigate("characters")}
          accent="purple"
        >
          {Object.entries(bible.character_summaries || {})
            .slice(0, 2)
            .map(([name, summary]) => (
              <div key={name} className="flex gap-3 items-start">
                <Avatar name={name} />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white">{name}</span>
                  <div className="text-[11px] text-zinc-450 line-clamp-3 mt-0.5">
                    <BibleEntry
                      value={summary}
                      plainClass="text-[11px] text-zinc-450 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
        </PreviewCard>

        <PreviewCard
          title="Relationship dynamics"
          count={stats.bonds}
          emptyText="Multi-character scenes build relationship summaries."
          onSeeAll={() => onNavigate("relationships")}
          accent="pink"
        >
          {Object.entries(bible.relationship_summaries || {})
            .slice(0, 2)
            .map(([pair, summary]) => (
              <RelationshipPreview key={pair} pair={pair} summary={summary} compact />
            ))}
        </PreviewCard>
      </div>
    </div>
  );
}

function EventsPanel({ events }) {
  if (!events.length) return <PanelEmpty icon={Zap} title="No major events yet" />;
  return (
    <div className="space-y-3">
      <PanelIntro
        title="Important events"
        desc="Turning points that shape where the story can go next."
      />
      <div className="relative pl-6 space-y-4 border-l-2 border-amber-500/20 ml-2">
        {events.map((event, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
            <div className="bg-zinc-900/50 border border-zinc-850 hover:border-amber-500/25 rounded-2xl p-4 transition-colors">
              <span className="text-[9px] font-mono text-amber-500/80 uppercase tracking-widest font-bold">
                Event {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mt-2">
                <BibleEntry value={event} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreadsPanel({ threads }) {
  if (!threads.length) return <PanelEmpty icon={GitBranch} title="No active threads" />;
  return (
    <div className="space-y-4">
      <PanelIntro
        title="Active story threads"
        desc="Plot lines still in play — tension, mystery, or unfinished business."
      />
      <div className="flex flex-wrap gap-3">
        {threads.map((thread, i) => (
          <div
            key={i}
            className="flex items-start gap-3 max-w-md bg-orange-950/15 border border-orange-500/20 rounded-2xl px-4 py-3.5"
          >
            <span className="relative flex h-2.5 w-2.5 mt-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
            </span>
            <BibleEntry value={thread} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CharactersPanel({ summaries }) {
  const entries = Object.entries(summaries);
  if (!entries.length) return <PanelEmpty icon={Users} title="No character arcs yet" />;
  return (
    <div className="space-y-4">
      <PanelIntro
        title="Character evolution"
        desc="How each character has changed — emotionally and narratively."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([name, summary]) => (
          <div
            key={name}
            className="flex gap-4 p-5 bg-zinc-900/40 border border-zinc-850 hover:border-purple-500/25 rounded-2xl transition-colors"
          >
            <Avatar name={name} size="lg" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white">{name}</h4>
              <div className="mt-2">
                <BibleEntry value={summary} plainClass="text-xs text-zinc-450 leading-relaxed" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationshipsPanel({ summaries }) {
  const entries = Object.entries(summaries);
  if (!entries.length) return <PanelEmpty icon={Heart} title="No relationship summaries yet" />;
  return (
    <div className="space-y-4">
      <PanelIntro
        title="Relationship summaries"
        desc="Directional dynamics between characters — attachment, tension, distance."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {entries.map(([pair, summary]) => (
          <RelationshipPreview key={pair} pair={pair} summary={summary} />
        ))}
      </div>
    </div>
  );
}

function RelationshipPreview({ pair, summary, compact }) {
  const { from, to } = parseRelationshipPair(pair);
  return (
    <div
      className={`bg-zinc-900/40 border border-zinc-850 hover:border-pink-500/25 rounded-2xl transition-colors ${
        compact ? "p-3" : "p-5"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-sm font-bold text-white">{from}</span>
        {to && (
          <>
            <ArrowRight className="w-3.5 h-3.5 text-pink-500/70 shrink-0" />
            <span className="text-sm font-bold text-pink-300/90">{to}</span>
          </>
        )}
      </div>
      <BibleEntry
        value={summary}
        plainClass={`text-zinc-450 leading-relaxed ${compact ? "text-[11px]" : "text-xs"}`}
      />
    </div>
  );
}

function Avatar({ name, size = "md" }) {
  const dim = size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${dim} rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/25 flex items-center justify-center font-bold text-purple-300 shrink-0`}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function PreviewCard({ title, count, emptyText, onSeeAll, accent, children }) {
  const border = {
    amber: "border-amber-900/20 hover:border-amber-500/20",
    orange: "border-orange-900/20 hover:border-orange-500/20",
    purple: "border-purple-900/20 hover:border-purple-500/20",
    pink: "border-pink-900/20 hover:border-pink-500/20",
  };
  return (
    <div className={`bg-zinc-950/40 border rounded-2xl p-5 space-y-4 transition-colors ${border[accent]}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
        {count > 0 && (
          <button
            onClick={onSeeAll}
            className="text-[10px] font-semibold text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
          >
            See all →
          </button>
        )}
      </div>
      {count === 0 ? (
        <p className="text-xs text-zinc-600 italic">{emptyText}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function PreviewRow({ index, value, accent, open }) {
  const lines = getStoryBibleLines(value);
  const preview =
    lines && lines.length > 0
      ? lines.map((l) => l.value).join(" · ")
      : formatStoryBibleText(value);

  return (
    <div className="flex gap-2.5 items-start">
      {open ? (
        <Circle className="w-2 h-2 text-orange-500 fill-orange-500 mt-1.5 shrink-0" />
      ) : (
        <span className="text-[10px] font-mono text-amber-500/70 font-bold mt-0.5 shrink-0">
          {index != null ? String(index).padStart(2, "0") : "•"}
        </span>
      )}
      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{preview}</p>
    </div>
  );
}

function PanelIntro({ title, desc }) {
  return (
    <div className="pb-1">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1">{desc}</p>
    </div>
  );
}

function PanelEmpty({ icon: Icon, title }) {
  return (
    <div className="py-16 text-center border border-dashed border-zinc-850 rounded-3xl">
      <Icon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-sm font-semibold text-zinc-500">{title}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-24 flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-amber-400" />
        </div>
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin absolute -bottom-1 -right-1" />
      </div>
      <p className="text-sm text-zinc-500">Reading narrative state…</p>
    </div>
  );
}

function EmptyState({ onGoStudio }) {
  return (
    <div className="py-16 max-w-lg mx-auto text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-amber-500/60" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">Your Story Bible is empty</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Generate scenes in Scene Studio. After each scene, AI extracts what{" "}
          <em className="text-zinc-400 not-italic font-medium">matters</em> — major events,
          open threads, and character shifts.
        </p>
      </div>
      <div className="text-left bg-zinc-900/50 border border-zinc-850 rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex gap-3">
          <span className="text-zinc-600 font-mono">01</span>
          <span className="text-zinc-400">Write a scene with your characters</span>
        </div>
        <div className="flex gap-3">
          <span className="text-zinc-600 font-mono">02</span>
          <span className="text-zinc-400">AI analyzes narrative impact</span>
        </div>
        <div className="flex gap-3">
          <span className="text-zinc-600 font-mono">03</span>
          <span className="text-zinc-400">Story Bible updates automatically</span>
        </div>
      </div>
      <button
        onClick={onGoStudio}
        className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/15"
      >
        <Sparkles className="w-4 h-4" />
        Open Scene Studio
      </button>
    </div>
  );
}
