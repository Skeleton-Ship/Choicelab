import { save } from "@tauri-apps/api/dialog";

export default async function newProject() {
  const filePath = await save({
    filters: [
      {
        name: "My Project",
        extensions: [],
      },
    ],
  });
  if (filePath === null) {
  } else {
    console.log(filePath);
    // TODO: Create project folder directory at the above path
  }
}
