use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub theme: String,
    pub recent_paths: Vec<String>,
    pub custom_ignore_patterns: Vec<String>,
    pub max_file_size_mb: u64,
    pub output_format: String,
    pub git_only_mode: bool,
    pub include_comments: bool,
    pub show_token_count: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkspaceState {
    pub path: String,
    pub expanded_nodes: Vec<String>,
    pub selected_files: Vec<String>,
    pub scroll_position: f64,
    pub search_query: String,
    pub selected_extensions: Vec<String>,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardHistoryItem {
    pub content: String,
    pub timestamp: u64,
    pub file_count: usize,
    pub format: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardHistory {
    pub items: VecDeque<ClipboardHistoryItem>,
    pub max_items: usize,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            recent_paths: Vec::new(),
            custom_ignore_patterns: Vec::new(),
            max_file_size_mb: 10,
            output_format: "markdown".to_string(),
            git_only_mode: false,
            include_comments: true,
            show_token_count: true,
        }
    }
}

impl Default for WorkspaceState {
    fn default() -> Self {
        Self {
            path: String::new(),
            expanded_nodes: Vec::new(),
            selected_files: Vec::new(),
            scroll_position: 0.0,
            search_query: String::new(),
            selected_extensions: Vec::new(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }
}

impl Default for ClipboardHistory {
    fn default() -> Self {
        Self {
            items: VecDeque::new(),
            max_items: 10,
        }
    }
}

fn get_config_dir() -> Result<PathBuf, String> {
    let config_dir =
        dirs::config_dir().ok_or_else(|| "Could not find config directory".to_string())?;

    let app_config_dir = config_dir.join("FileSurfer");
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(app_config_dir)
}

fn get_config_path() -> Result<PathBuf, String> {
    Ok(get_config_dir()?.join("config.json"))
}

fn get_workspace_path(workspace_path: &str) -> Result<PathBuf, String> {
    let config_dir = get_config_dir()?;
    // Create safe filename from path
    let safe_name = workspace_path.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    Ok(config_dir.join(format!("workspace_{}.json", safe_name)))
}

fn get_clipboard_history_path() -> Result<PathBuf, String> {
    Ok(get_config_dir()?.join("clipboard_history.json"))
}

// App Config Functions
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path()?;
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(config_path, json).map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

pub fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        return Ok(AppConfig::default());
    }

    let json =
        fs::read_to_string(config_path).map_err(|e| format!("Failed to read config: {}", e))?;

    let config: AppConfig =
        serde_json::from_str(&json).map_err(|e| format!("Failed to parse config: {}", e))?;

    Ok(config)
}

pub fn add_recent_path(path: String) -> Result<(), String> {
    let mut config = load_config()?;

    // Remove if already exists
    config.recent_paths.retain(|p| p != &path);

    // Add to front
    config.recent_paths.insert(0, path);

    // Keep only last 10
    if config.recent_paths.len() > 10 {
        config.recent_paths.truncate(10);
    }

    save_config(&config)
}

// Workspace State Functions
pub fn save_workspace_state(state: &WorkspaceState) -> Result<(), String> {
    let workspace_path = get_workspace_path(&state.path)?;
    let json = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize workspace: {}", e))?;

    fs::write(workspace_path, json).map_err(|e| format!("Failed to write workspace: {}", e))?;

    Ok(())
}

pub fn load_workspace_state(path: &str) -> Result<WorkspaceState, String> {
    let workspace_path = get_workspace_path(path)?;

    if !workspace_path.exists() {
        let mut default_state = WorkspaceState::default();
        default_state.path = path.to_string();
        return Ok(default_state);
    }

    let json = fs::read_to_string(workspace_path)
        .map_err(|e| format!("Failed to read workspace: {}", e))?;

    let state: WorkspaceState =
        serde_json::from_str(&json).map_err(|e| format!("Failed to parse workspace: {}", e))?;

    Ok(state)
}

// Clipboard History Functions
pub fn add_to_clipboard_history(
    content: String,
    file_count: usize,
    format: String,
) -> Result<(), String> {
    let mut history = load_clipboard_history()?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let item = ClipboardHistoryItem {
        content,
        timestamp,
        file_count,
        format,
    };

    // Add to front
    history.items.push_front(item);

    // Keep only max items
    while history.items.len() > history.max_items {
        history.items.pop_back();
    }

    save_clipboard_history(&history)
}

pub fn load_clipboard_history() -> Result<ClipboardHistory, String> {
    let history_path = get_clipboard_history_path()?;

    if !history_path.exists() {
        return Ok(ClipboardHistory::default());
    }

    let json = fs::read_to_string(history_path)
        .map_err(|e| format!("Failed to read clipboard history: {}", e))?;

    let history: ClipboardHistory = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse clipboard history: {}", e))?;

    Ok(history)
}

pub fn save_clipboard_history(history: &ClipboardHistory) -> Result<(), String> {
    let history_path = get_clipboard_history_path()?;
    let json = serde_json::to_string_pretty(history)
        .map_err(|e| format!("Failed to serialize clipboard history: {}", e))?;

    fs::write(history_path, json)
        .map_err(|e| format!("Failed to write clipboard history: {}", e))?;

    Ok(())
}

pub fn clear_clipboard_history() -> Result<(), String> {
    let history = ClipboardHistory::default();
    save_clipboard_history(&history)
}
