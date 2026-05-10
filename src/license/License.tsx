import { useEffect } from "preact/hooks";
import { emit } from "@tauri-apps/api/event";
import editorLicense from "../../LICENSE?raw";
import playerLicense from "../../src/player/LICENSE?raw";

export function License() {
  useEffect(() => {
    emit("window-ready", { label: "license" });
  }, []);

  return (
    <div id="license" data-tauri-drag-region>
      <div class="inner">
        <p>
          Choicelab is free software, licensed under the{" "}
          <strong>GNU General Public License v3.0 (GPL-3.0)</strong>—with the
          exception of its runtime player (what's included when you export a
          project from this application), which is licensed under the{" "}
          <strong>MIT License</strong>.
        </p>
        <p>
          <strong>
            The Choicelab name is a trademark of Austin Heller, and is not
            included in the above licenses.
          </strong>{" "}
          It cannot be used in derivative projects without written permission
          from the author.
        </p>
        <p>For more information, read the full text of both licenses below.</p>
        <hr />
        <h2>License (all components except player)</h2>
        <pre>{editorLicense}</pre>
        <h2>Runtime player license</h2>
        <pre>{playerLicense}</pre>
      </div>
    </div>
  );
}
