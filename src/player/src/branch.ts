import { Branch, Rule } from "./typings-project";
import { PlaybackVar } from "./typings";
import { getStore } from "./store";
import { warn } from "./logging";

function getStoredVariable(variableId: string): PlaybackVar | undefined {
  const store = getStore();
  let thisVar;
  store.playback.variables.items.forEach((variable) => {
    if (variable.id === variableId) {
      thisVar = variable as PlaybackVar;
    }
  });
  return thisVar;
}

function checkString(stemRule: Rule, storedVar: PlaybackVar): boolean {
  let valid = false;
  switch (stemRule.operator) {
    case "equals":
      if (storedVar.value === stemRule.value) {
        valid = true;
      }
      break;
    case "notEquals":
      if (storedVar.value !== stemRule.value) {
        valid = true;
      }
      break;
  }
  return valid;
}

function checkBoolean(stemRule: Rule, storedVar: PlaybackVar): boolean {
  let valid = false;
  switch (stemRule.operator) {
    case "equals":
      if (storedVar.value === stemRule.value) {
        valid = true;
      }
      break;
    case "notEquals":
      if (storedVar.value !== stemRule.value) {
        valid = true;
      }
      break;
  }
  return valid;
}

function checkNumber(stemRule: Rule, storedVar: PlaybackVar): boolean {
  let valid = false;
  switch (stemRule.operator) {
    case "equals":
      if (storedVar.value === stemRule.value) {
        valid = true;
      }
      break;
    case "notEquals":
      if (storedVar.value === stemRule.value) {
        valid = true;
      }
      break;
    case "greaterThan":
      if (storedVar.value > stemRule.value) {
        valid = true;
      }
      break;
    case "lessThan":
      if (storedVar.value < stemRule.value) {
        valid = true;
      }
      break;
    case "greaterThanOrEqualTo":
      if (storedVar.value >= stemRule.value) {
        valid = true;
      }
      break;
    case "lessThanOrEqualTo":
      if (storedVar.value <= stemRule.value) {
        valid = true;
      }
      break;
  }
  return valid;
}

export function runBranch(branch: Branch): string {
  let link = "";
  const stems = branch.stems;
  // Check all stems that aren't no-match
  stems.forEach((stem) => {
    // If link is filled out OR we hit a no-match, skip (for now)
    if (link !== "" || stem.type === "noMatch") {
      return;
    }
    const matchType = stem.match;
    let stemValid = false;
    // Evaluate rules in stem to see if the stem is valid
    for (var i = 0; i < stem.rules.length; i++) {
      const rule = stem.rules[i];
      let ruleValid = false;
      const variable = getStoredVariable(rule.variableId);
      if (!variable) {
        warn(
          `A variable attached to a rule was not found in the variable registry, so the stem will be ignored.`
        );
        return;
      }
      switch (variable.type) {
        case "string":
          ruleValid = checkString(rule, variable);
          break;
        case "boolean":
          ruleValid = checkBoolean(rule, variable);
          break;
        case "number":
          ruleValid = checkNumber(rule, variable);
          break;
      }
      // Depending on the match type, figure out if the whole stem is valid
      if (matchType === "any") {
        if (ruleValid === true) {
          stemValid = true;
          break;
        }
      } else if (matchType === "all") {
        if (ruleValid === false) {
          break;
        } else if (ruleValid === true && i + 1 === stem.rules.length) {
          stemValid = true;
        }
      }
    }
    if (stemValid === true) {
      link = stem.link.to;
    }
  });
  // If we still don't have a link, check the no-match branch
  if (link === "") {
    stems.forEach((stem) => {
      if (stem.type === "noMatch") {
        link = stem.link.to;
        return;
      }
    });
  }
  return link;
}
