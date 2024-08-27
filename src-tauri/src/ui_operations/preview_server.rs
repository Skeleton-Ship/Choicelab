use actix_files::NamedFile;
use actix_web::{web, App, HttpServer};
use std::path::PathBuf;

async fn serve_index(folder: web::Data<PathBuf>) -> actix_web::Result<NamedFile> {
	let index_path = folder.join("index.html");
	Ok(NamedFile::open(index_path)?)
}

async fn serve_file(path: web::Path<String>, folder: web::Data<PathBuf>) -> actix_web::Result<NamedFile> {
	let file_path = folder.join(path.into_inner());
	Ok(NamedFile::open(file_path)?)
}

#[actix_web::main]
pub async fn start_server(folder_path: PathBuf) -> std::io::Result<()> {
	HttpServer::new(move || {
		App::new()
			.app_data(web::Data::new(folder_path.clone()))
			.route("/", web::get().to(serve_index))
			.route("/{filename:.*}", web::get().to(serve_file))
	})
	.bind(("localhost", 3571))?
	.run()
	.await
}
