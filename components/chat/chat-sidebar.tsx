"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Settings2, X } from "lucide-react";
import { toast } from "sonner";

import { AgentSelector } from "@/components/chat/agent-selector";
import { ChatHistoryList } from "@/components/chat/chat-history-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAIWorkspace } from "@/contexts/ai-context";
import { useLocale } from "@/contexts/locale-context";
import type { AIWorkspaceMode } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const modeLabelKey: Record<AIWorkspaceMode, "ai.mode.auto" | "ai.mode.mock" | "ai.mode.gateway"> = {
  auto: "ai.mode.auto",
  mock: "ai.mode.mock",
  gateway: "ai.mode.gateway",
};

const SIDEBAR_SECTIONS_STORAGE_KEY = "ceoclaw-chat-sidebar-sections-v1";
const defaultSections = {
  actions: false,
  agent: true,
  context: true,
  history: false,
  mode: true,
};

type SectionKey = keyof typeof defaultSections;

function SidebarSection({
  children,
  expanded,
  id,
  label,
  onToggle,
}: {
  children: React.ReactNode;
  expanded: boolean;
  id: string;
  label: string;
  onToggle: () => void;
}) {
  return (
    <section className="border-b border-[color:var(--line-strong)] px-[var(--spacing-md)] py-[var(--spacing-md)] last:border-b-0">
      <button
        aria-controls={id}
        aria-expanded={expanded}
        aria-label={label}
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {label}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--panel-soft)] text-[var(--ink-soft)]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-200 ease-out",
          expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        )}
        id={id}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

export function ChatSidebar({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const {
    activeContext,
    preferredMode,
    quickActions,
    runQuickAction,
    setPreferredMode,
  } = useAIWorkspace();
  const { t } = useLocale();
  const [expandedSections, setExpandedSections] = useState(defaultSections);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof defaultSections>;
      setExpandedSections((current) => ({ ...current, ...parsed }));
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify(expandedSections));
    } catch {
      // ignore storage failures
    }
  }, [expandedSections]);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <div className={cn("flex h-full flex-col bg-[color:var(--surface-sidebar-mobile)]", className)}>
      <div className="flex items-center justify-between border-b border-[color:var(--line-strong)] px-4 py-4 md:hidden">
        <p className="font-medium text-[var(--ink)]">{t("page.chat.title")}</p>
        <Button
          aria-label={t("action.close")}
          onClick={onClose}
          size="icon"
          variant="secondary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarSection
          expanded={expandedSections.context}
          id="chat-sidebar-context"
          label={t("chat.sidebar.context")}
          onToggle={() => toggleSection("context")}
        >
          <Card className="bg-[var(--panel-soft)]">
            <CardContent className="space-y-2 p-4">
              <p className="font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {activeContext.title}
              </p>
              <p className="text-sm text-[var(--ink-soft)]">{activeContext.subtitle}</p>
            </CardContent>
          </Card>
        </SidebarSection>

        <SidebarSection
          expanded={expandedSections.agent}
          id="chat-sidebar-agent"
          label={t("chat.sidebar.agent")}
          onToggle={() => toggleSection("agent")}
        >
          <AgentSelector />
        </SidebarSection>

        <SidebarSection
          expanded={expandedSections.mode}
          id="chat-sidebar-mode"
          label={t("chat.sidebar.mode")}
          onToggle={() => toggleSection("mode")}
        >
          <p className="mb-3 text-sm text-[var(--ink-muted)]">{t("chat.sidebar.modeHelp")}</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {(["auto", "mock", "gateway"] as const).map((mode) => (
              <button
                key={mode}
                aria-label={t(modeLabelKey[mode])}
                aria-checked={preferredMode === mode}
                className={cn(
                  "rounded-[10px] border px-3 py-2 text-sm font-medium transition",
                  preferredMode === mode
                    ? "border-[var(--brand)] bg-[var(--panel-soft)] text-[var(--brand)]"
                    : "border-[var(--line)] bg-[color:var(--surface-panel)] text-[var(--ink-soft)] hover:border-[var(--brand)]/25 hover:text-[var(--ink)]"
                )}
                onClick={() => setPreferredMode(mode)}
                role="radio"
                type="button"
              >
                {t(modeLabelKey[mode])}
              </button>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          expanded={expandedSections.actions}
          id="chat-sidebar-actions"
          label={t("chat.sidebar.quickActions")}
          onToggle={() => toggleSection("actions")}
        >
          <p className="mb-3 text-sm text-[var(--ink-muted)]">{t("chat.sidebar.quickActionsHelp")}</p>
          <div className="grid gap-2">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                aria-label={t(action.labelKey)}
                className="rounded-[10px] border border-[var(--line)] bg-[color:var(--surface-panel)] px-3 py-2.5 text-left text-sm font-medium text-[var(--ink)] transition hover:border-[var(--brand)]/25 hover:bg-[color:var(--surface-panel-strong)]"
                onClick={() => {
                  void runQuickAction(action.id);
                  onClose?.();
                }}
                type="button"
              >
                <p>{t(action.labelKey)}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                  {t(action.descriptionKey)}
                </p>
              </button>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          expanded={expandedSections.history}
          id="chat-sidebar-history"
          label={t("chat.sidebar.history")}
          onToggle={() => toggleSection("history")}
        >
          <p className="mb-[var(--spacing-sm)] text-sm text-[var(--ink-muted)]">
            {t("chat.sidebar.historyHelp")}
          </p>
          <ChatHistoryList onAction={onClose} />
        </SidebarSection>
      </div>

      <div className="border-t border-[color:var(--line-strong)] p-4">
        <Button
          aria-label={t("chat.sidebar.settings")}
          className="w-full justify-start"
          onClick={() =>
            toast(t("chat.sidebar.settingsSoon"), {
              description: t("chat.sidebar.settingsSoonDesc"),
            })
          }
          variant="ghost"
        >
          <Settings2 className="h-4 w-4" />
          {t("chat.sidebar.settings")}
        </Button>
      </div>
    </div>
  );
}
