/**
 * Load Comfy workflow JSON templates from workflows/comfy/ (Wave10 + H3).
 * Templates are aidrama-owned graphs — not ComfyUI source.
 */
import fs from 'node:fs';
import path from 'node:path';

export type ComfyWorkflowId =
  | 'wan22_t2v_smoke'
  | 'ltx_smoke'
  | 'minimax_h3_i2v'
  | 'minimax_h3_i2v_smoke';

const WORKFLOW_FILES: Record<ComfyWorkflowId, string> = {
  wan22_t2v_smoke: 'wan22_t2v_smoke.json',
  ltx_smoke: 'ltx_smoke.json',
  /** Official API Format I2V (production path). */
  minimax_h3_i2v: 'minimax_h3_i2v.json',
  /** DEPRECATED stub — wrong contracts; keep registered for regression only. */
  minimax_h3_i2v_smoke: 'minimax_h3_i2v_smoke.json',
};

export function resolveComfyWorkflowsDir(cwd = process.cwd()): string {
  return path.resolve(cwd, 'workflows', 'comfy');
}

export function loadComfyWorkflow(
  id: ComfyWorkflowId,
  cwd = process.cwd(),
): Record<string, unknown> {
  const file = WORKFLOW_FILES[id];
  if (!file) {
    throw new Error(`Unknown workflow id: ${id}`);
  }
  const full = path.join(resolveComfyWorkflowsDir(cwd), file);
  if (!fs.existsSync(full)) {
    throw new Error(`Workflow missing: ${full}`);
  }
  const raw = fs.readFileSync(full, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid workflow JSON: ${full}`);
  }
  // Strip aidrama _meta — Comfy /prompt only accepts nodeId keys.
  const { _meta: _ignoredMeta, ...nodes } = parsed as Record<string, unknown> & {
    _meta?: unknown;
  };
  return nodes;
}

/**
 * Shallow-clone workflow and apply string/number patch by nodeId.inputs.key.
 * Node IDs stay adapter-private (not ShotSpec).
 */
export function patchWorkflowInputs(
  workflow: Record<string, unknown>,
  patches: ReadonlyArray<{ nodeId: string; input: string; value: unknown }>,
): Record<string, unknown> {
  const clone = structuredClone(workflow) as Record<string, unknown>;
  for (const p of patches) {
    const node = clone[p.nodeId] as { inputs?: Record<string, unknown> } | undefined;
    if (!node || typeof node !== 'object') {
      throw new Error(`workflow node missing: ${p.nodeId}`);
    }
    if (!node.inputs || typeof node.inputs !== 'object') {
      node.inputs = {};
    }
    node.inputs[p.input] = p.value;
  }
  return clone;
}
