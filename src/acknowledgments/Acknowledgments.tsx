import { useEffect } from "preact/hooks";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import data from "./data.json";
const appWindow = getCurrentWebviewWindow();

type FontEntry = { name: string; licenseText: string };
type PackageEntry = {
  name: string;
  version: string;
  licenseType: string;
  repository: string;
  licenseText: string | null;
};

function FontSection({ name, licenseText }: FontEntry) {
  return (
    <section>
      <h3>{name}</h3>
      <pre>{licenseText}</pre>
    </section>
  );
}

function PackageSection({
  name,
  version,
  licenseType,
  repository,
  licenseText,
}: PackageEntry) {
  const heading = version ? `${name} ${version}` : name;
  return (
    <section>
      <h3>{heading}</h3>
      <p class="meta">
        {repository ? (
          <>
            <a href={repository}>{repository}</a> &middot; {licenseType}
          </>
        ) : (
          licenseType
        )}
      </p>
      {licenseText ? (
        <pre>{licenseText}</pre>
      ) : (
        <p class="no-license">No license file found.</p>
      )}
    </section>
  );
}

export function Acknowledgments() {
  useEffect(() => {
    emit("window-ready", { label: "acknowledgments" });
    listen("menu-request-quit", () => appWindow.close());
  }, []);

  return (
    <div id="acknowledgments" data-tauri-drag-region>
      <div class="inner">
        <h2>Fonts</h2>
        {(data.fonts as FontEntry[]).map((f) => (
          <FontSection key={f.name} {...f} />
        ))}
        <h2>Open Source Libraries</h2>
        {(data.packages as PackageEntry[]).map((p) => (
          <PackageSection key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}
