use git2::Repository;
use quick_xml::events::{BytesEnd, BytesStart, BytesText, Event};
use quick_xml::Writer;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Cursor;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CopyRequest {
    pub files: Vec<String>,
    pub base_path: String,
    pub format: String,
    pub max_file_size_mb: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportRequest {
    pub content: String,
    pub path: String,
}

// Default ignore patterns
const IGNORE_PATTERNS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    "target",
    ".next",
    "out",
    "coverage",
    ".cache",
    ".vscode",
    ".idea",
    "__pycache__",
    "*.pyc",
    ".DS_Store",
    "Thumbs.db",
];

pub fn should_ignore(path: &Path, custom_patterns: &[String]) -> bool {
    let path_str = path.to_string_lossy();

    // Check default patterns
    for pattern in IGNORE_PATTERNS {
        if pattern.contains('*') {
            let pattern_clean = pattern.trim_start_matches("*.");
            if let Some(ext) = path.extension() {
                if ext == pattern_clean {
                    return true;
                }
            }
        } else {
            if path_str.contains(pattern) {
                return true;
            }
        }
    }

    // Check custom patterns
    for pattern in custom_patterns {
        if pattern.contains('*') {
            let pattern_clean = pattern.trim_start_matches("*.");
            if let Some(ext) = path.extension() {
                if ext == pattern_clean {
                    return true;
                }
            }
        } else {
            if path_str.contains(pattern) {
                return true;
            }
        }
    }

    false
}

fn is_binary_file(path: &Path) -> bool {
    if let Ok(content) = fs::read(path) {
        let check_len = content.len().min(8000);
        for &byte in &content[..check_len] {
            if byte == 0 {
                return true;
            }
        }
    }
    false
}

pub fn scan_directory(
    dir_path: &str,
    custom_patterns: Vec<String>,
) -> Result<Vec<FileNode>, String> {
    let root = Path::new(dir_path);

    if !root.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut nodes = Vec::new();

    for entry in WalkDir::new(root)
        .max_depth(1)
        .min_depth(1)
        .into_iter()
        .filter_entry(|e| !should_ignore(e.path(), &custom_patterns))
    {
        match entry {
            Ok(entry) => {
                let path = entry.path();
                let metadata = match entry.metadata() {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                let node = FileNode {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: path.to_string_lossy().to_string(),
                    is_dir: metadata.is_dir(),
                    size: if metadata.is_file() {
                        metadata.len()
                    } else {
                        0
                    },
                    children: if metadata.is_dir() {
                        match scan_directory(&path.to_string_lossy(), custom_patterns.clone()) {
                            Ok(children) => Some(children),
                            Err(_) => Some(Vec::new()),
                        }
                    } else {
                        None
                    },
                };

                nodes.push(node);
            }
            Err(_) => continue,
        }
    }

    nodes.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(nodes)
}

pub fn get_git_tracked_files(repo_path: &str) -> Result<Vec<String>, String> {
    let repo =
        Repository::open(repo_path).map_err(|e| format!("Failed to open git repository: {}", e))?;

    let index = repo
        .index()
        .map_err(|e| format!("Failed to read git index: {}", e))?;

    let mut tracked_files = Vec::new();
    let repo_path_buf = std::path::PathBuf::from(repo_path);

    for entry in index.iter() {
        if let Ok(path_str) = std::str::from_utf8(&entry.path) {
            let full_path = repo_path_buf.join(path_str);
            tracked_files.push(full_path.to_string_lossy().to_string());
        }
    }

    Ok(tracked_files)
}

pub fn read_file_contents(request: &CopyRequest) -> Result<String, String> {
    let base_path = Path::new(&request.base_path);
    let max_size = request.max_file_size_mb.unwrap_or(10) * 1024 * 1024; // Convert MB to bytes

    match request.format.as_str() {
        "markdown" => format_as_markdown(request, base_path, max_size),
        "json" => format_as_json(request, base_path, max_size),
        "xml" => format_as_xml(request, base_path, max_size),
        _ => format_as_markdown(request, base_path, max_size),
    }
}

fn format_as_markdown(
    request: &CopyRequest,
    base_path: &Path,
    max_size: u64,
) -> Result<String, String> {
    let mut output = String::new();

    for file_path in &request.files {
        let path = Path::new(file_path);

        if !path.exists() || !path.is_file() {
            continue;
        }

        if is_binary_file(path) {
            continue;
        }

        // Check file size
        if let Ok(metadata) = path.metadata() {
            if metadata.len() > max_size {
                let relative_path = get_relative_path(path, base_path);
                output.push_str(&format!(
                    "{} : [File too large: {} bytes, max: {} bytes]\n\n",
                    relative_path,
                    metadata.len(),
                    max_size
                ));
                continue;
            }
        }

        let relative_path = get_relative_path(path, base_path);

        match fs::read_to_string(path) {
            Ok(content) => {
                let escaped_content = content.replace("```", "\\`\\`\\`");
                output.push_str(&format!(
                    "{} :\n```\n{}\n```\n\n",
                    relative_path, escaped_content
                ));
            }
            Err(e) => {
                output.push_str(&format!(
                    "{} : [Error reading file: {}]\n\n",
                    relative_path, e
                ));
            }
        }
    }

    Ok(output)
}

fn format_as_json(
    request: &CopyRequest,
    base_path: &Path,
    max_size: u64,
) -> Result<String, String> {
    #[derive(Serialize)]
    struct FileContent {
        path: String,
        content: Option<String>,
        error: Option<String>,
        size: u64,
    }

    let mut files_data = Vec::new();

    for file_path in &request.files {
        let path = Path::new(file_path);

        if !path.exists() || !path.is_file() {
            continue;
        }

        let relative_path = get_relative_path(path, base_path);
        let metadata = path.metadata().ok();
        let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);

        if is_binary_file(path) {
            files_data.push(FileContent {
                path: relative_path,
                content: None,
                error: Some("Binary file skipped".to_string()),
                size,
            });
            continue;
        }

        if size > max_size {
            files_data.push(FileContent {
                path: relative_path,
                content: None,
                error: Some(format!("File too large: {} bytes", size)),
                size,
            });
            continue;
        }

        match fs::read_to_string(path) {
            Ok(content) => {
                files_data.push(FileContent {
                    path: relative_path,
                    content: Some(content),
                    error: None,
                    size,
                });
            }
            Err(e) => {
                files_data.push(FileContent {
                    path: relative_path,
                    content: None,
                    error: Some(e.to_string()),
                    size,
                });
            }
        }
    }

    serde_json::to_string_pretty(&files_data)
        .map_err(|e| format!("Failed to serialize to JSON: {}", e))
}

fn format_as_xml(request: &CopyRequest, base_path: &Path, max_size: u64) -> Result<String, String> {
    let mut writer = Writer::new(Cursor::new(Vec::new()));

    writer
        .write_event(Event::Start(BytesStart::new("files")))
        .map_err(|e| format!("XML error: {}", e))?;

    for file_path in &request.files {
        let path = Path::new(file_path);

        if !path.exists() || !path.is_file() {
            continue;
        }

        let relative_path = get_relative_path(path, base_path);
        let metadata = path.metadata().ok();
        let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);

        let mut file_elem = BytesStart::new("file");
        file_elem.push_attribute(("path", relative_path.as_str()));
        file_elem.push_attribute(("size", size.to_string().as_str()));

        writer
            .write_event(Event::Start(file_elem.clone()))
            .map_err(|e| format!("XML error: {}", e))?;

        if is_binary_file(path) {
            writer
                .write_event(Event::Start(BytesStart::new("error")))
                .map_err(|e| format!("XML error: {}", e))?;
            writer
                .write_event(Event::Text(BytesText::new("Binary file skipped")))
                .map_err(|e| format!("XML error: {}", e))?;
            writer
                .write_event(Event::End(BytesEnd::new("error")))
                .map_err(|e| format!("XML error: {}", e))?;
        } else if size > max_size {
            writer
                .write_event(Event::Start(BytesStart::new("error")))
                .map_err(|e| format!("XML error: {}", e))?;
            writer
                .write_event(Event::Text(BytesText::new(&format!(
                    "File too large: {} bytes",
                    size
                ))))
                .map_err(|e| format!("XML error: {}", e))?;
            writer
                .write_event(Event::End(BytesEnd::new("error")))
                .map_err(|e| format!("XML error: {}", e))?;
        } else {
            match fs::read_to_string(path) {
                Ok(content) => {
                    writer
                        .write_event(Event::Start(BytesStart::new("content")))
                        .map_err(|e| format!("XML error: {}", e))?;
                    writer
                        .write_event(Event::Text(BytesText::new(&content)))
                        .map_err(|e| format!("XML error: {}", e))?;
                    writer
                        .write_event(Event::End(BytesEnd::new("content")))
                        .map_err(|e| format!("XML error: {}", e))?;
                }
                Err(e) => {
                    writer
                        .write_event(Event::Start(BytesStart::new("error")))
                        .map_err(|e| format!("XML error: {}", e))?;
                    writer
                        .write_event(Event::Text(BytesText::new(&e.to_string())))
                        .map_err(|e| format!("XML error: {}", e))?;
                    writer
                        .write_event(Event::End(BytesEnd::new("error")))
                        .map_err(|e| format!("XML error: {}", e))?;
                }
            }
        }

        writer
            .write_event(Event::End(BytesEnd::new("file")))
            .map_err(|e| format!("XML error: {}", e))?;
    }

    writer
        .write_event(Event::End(BytesEnd::new("files")))
        .map_err(|e| format!("XML error: {}", e))?;

    let result = writer.into_inner().into_inner();
    String::from_utf8(result).map_err(|e| format!("Failed to convert XML to string: {}", e))
}

fn get_relative_path(path: &Path, base_path: &Path) -> String {
    match path.strip_prefix(base_path) {
        Ok(p) => p.to_string_lossy().to_string(),
        Err(_) => path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
    }
}

pub fn export_to_file(request: &ExportRequest) -> Result<(), String> {
    fs::write(&request.path, &request.content).map_err(|e| format!("Failed to export file: {}", e))
}

pub fn copy_to_clipboard(content: &str) -> Result<(), String> {
    use arboard::Clipboard;

    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;

    clipboard
        .set_text(content)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

    Ok(())
}
