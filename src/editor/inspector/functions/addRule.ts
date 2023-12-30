import { Branch, Stem } from "../../../typings";
import { getBranch, getBranchStem } from "../../../data/getData";
import { getStore, setStore } from "../../../data/dataStore";
import { createRule } from "../../../data/createNode";
import handleSelectNode from "../../sequence/selecting/handleSelectNode";

export default function addRule(
  stemId: string,
  branchId: string,
  update: Function
) {
  const store = getStore();
  const branch: Branch | undefined = getBranch(branchId, store);
  const stem: Stem | undefined = getBranchStem(stemId, branchId, store);
  if (!branch || !stem) return;
  const rule = createRule();
  stem.rules.push(rule);
  setStore(store);
  update();
  handleSelectNode(branch, update);
}
