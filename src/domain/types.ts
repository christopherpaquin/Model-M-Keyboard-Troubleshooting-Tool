/** Shared contract types for keyboard model packages and troubleshooting output. */

export type TraceRole = "pathA" | "pathB";

export interface KeyboardModelManifest {
  modelId: string;
  displayName: string;
  family: string;
  layoutName: string;
  description: string;
  schemaVersion: string;
  modelVersion: string;
  supportedFeatures?: string[];
  /** Authoring notes: data completeness, verification status, etc. */
  dataNotes?: string[];
  files: {
    keys: string;
    traces: string;
    tracePaths: string;
    ribbonContacts: string;
    keyTraceMap: string;
  };
}

export interface KeyboardKey {
  modelId: string;
  keyId: string;
  displayName: string;
  advancedName?: string;
  aliases?: string[];
  section: "function" | "main" | "navigation" | "numpad" | "other";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  sortOrder?: number;
  /** Higher = easier to spot when suggesting comparison keys */
  recognitionRank?: number;
}

export interface KeyboardTrace {
  modelId: string;
  traceId: string;
  displayName: string;
  layerId: string;
  ribbonContactId: string;
  description?: string;
  notes?: string;
}

export type PathGeometry = string;

export interface TracePath {
  modelId: string;
  traceId: string;
  pathId: string;
  geometry: PathGeometry;
  pathType?: "overlay" | "ribbon_feed" | "other";
  label?: string;
}

export interface RibbonContact {
  modelId: string;
  contactId: string;
  layerId: string;
  contactNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface KeyTraceMapEntry {
  modelId: string;
  keyId: string;
  traceId: string;
  role: TraceRole;
}

export interface ComparisonKeySuggestion {
  keyId: string;
  displayName: string;
  traceId: string;
  reason: string;
}

export interface TroubleshootingResult {
  summaryLines: string[];
  sharedTraceIds: string[];
  perTraceNotes: Record<string, string[]>;
  comparisonSuggestions: ComparisonKeySuggestion[];
  advancedBullets: string[];
}

export interface ModelValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  detail?: string;
}

export interface ModelValidationReport {
  modelId: string;
  ok: boolean;
  issues: ModelValidationIssue[];
  counts: {
    keys: number;
    traces: number;
    paths: number;
    ribbonContacts: number;
    mappings: number;
  };
}

/** Runtime bundle after loading and parsing a model package directory. */
export interface LoadedKeyboardModel {
  manifest: KeyboardModelManifest;
  keys: KeyboardKey[];
  traces: KeyboardTrace[];
  tracePaths: TracePath[];
  ribbonContacts: RibbonContact[];
  keyTraceMap: KeyTraceMapEntry[];
}

export interface ModelIndexEntry {
  modelId: string;
  /** Relative to /models/ — folder name */
  packagePath: string;
}

export interface ModelsRegistry {
  models: ModelIndexEntry[];
}
