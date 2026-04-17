/*
 * Auto-generation logic for variables, action bindings, and branch stems.
 *
 * Plan functions are pure data transformations or async reads.
 * applyAutoGenerationPlan performs the actual store mutations.
 * The apply-callback registry lets the menu handler trigger whichever pane
 * is currently active without the panes needing to know about each other.
 */

import { v4 as uuidv4 } from "uuid";
import {
  Action,
  ActionDef,
  Branch,
  Cell,
  Stem,
  Store,
  Variable,
} from "../typings";
import { classifyInputLabel } from "../utils/classifyInputLabel";
import { getVariables } from "./getData";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns only the input-element actions from a cell (buttons and input fields).
 */
export function getInputActions(cell: Cell, actionDefs: ActionDef[]): Action[] {
  return cell.actions.filter((action) => {
    const def = actionDefs.find((d) => d.name === action.name);
    return def?.inputElement === true;
  });
}

/**
 * Returns only the button-type input actions from a cell.
 * Buttons are input elements that are NOT an inputField.
 */
export function getButtonActions(
  cell: Cell,
  actionDefs: ActionDef[]
): Action[] {
  return cell.actions.filter((action) => {
    const def = actionDefs.find((d) => d.name === action.name);
    return def?.inputElement === true && action.name !== "inputField";
  });
}

/**
 * Strips characters that are not alphanumeric, underscore, hyphen, or space.
 * Used to normalize button labels into safe variable values.
 */
export function normalizeButtonValue(label: string): string {
  return label.replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
}

/**
 * Resolves a unique variable name against the existing project variables.
 * If the base name already exists, appends a numeric suffix (e.g. "choice2").
 */
function resolveUniqueName(baseName: string, existing: Variable[]): string {
  const existingNames = new Set(existing.map((v) => v.name));
  if (!existingNames.has(baseName)) return baseName;
  let i = 2;
  while (existingNames.has(`${baseName}${i}`)) i++;
  return `${baseName}${i}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * A stem is considered to have no configured rules when every rule in its
 * rules array is empty (no variableId set). New stems are always initialized
 * with one blank rule placeholder, so rules.length === 0 is never true in
 * practice — this function treats that case the same as truly empty.
 */
function stemHasNoRules(stem: Stem): boolean {
  if (stem.rules.length === 0) return true;
  return stem.rules.every((r) => !r.variableId || r.variableId === "");
}

// ── Qualification checks ──────────────────────────────────────────────────────

/**
 * A cell qualifies when it has at least one input action AND the majority of
 * input actions do not have a variable assigned (props.varToSet is empty/unset).
 */
export function cellQualifiesForAutoGeneration(
  cell: Cell,
  actionDefs: ActionDef[]
): boolean {
  const inputActions = getInputActions(cell, actionDefs);
  if (inputActions.length === 0) return false;

  const unassigned = inputActions.filter(
    (a) => !a.props.varToSet || a.props.varToSet === ""
  );
  return unassigned.length > inputActions.length / 2;
}

/**
 * A branch qualifies when:
 *   - It has only a no-match stem (no rule stems at all), OR
 *   - The majority of its rule stems have no rules
 */
export function branchQualifiesForAutoGeneration(branch: Branch): boolean {
  const ruleStems = branch.stems.filter((s) => s.type !== "noMatch");
  if (ruleStems.length === 0) return true;

  const stemsWithoutRules = ruleStems.filter(stemHasNoRules);
  return stemsWithoutRules.length > ruleStems.length / 2;
}

/**
 * Finds the single cell whose link.to points to the given branch ID.
 * Returns undefined if zero or more than one cell precede the branch —
 * either case makes the predecessor ambiguous.
 */
export function getPrecedingCell(
  branchId: string,
  store: Store
): Cell | undefined {
  const matches: Cell[] = [];
  for (const sequence of store.project.sequences) {
    for (const node of sequence.nodes) {
      if (node.type === "cell" && (node as Cell).link?.to === branchId) {
        matches.push(node as Cell);
      }
    }
  }
  return matches.length === 1 ? matches[0] : undefined;
}

// ── Plan types ────────────────────────────────────────────────────────────────

/** A variable to be created. */
export interface PlannedVariable {
  id: string;
  name: string;
  varType: "string";
  startingValue: "";
  description: "";
}

/** An action whose varToSet (and optionally value) should be updated. */
export interface PlannedActionUpdate {
  actionId: string;
  varToSet: string; // variable ID
  /** Only set for button actions; undefined for input fields. */
  value?: string;
}

/**
 * A new stem to be inserted before the no-match stem.
 * variableId and value define the single rule that will be written into it.
 */
export interface PlannedNewStem {
  id: string;
  variableId: string;
  value: string;
}

/**
 * An existing empty stem to be reused.
 * Has no configured rules; its existing link.to is preserved as-is.
 */
export interface PlannedStemReuse {
  stemId: string;
  variableId: string;
  value: string;
}

export interface AutoGenerationPlan {
  /** The variable to be created. */
  variable: PlannedVariable;
  /** Actions that need varToSet written (and value for buttons). */
  actionUpdates: PlannedActionUpdate[];
  /**
   * Stem work for the directly-linked branch, if applicable.
   * undefined when:
   *   - The cell has no linked branch, OR
   *   - The linked branch does not qualify, OR
   *   - All input actions are input fields (no discrete values to build stems from)
   */
  stemWork?: {
    branchId: string;
    reuse: PlannedStemReuse[];
    add: PlannedNewStem[];
  };
  /**
   * True when the cell has no linked branch at all, signalling that the UI
   * should offer to create one. Branch creation is not included in the plan
   * itself — the user must confirm that separately.
   */
  offerBranchCreation: boolean;
}

// ── Plan builder ──────────────────────────────────────────────────────────────

/**
 * Builds an auto-generation plan for a qualifying cell.
 *
 * Async because variable name classification loads the GloVe vocab lazily.
 * Pass an AbortSignal to cancel the operation if the user navigates away
 * before the vocab finishes loading.
 *
 * @throws {DOMException} with name "AbortError" if the signal fires.
 */
export async function buildAutoGenerationPlan(
  cell: Cell,
  store: Store,
  actionDefs: ActionDef[],
  signal?: AbortSignal
): Promise<AutoGenerationPlan> {
  // Collect the button labels for classification.
  // All buttons are treated as one group (see design notes).
  const buttonActions = getButtonActions(cell, actionDefs);
  const inputFieldActions = getInputActions(cell, actionDefs).filter(
    (a) => a.name === "inputField"
  );

  const allButtonLabels = buttonActions
    .map((a) => (a.props.label as string | undefined) ?? "")
    .filter(Boolean);

  // For classification: prefer button labels; fall back to input field labels.
  const labelsForClassification =
    allButtonLabels.length > 0
      ? allButtonLabels
      : inputFieldActions
          .map((a) => (a.props.label as string | undefined) ?? "")
          .filter(Boolean);

  const classification = await classifyInputLabel(labelsForClassification);

  if (signal?.aborted) {
    throw new DOMException("Auto-generation cancelled", "AbortError");
  }

  const uniqueName = resolveUniqueName(
    classification.name,
    getVariables(store)
  );

  const variable: PlannedVariable = {
    id: uuidv4(),
    name: uniqueName,
    varType: "string",
    startingValue: "",
    description: "",
  };

  // Build action updates.
  const actionUpdates: PlannedActionUpdate[] = [];
  for (const action of buttonActions) {
    const rawLabel = (action.props.label as string | undefined) ?? "";
    actionUpdates.push({
      actionId: action.id,
      varToSet: variable.id,
      value: normalizeButtonValue(rawLabel),
    });
  }
  for (const action of inputFieldActions) {
    actionUpdates.push({
      actionId: action.id,
      varToSet: variable.id,
      // No value for input fields — the player captures it at runtime.
    });
  }

  // Determine stem work.
  const linkedBranchId = cell.link?.to;
  let stemWork: AutoGenerationPlan["stemWork"];
  let offerBranchCreation = false;

  if (!linkedBranchId) {
    // No following node at all — offer to create a branch (buttons only).
    offerBranchCreation = buttonActions.length > 0;
  } else {
    // Check whether the linked node is a qualifying branch.
    const linkedNode = store.project.sequences
      .flatMap((seq) => seq.nodes)
      .find((n) => n.id === linkedBranchId);

    const isBranch = linkedNode?.type === "branch";
    const qualifies =
      isBranch && branchQualifiesForAutoGeneration(linkedNode as Branch);

    if (qualifies && buttonActions.length > 0) {
      stemWork = buildStemWork(
        linkedBranchId,
        linkedNode as Branch,
        variable.id,
        buttonActions
      );
    }
  }

  return { variable, actionUpdates, stemWork, offerBranchCreation };
}

/**
 * Determines which existing stems can be reused and which need to be created
 * to cover the set of button values.
 *
 * Reuse criteria: stem type is "rules", link.to is empty, and rules array is empty.
 * New stems are appended in order after reused ones.
 */
function buildStemWork(
  branchId: string,
  branch: Branch,
  variableId: string,
  buttonActions: Action[]
): NonNullable<AutoGenerationPlan["stemWork"]> {
  const values = buttonActions.map((a) =>
    normalizeButtonValue((a.props.label as string | undefined) ?? "")
  );

  const reusableStems = branch.stems.filter(
    (s): s is Stem => s.type === "rules" && stemHasNoRules(s)
  );

  const reuse: PlannedStemReuse[] = [];
  const add: PlannedNewStem[] = [];

  values.forEach((value, i) => {
    if (i < reusableStems.length) {
      reuse.push({ stemId: reusableStems[i].id, variableId, value });
    } else {
      add.push({ id: uuidv4(), variableId, value });
    }
  });

  return { branchId, reuse, add };
}

/**
 * Returns the Autofill button/menu label for a given plan and context.
 */
export function getAutoGenerateLabel(
  plan: AutoGenerationPlan,
  context: "cell" | "branch"
): string {
  if (context === "branch") return "Autofill Branch Stems";
  if (plan.stemWork) return "Autofill Variables and Branch";
  return "Autofill Variables";
}

/**
 * Builds an auto-generation plan starting from a branch.
 *
 * Looks up the single qualifying preceding cell and delegates to
 * buildAutoGenerationPlan. Returns undefined if no unambiguous
 * qualifying predecessor exists.
 */
export async function buildAutoGenerationPlanFromBranch(
  branch: Branch,
  store: Store,
  actionDefs: ActionDef[],
  signal?: AbortSignal
): Promise<AutoGenerationPlan | undefined> {
  const precedingCell = getPrecedingCell(branch.id, store);
  if (!precedingCell) return undefined;
  if (!cellQualifiesForAutoGeneration(precedingCell, actionDefs))
    return undefined;

  return buildAutoGenerationPlan(precedingCell, store, actionDefs, signal);
}

// ── Apply ─────────────────────────────────────────────────────────────────────

/**
 * Applies an auto-generation plan to a copy of the store and returns it.
 * The caller is responsible for writing the result back via setStore().
 */
export function applyAutoGenerationPlan(
  plan: AutoGenerationPlan,
  store: Store
): Store {
  // 1. Add the new variable.
  store.project.variables.items.push({
    id: plan.variable.id,
    name: plan.variable.name,
    varType: plan.variable.varType,
    startingValue: plan.variable.startingValue,
    description: plan.variable.description,
  });

  // 2. Update action props.
  for (const sequence of store.project.sequences) {
    for (const node of sequence.nodes) {
      if (!node.actions) continue;
      for (const action of node.actions) {
        const update = plan.actionUpdates.find((u) => u.actionId === action.id);
        if (!update) continue;
        action.props.varToSet = update.varToSet;
        if (update.value !== undefined) action.props.value = update.value;
      }
    }
  }

  // 3. Apply stem work if present.
  if (plan.stemWork) {
    const { branchId, reuse, add } = plan.stemWork;
    for (const sequence of store.project.sequences) {
      const branchNode = sequence.nodes.find((n) => n.id === branchId);
      if (!branchNode) continue;
      const branch = branchNode as Branch;

      // Overwrite rules on reused stems (preserve their existing link).
      for (const stemReuse of reuse) {
        const stem = branch.stems.find((s) => s.id === stemReuse.stemId);
        if (!stem) continue;
        stem.rules = [
          {
            id: uuidv4(),
            type: "variable",
            variableId: stemReuse.variableId,
            operator: "equals",
            value: stemReuse.value,
          },
        ];
      }

      // Insert new stems before the noMatch stem.
      const noMatchIndex = branch.stems.findIndex((s) => s.type === "noMatch");
      const insertAt = noMatchIndex >= 0 ? noMatchIndex : branch.stems.length;
      const newStems: Stem[] = add.map((planned) => ({
        id: planned.id,
        type: "rules",
        match: "all",
        rules: [
          {
            id: uuidv4(),
            type: "variable",
            variableId: planned.variableId,
            operator: "equals",
            value: planned.value,
          },
        ],
        link: { to: "" },
      }));
      branch.stems.splice(insertAt, 0, ...newStems);
    }
  }

  return store;
}

// ── Apply-callback registry ───────────────────────────────────────────────────
// The active pane registers its handleApply function here so the menu handler
// in MainEditor can trigger it without knowing which pane is visible.

let _applyCallback: (() => void) | null = null;

export function registerApplyCallback(fn: () => void): void {
  _applyCallback = fn;
}

export function clearApplyCallback(): void {
  _applyCallback = null;
}

export function triggerApply(): void {
  _applyCallback?.();
}
