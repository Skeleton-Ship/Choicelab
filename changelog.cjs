const fs = require("fs");
const path = require("path");

const changelogPath = path.join(__dirname, "CHANGELOG.md");
const outputPath = path.join(__dirname, "src", "whats-new", "WhatsNew.md");

if (!fs.existsSync(changelogPath)) return;
const changelog = fs.readFileSync(changelogPath, "utf8");
const h2Regex = /^##\s.*$/gm;
const matches = changelog.match(h2Regex);
if (matches.length === 0) return;
const firstH2Index = changelog.indexOf(matches[0]);
const nextH2Index = matches[1]
  ? changelog.indexOf(matches[1])
  : changelog.length - 1;
const whatsNewContent = changelog.substring(firstH2Index, nextH2Index).trim();
fs.writeFileSync(outputPath, whatsNewContent, "utf8");
return whatsNewContent;
