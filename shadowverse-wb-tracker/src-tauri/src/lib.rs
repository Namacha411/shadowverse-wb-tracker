use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn parse_qr_image(data: Vec<u8>) -> Result<String, String> {
    let img = image::load_from_memory(&data)
        .map_err(|e| e.to_string())?
        .to_luma8();
    let mut prepared = rqrr::PreparedImage::prepare(img);
    let grids = prepared.detect_grids();
    if grids.is_empty() {
        return Err("QRコードが見つかりませんでした。".to_string());
    }
    let (_, content): (rqrr::MetaData, String) = grids[0].decode().map_err(|e| e.to_string())?;
    Ok(content)
}

#[tauri::command]
fn backup_database(app: tauri::AppHandle) -> Result<String, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("shadowverse-wb.db");

    if !db_path.exists() {
        return Err("データベースファイルが見つかりません。".to_string());
    }

    let save_path = app
        .dialog()
        .file()
        .add_filter("SQLite Database", &["db"])
        .set_file_name("shadowverse-wb-backup.db")
        .blocking_save_file();

    match save_path {
        Some(path) => {
            let dest = path.into_path().map_err(|e| e.to_string())?;
            std::fs::copy(&db_path, &dest).map_err(|e| e.to_string())?;
            Ok("バックアップを保存しました。".to_string())
        }
        None => Err("cancelled".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "initial schema",
        sql: include_str!("db/migrations/001_init.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:shadowverse-wb.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![parse_qr_image, backup_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
