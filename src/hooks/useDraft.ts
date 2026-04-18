// src/hooks/useDraft.ts
// Reusable hook for auto-saving wizard state as a draft
// Usage: const { saveDraft, clearDraft, draftSaved, lastSaved } = useDraft("policy", "policy-new", data, step)

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Get or create a stable session ID stored in localStorage
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("besure_session_id");
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("besure_session_id", id);
  }
  return id;
}

interface UseDraftOptions {
  /** How many milliseconds of inactivity before auto-saving (default: 1500ms) */
  debounceMs?: number;
  /** Whether to auto-save on every data change */
  autoSave?: boolean;
  /** Friendly label describing what is being drafted */
  label?: string;
}

interface UseDraftReturn {
  /** Manually trigger a save */
  saveDraft: () => Promise<void>;
  /** Delete the draft (call after successful submission) */
  clearDraft: () => Promise<void>;
  /** Load an existing draft — returns the parsed data or null */
  loadDraft: () => Promise<Record<string, any> | null>;
  /** Whether the last save succeeded */
  draftSaved: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Whether a draft exists in the DB */
  hasDraft: boolean;
  /** Draft ID from the server */
  draftId: string | null;
  /** Whether a save is in flight */
  saving: boolean;
}

export function useDraft(
  draftType: "policy" | "claim",
  draftKey: string,
  data: Record<string, any>,
  step?: string | number,
  options: UseDraftOptions = {}
): UseDraftReturn {
  const { debounceMs = 1500, autoSave = true, label } = options;

  const [draftSaved, setDraftSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionId = useRef<string>("");

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  const saveDraft = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftType,
          draftKey,
          sessionId: sessionId.current,
          data,
          step: step != null ? String(step) : null,
          label: label || null,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setDraftSaved(true);
        setLastSaved(new Date());
        setHasDraft(true);
        if (result.draft?.id) setDraftId(result.draft.id);
        // Reset "saved" indicator after 3 seconds
        setTimeout(() => setDraftSaved(false), 3000);
      }
    } catch (e) {
      console.warn("Draft save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [draftType, draftKey, data, step, label, saving]);

  // Auto-save with debounce
  useEffect(() => {
    if (!autoSave) return;
    // Don't auto-save if data is empty/default
    const hasContent = Object.values(data).some(v =>
      v !== "" && v !== null && v !== undefined &&
      !(Array.isArray(v) && v.length === 0)
    );
    if (!hasContent) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveDraft();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, step, autoSave, debounceMs, saveDraft]);

  const clearDraft = useCallback(async () => {
    if (!draftId) return;
    try {
      await fetch(`/api/drafts?id=${draftId}`, { method: "DELETE" });
      setHasDraft(false);
      setDraftId(null);
      setDraftSaved(false);
      setLastSaved(null);
    } catch (e) {
      console.warn("Draft clear failed:", e);
    }
  }, [draftId]);

  const loadDraft = useCallback(async (): Promise<Record<string, any> | null> => {
    try {
      const sid = sessionId.current || getSessionId();
      const res = await fetch(
        `/api/drafts?type=${draftType}&key=${encodeURIComponent(draftKey)}&sessionId=${sid}`
      );
      if (!res.ok) return null;
      const result = await res.json();
      if (result.draft) {
        setHasDraft(true);
        setDraftId(result.draft.id);
        return result.draft.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [draftType, draftKey]);

  return { saveDraft, clearDraft, loadDraft, draftSaved, lastSaved, hasDraft, draftId, saving };
}