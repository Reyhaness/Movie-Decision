import { useSyncExternalStore } from "react";
import type {
  StandardMood,
  SituationSelection,
  TimeSelection,
} from "@/services/recommendation/types";

export interface MoviePayload {
  movieId: string;
  title: string;
  releaseYear: number | null;
  runtimeMinutes: number;
  overview: string;
  genres: string[];
  posterPath?: string | null;
}

export type MoodChoice = StandardMood | "surprise_me";

export type FlowState =
  | "landing"
  | "preferences"
  | "loading"
  | "result"
  | "accepted"
  | "no_match"
  | "error";

export interface FlowData {
  state: FlowState;
  time: TimeSelection | null;
  mood: MoodChoice | null;
  situation: SituationSelection | null;
  result: MoviePayload | null;
  sessionId: string | null;
  shownMovieIds: string[];
}

const STORAGE_KEY = "mda_flow_state_v1";

const defaultFlowData: FlowData = {
  state: "landing",
  time: null,
  mood: null,
  situation: null,
  result: null,
  sessionId: null,
  shownMovieIds: [],
};

function readFromStorage(): FlowData {
  if (typeof window === "undefined") return defaultFlowData;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultFlowData, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore storage parse errors
  }
  return defaultFlowData;
}

let currentSnapshot: FlowData = defaultFlowData;
let isInitialized = false;
const listeners = new Set<() => void>();

function initIfNeeded() {
  if (!isInitialized && typeof window !== "undefined") {
    currentSnapshot = readFromStorage();
    isInitialized = true;
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function updateFlowData(
  updater: Partial<FlowData> | ((prev: FlowData) => Partial<FlowData>)
) {
  initIfNeeded();
  const partial = typeof updater === "function" ? updater(currentSnapshot) : updater;
  currentSnapshot = { ...currentSnapshot, ...partial };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentSnapshot));
  } catch {
    // Ignore storage write errors
  }
  emitChange();
}

export function resetFlowData() {
  currentSnapshot = defaultFlowData;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  emitChange();
}

function subscribe(listener: () => void) {
  initIfNeeded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FlowData {
  initIfNeeded();
  return currentSnapshot;
}

function getServerSnapshot(): FlowData {
  return defaultFlowData;
}

export function useFlowStore(): [FlowData, typeof updateFlowData, typeof resetFlowData] {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [store, updateFlowData, resetFlowData];
}
