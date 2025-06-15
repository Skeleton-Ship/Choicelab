import { SettingBoolean } from "./SettingBoolean";

type Pane = {
  label: string;
  id: string;
  description: string;
  settings: Array<string>;
};

function getSettingsForPane(paneId: string, config: { [key: string]: any }) {
  let settings: { [key: string]: any } = {};
  config.projectSettings.panes.forEach((pane: Pane) => {
    if (pane.id !== paneId) return;
    pane.settings.forEach((settingName) => {
      settings[settingName] = config.projectSettings.settings[settingName];
    });
  });
  return settings;
}

export function SettingsPane(props: {
  id: string;
  config: { [key: string]: any };
}) {
  const settings = getSettingsForPane(props.id, props.config);
  return (
    <div>
      {Object.keys(settings).map((name) => {
        const setting = settings[name];
        switch (setting.type) {
          case "boolean":
            return <SettingBoolean name={name} label={setting.label} />;
          case "__CUSTOM__ProjectAppearance":
            return <div>Project appearance goes here</div>;
        }
      })}
    </div>
  );
}
