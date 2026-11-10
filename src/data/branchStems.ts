import { Branch, Stem, Store } from "../typings";
import { createBranchStem } from "./createNode";
import { getBranch } from "./getData";

/** The most stems (including the no-match stem) a branch can have. */
export const MAX_BRANCH_STEMS = 10;

export type AddableStemType = "rules" | "noMatch";

export function hasNoMatchStem(branch: Branch): boolean {
  return branch.stems.some((stem) => stem.type === "noMatch");
}

/**
 * Whether a stem of this type can be added to the branch. A branch can have
 * at most one no-match stem.
 */
export function canAddStem(branch: Branch, type: AddableStemType): boolean {
  if (branch.stems.length >= MAX_BRANCH_STEMS) return false;
  if (type === "noMatch" && hasNoMatchStem(branch)) return false;
  return true;
}

/**
 * Whether the stem can be deleted. A branch always keeps at least one stem,
 * so it has somewhere to link to.
 */
export function canDeleteStem(branch: Branch): boolean {
  return branch.stems.length > 1;
}

/**
 * Adds a stem to a branch in the store (mutating it), keeping the no-match
 * stem last. Returns the new stem, or undefined if it can't be added.
 */
export function addStemToBranch(
  branchId: string,
  type: AddableStemType,
  store: Store
): Stem | undefined {
  const branch: Branch | undefined = getBranch(branchId, store);
  if (!branch || !canAddStem(branch, type)) return;
  const stem = createBranchStem(type);
  const ruleStems = branch.stems.filter((s) => s.type !== "noMatch");
  const noMatchStems = branch.stems.filter((s) => s.type === "noMatch");
  if (type === "noMatch") {
    noMatchStems.push(stem);
  } else {
    ruleStems.push(stem);
  }
  branch.stems = [...ruleStems, ...noMatchStems];
  return stem;
}
