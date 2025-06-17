use actix_files::NamedFile;
use actix_web::{http::header, web, App, HttpRequest, HttpResponse, HttpServer};
use std::path::PathBuf;

async fn serve_file(
    req: HttpRequest,
    path: Option<String>,
    folder: web::Data<PathBuf>,
) -> actix_web::Result<HttpResponse> {
    // Determine the file path: "index.html" if None, otherwise the provided path
    let file_path = folder.join(path.clone().unwrap_or_else(|| "index.html".to_string()));
    let file = NamedFile::open(&file_path)?;

    let mut response = file.into_response(&req);

    // Set headers to prevent caching
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        header::HeaderValue::from_static("no-store"),
    );
    response
        .headers_mut()
        .insert(header::PRAGMA, header::HeaderValue::from_static("no-cache"));
    response
        .headers_mut()
        .insert(header::EXPIRES, header::HeaderValue::from_static("0"));

    Ok(response)
}

pub async fn start_server(folder_path: PathBuf, port: u16) -> std::io::Result<()> {
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(folder_path.clone()))
            .route(
                "/",
                web::get().to(|req: HttpRequest, folder: web::Data<PathBuf>| {
                    serve_file(req, None, folder)
                }),
            )
            .route(
                "/{filename:.*}",
                web::get().to(
                    |req: HttpRequest, path: web::Path<String>, folder: web::Data<PathBuf>| {
                        serve_file(req, Some(path.into_inner()), folder)
                    },
                ),
            )
    })
    .bind(("localhost", port))?
    .run()
    .await
}
