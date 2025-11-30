mod code_analysis;
mod config;
mod file_ops;
mod token_counter;

use code_analysis::{
    detect_dependencies, detect_project_type, extract_functions, extract_todos, filter_comments,
    resolve_imports, Dependency, Function, ProjectType, TodoItem,
};
use config::{
    add_recent_path, add_to_clipboard_history, clear_clipboard_history, load_clipboard_history,
    load_config, load_workspace_state, save_config, save_workspace_state, AppConfig,
    ClipboardHistory, WorkspaceState,
};
use file_ops::{
    copy_to_clipboard, export_to_file, get_git_tracked_files, read_file_contents, scan_directory,
    CopyRequest, ExportRequest,
};
use token_counter::{estimate_tokens, TokenEstimate};

#[tauri::command]
fn scan_dir(path: String, custom_patterns: Vec<String>) -> Result<Vec<file_ops::FileNode>, String> {
    scan_directory(&path, custom_patterns)
}

#[tauri::command]
fn read_files(request: CopyRequest) -> Result<String, String> {
    read_file_contents(&request)
}

#[tauri::command]
fn copy_clipboard(content: String) -> Result<(), String> {
    copy_to_clipboard(&content)
}

#[tauri::command]
fn get_git_files(repo_path: String) -> Result<Vec<String>, String> {
    get_git_tracked_files(&repo_path)
}

#[tauri::command]
fn export_file(request: ExportRequest) -> Result<(), String> {
    export_to_file(&request)
}

#[tauri::command]
fn save_app_config(config: AppConfig) -> Result<(), String> {
    save_config(&config)
}

#[tauri::command]
fn load_app_config() -> Result<AppConfig, String> {
    load_config()
}

#[tauri::command]
fn add_recent(path: String) -> Result<(), String> {
    add_recent_path(path)
}

// v3.0 Commands
#[tauri::command]
fn estimate_file_tokens(content: String) -> Result<TokenEstimate, String> {
    Ok(estimate_tokens(&content))
}

#[tauri::command]
fn get_dependencies(file_path: String) -> Result<Vec<Dependency>, String> {
    detect_dependencies(&file_path)
}

#[tauri::command]
fn get_functions(file_path: String) -> Result<Vec<Function>, String> {
    extract_functions(&file_path)
}

#[tauri::command]
fn get_todos(file_path: String) -> Result<Vec<TodoItem>, String> {
    extract_todos(&file_path)
}

#[tauri::command]
fn remove_comments(content: String, extension: String, include: bool) -> Result<String, String> {
    Ok(filter_comments(&content, &extension, include))
}

#[tauri::command]
fn get_project_type(dir_path: String) -> Result<ProjectType, String> {
    detect_project_type(&dir_path)
}

#[tauri::command]
fn resolve_file_imports(file_path: String) -> Result<Vec<String>, String> {
    resolve_imports(&file_path)
}

#[tauri::command]
fn save_workspace(state: WorkspaceState) -> Result<(), String> {
    save_workspace_state(&state)
}

#[tauri::command]
fn load_workspace(path: String) -> Result<WorkspaceState, String> {
    load_workspace_state(&path)
}

#[tauri::command]
fn add_clipboard_item(content: String, file_count: usize, format: String) -> Result<(), String> {
    add_to_clipboard_history(content, file_count, format)
}

#[tauri::command]
fn get_clipboard_history() -> Result<ClipboardHistory, String> {
    load_clipboard_history()
}

#[tauri::command]
fn clear_clipboard() -> Result<(), String> {
    clear_clipboard_history()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_dir,
            read_files,
            copy_clipboard,
            get_git_files,
            export_file,
            save_app_config,
            load_app_config,
            add_recent,
            // v3.0 commands
            estimate_file_tokens,
            get_dependencies,
            get_functions,
            get_todos,
            remove_comments,
            get_project_type,
            save_workspace,
            load_workspace,
            add_clipboard_item,
            get_clipboard_history,
            clear_clipboard,
            resolve_file_imports
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
