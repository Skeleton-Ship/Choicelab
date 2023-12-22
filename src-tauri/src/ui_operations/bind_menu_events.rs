use tauri::WindowMenuEvent;

pub fn bind_menu_events(event: WindowMenuEvent) {
	match event.menu_item_id() {
		  "new_project" => {
			  event.window().emit("menu-new-project", ()).unwrap();
		  }
		  "open_project" => {
			  event.window().emit("menu-open-project", ()).unwrap();
		  }
		  "save_project" => {
			  event.window().emit("menu-save-project", ()).unwrap();			  
		  }
		  "undo" => {
			  event.window().emit("menu-undo", ()).unwrap();
		  }
		  "redo" => {
			  event.window().emit("menu-redo", ()).unwrap();
		  }
		  "cut" => {
			  event.window().emit("menu-cut", ()).unwrap();
		  }
		  "copy" => {
			  event.window().emit("menu-copy", ()).unwrap();
		  }
		  "paste" => {
			  event.window().emit("menu-paste", ()).unwrap();
		  }
		  "new_cell" => {
			  event.window().emit("menu-new-cell", ()).unwrap();
		  }		 
		  "new_branch" => {
			  event.window().emit("menu-new-branch", ()).unwrap();
		  }		  
		  "delete_nodes" => {
			  event.window().emit("menu-delete-nodes", ()).unwrap();
		  }
		  "disconnect_link" => {
			  event.window().emit("menu-disconnect-link", ()).unwrap();
		  }		  
		  _ => {}
	  }
}