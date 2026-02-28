// ============================================================================
// FIXED WORKSPACE IDS
// Workspaces that are always available, not deletable, not editable
// ============================================================================

export const FIXED_TODO_WORKSPACE_ID = '__todo__';

export const FIXED_WORKSPACE_IDS: string[] = [FIXED_TODO_WORKSPACE_ID];

export function isFixedWorkspace(id: string): boolean {
  return FIXED_WORKSPACE_IDS.includes(id);
}
