import { useEffect, useState } from "preact/hooks";
import { emit } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
// import Markdown from "preact-markdown";
import LogoSvg from "../assets/launcher/Logo-Text.svg?react";
import appIcon from "../../src-tauri/icons/128x128@2x.png";
// import credits from "./Credits.md?raw";
import releaseNotes from "../whats-new/WhatsNew.md?raw";
// import { openExternalLinks } from "../utils/openExternalLinks";

// "1.2" and "1.2.0" are the same version
function normalizeVersion(version: string): string {
  return version.trim().replace(/(\.0)+$/, "");
}

// The release notes cover only the newest changelog section: a version
// heading (e.g. "## 1.2"), then a date heading that scripts/changelog.cjs
// formats (e.g. "### November 14, 2026"). The date is only used if:
// - The section is for the running version, not a draft of the next one
// - The date has been formatted, so it's set (unlike e.g. "2026-11-xx")
// - The date isn't in the future, i.e. the version has been released
function getReleaseDate(appVersion: string): Date | null {
  const heading = releaseNotes.match(/^##\s+(.+)$/m)?.[1];
  if (
    !heading ||
    heading.includes("draft") ||
    normalizeVersion(heading) !== normalizeVersion(appVersion)
  ) {
    return null;
  }
  const dateText = releaseNotes.match(/^###\s+(.+)$/m)?.[1].trim();
  if (!dateText || /^\d{4}-/.test(dateText)) return null;
  const date = new Date(dateText);
  if (isNaN(date.getTime()) || date.getTime() > Date.now()) return null;
  return date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function About() {
  const [version, setVersion] = useState("");
  const releaseDate = version ? getReleaseDate(version) : null;
  // The year of the release, or of the build if it hasn't been released
  const copyrightYear = releaseDate?.getFullYear() ?? __BUILD_YEAR__;

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch((error) => console.error("Couldn't get the app version:", error))
      .finally(() => emit("window-ready", { label: "about" }));
  }, []);

  return (
    <div id="about" data-tauri-drag-region>
      <div class="info" data-tauri-drag-region>
        <img class="app-icon" src={appIcon} alt="" />
        <h1>
          <LogoSvg aria-label="Choicelab" />
        </h1>
        <p class="version">
          <strong>{version}</strong>
          {__BUILD_NUMBER__ !== "" && (
            <span class="build"> (Build {__BUILD_NUMBER__})</span>
          )}
        </p>
        {releaseDate && (
          <p class="release-date">Released on {formatDate(releaseDate)}</p>
        )}
        <p class="copyright">Copyright © {copyrightYear} Austin Heller</p>
      </div>
      {/* 
      <div class="credits">
        <div class="credits-inner" onClick={openExternalLinks}>
          {Markdown(credits)}
        </div>
      </div>
	  */}
    </div>
  );
}
