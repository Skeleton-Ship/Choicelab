const fs = require("fs");
const path = require("path");

const changelogPath = path.join(__dirname, "../changelog.md");
const outputPath = path.join(__dirname, "../src", "whats-new", "WhatsNew.md");

if (!fs.existsSync(changelogPath)) return;
let changelog = fs.readFileSync(changelogPath, "utf8");

// Format the first date heading before finding section bounds, since the
// formatted date has a different length and would shift any earlier indices.
const dateRegex = /### \d\d\d\d-[\dx][\dx]-[\dx][\dx]/g;
const dateMatches = changelog.match(dateRegex);
if (dateMatches) {
  const match = dateMatches[0];
  const dateString = match.replace("### ", "");
  const centralDateString = `${dateString}T00:00:00-06:00`;
  const date = new Date(centralDateString);
  if (!isNaN(date.getTime())) {
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    changelog = changelog.replace(match, `### ${formattedDate}`);
  }
}

const h2Regex = /^##\s.*$/gm;
const matches = changelog.match(h2Regex);
if (!matches || matches.length === 0) return;
const firstH2Index = changelog.indexOf(matches[0]);
const nextH2Index = matches[1]
  ? changelog.indexOf(matches[1])
  : changelog.length;
const whatsNewContent = changelog.substring(firstH2Index, nextH2Index).trim();
fs.writeFileSync(outputPath, whatsNewContent, "utf8");
return whatsNewContent;
