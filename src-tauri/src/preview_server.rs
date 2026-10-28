use actix_files::NamedFile;
use actix_web::{error, http::header, web, App, HttpRequest, HttpResponse, HttpServer};
use std::path::{Path, PathBuf};

use crate::globals::PREVIEW_ASSET_DIRS;

// The player loads media from `./project/Assets/…` relative to the preview
const ASSETS_PREFIX: &str = "project/Assets/";

struct PreviewServer {
    // The generated preview files (index.html, player, project.json, fonts)
    folder: PathBuf,
    // The project window this server belongs to, for looking up its Assets folder
    label: String,
}

// Joins `relative` onto `root`, refusing paths that resolve outside of it
fn resolve_within(root: &Path, relative: &str) -> actix_web::Result<PathBuf> {
    let not_found = || error::ErrorNotFound("Not found");
    let root = root.canonicalize().map_err(|_| not_found())?;
    let path = root.join(relative).canonicalize().map_err(|_| not_found())?;
    if !path.starts_with(&root) {
        return Err(not_found());
    }
    Ok(path)
}

async fn serve_file(
    req: HttpRequest,
    path: Option<String>,
    server: web::Data<PreviewServer>,
) -> actix_web::Result<HttpResponse> {
    let path = path.unwrap_or_else(|| "index.html".to_string());
    // Assets are served straight from the project folder, so they never need to
    // be copied into the preview
    let file_path = match path.strip_prefix(ASSETS_PREFIX) {
        Some(asset) => {
            let assets_dir = PREVIEW_ASSET_DIRS
                .lock()
                .unwrap()
                .get(&server.label)
                .cloned()
                .ok_or_else(|| error::ErrorNotFound("Not found"))?;
            resolve_within(&assets_dir, asset)?
        }
        None => resolve_within(&server.folder, &path)?,
    };
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

pub async fn start_server(folder_path: PathBuf, label: String, port: u16) -> std::io::Result<()> {
    let server = web::Data::new(PreviewServer {
        folder: folder_path,
        label,
    });
    HttpServer::new(move || {
        App::new()
            .app_data(server.clone())
            .route(
                "/",
                web::get().to(|req: HttpRequest, server: web::Data<PreviewServer>| {
                    serve_file(req, None, server)
                }),
            )
            .route(
                "/{filename:.*}",
                web::get().to(
                    |req: HttpRequest, path: web::Path<String>, server: web::Data<PreviewServer>| {
                        serve_file(req, Some(path.into_inner()), server)
                    },
                ),
            )
    })
    .bind(("localhost", port))?
    .run()
    .await
}
