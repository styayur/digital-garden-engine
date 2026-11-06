use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Deserialize;
use std::fs;
use std::path::{Component, Path, PathBuf};

#[derive(Deserialize)]
struct ProjectFile {
    path: String,
    #[serde(rename = "dataBase64")]
    data_base64: String,
}

fn safe_path(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let relative_path = Path::new(relative);
    if relative_path.is_absolute() {
        return Err("Project file paths must be relative.".into());
    }
    for component in relative_path.components() {
        if !matches!(component, Component::Normal(_)) {
            return Err(format!("Unsafe project path rejected: {relative}"));
        }
    }
    Ok(root.join(relative_path))
}

#[tauri::command]
fn save_project(root: String, project_json: String) -> Result<String, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_absolute() {
        return Err("The project directory must be absolute.".into());
    }
    fs::create_dir_all(root_path.join(".rhizomaybor")).map_err(|error| error.to_string())?;
    let primary = root_path.join(".rhizomaybor").join("project.json");
    fs::write(&primary, &project_json).map_err(|error| error.to_string())?;
    fs::write(root_path.join("rhizomaybor.project.json"), &project_json)
        .map_err(|error| error.to_string())?;
    Ok(primary.to_string_lossy().to_string())
}

#[tauri::command]
fn load_project(root: String) -> Result<String, String> {
    let root_path = PathBuf::from(&root);
    let primary = root_path.join(".rhizomaybor").join("project.json");
    let fallback = root_path.join("rhizomaybor.project.json");
    let source = if primary.exists() { primary } else { fallback };
    fs::read_to_string(source).map_err(|error| format!("Could not read project: {error}"))
}

#[tauri::command]
fn write_project_files(root: String, files: Vec<ProjectFile>) -> Result<Vec<String>, String> {
    let root_path = PathBuf::from(&root);
    let mut written = Vec::with_capacity(files.len());
    for file in files {
        let target = safe_path(&root_path, &file.path)?;
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        let bytes = STANDARD
            .decode(file.data_base64)
            .map_err(|error| format!("Invalid base64 file payload: {error}"))?;
        fs::write(&target, bytes).map_err(|error| error.to_string())?;
        written.push(target.to_string_lossy().to_string());
    }
    Ok(written)
}

#[tauri::command]
fn save_binary_file(root: String, filename: String, data_base64: String) -> Result<String, String> {
    let root_path = PathBuf::from(&root);
    let target = safe_path(&root_path, &filename)?;
    let bytes = STANDARD
        .decode(data_base64)
        .map_err(|error| format!("Invalid base64 archive payload: {error}"))?;
    fs::write(&target, bytes).map_err(|error| error.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_project,
            load_project,
            write_project_files,
            save_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Rhizomaybor desktop");
}

#[cfg(test)]
mod tests {
    use super::safe_path;
    use std::path::Path;

    #[test]
    fn rejects_parent_traversal() {
        assert!(safe_path(Path::new("C:/project"), "../secret.txt").is_err());
    }

    #[test]
    fn accepts_nested_output_path() {
        assert!(safe_path(Path::new("C:/project"), "dist/index.html").is_ok());
    }
}
