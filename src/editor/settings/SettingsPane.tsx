import { SettingBoolean } from "./SettingBoolean";
import { SettingsAppearance } from "./_CUSTOM_SettingsAppearance/SettingsAppearance";
import {
  BooleanProjectSettingName,
  ProjectSettingsPane,
  projectSettingsDefs,
  projectSettingsPanes,
} from "../../data/settingsDefs";

export function SettingsPane(props: { id: ProjectSettingsPane["id"] }) {
  const pane = projectSettingsPanes.find((pane) => pane.id === props.id);
  if (!pane) return <></>;
  return (
    <>
      {pane.settings.map((name) => {
        const setting = projectSettingsDefs[name];
        switch (setting.type) {
          case "boolean":
            return (
              <SettingBoolean
                name={name as BooleanProjectSettingName}
                label={setting.label}
                description={setting.description}
              />
            );
          case "__CUSTOM__ProjectAppearance":
            return <SettingsAppearance />;
        }
      })}
    </>
  );
}
