use tauri::WindowMenuEvent;

pub fn bind_menu_events(event: WindowMenuEvent) {
	let window = event.window();
	let menu_handle = window.menu_handle();
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
		  "set_link" => {
			  event.window().emit("menu-set-link", ()).unwrap();
		  }
		  "disconnect_link" => {
			  event.window().emit("menu-disconnect-link", ()).unwrap();
		  }	
		  "show_node_editor" => {
			  event.window().emit("menu-show-node-editor", ()).unwrap();
			  let _ = menu_handle.get_item("show_node_editor").set_selected(true);
			  let _ = menu_handle.get_item("show_variables").set_selected(false);
		  }	  
		  "show_variables" => {
			  event.window().emit("menu-show-variables", ()).unwrap();
			  let _ = menu_handle.get_item("show_node_editor").set_selected(false);
			  let _ = menu_handle.get_item("show_variables").set_selected(true);
		  }	 
		_ => {}
	  }
}