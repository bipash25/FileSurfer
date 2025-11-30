use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dependency {
    pub file: String,
    pub dependency: String,
    pub import_type: String, // "import", "require", "use", etc.
    pub line_number: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Function {
    pub file: String,
    pub name: String,
    pub signature: String,
    pub line_start: usize,
    pub line_end: usize,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TodoItem {
    pub file: String,
    pub todo_type: String, // "TODO", "FIXME", "NOTE", "HACK", "XXX"
    pub message: String,
    pub line_number: usize,
    pub context: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectType {
    pub detected_type: String,
    pub confidence: f32,
    pub indicators: Vec<String>,
}

/// Detect dependencies in a file
pub fn detect_dependencies(file_path: &str) -> Result<Vec<Dependency>, String> {
    let content =
        fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let mut dependencies = Vec::new();
    let extension = Path::new(file_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    match extension {
        "js" | "jsx" | "ts" | "tsx" | "mjs" => {
            dependencies.extend(detect_js_dependencies(file_path, &content)?);
        }
        "py" => {
            dependencies.extend(detect_python_dependencies(file_path, &content)?);
        }
        "rs" => {
            dependencies.extend(detect_rust_dependencies(file_path, &content)?);
        }
        "go" => {
            dependencies.extend(detect_go_dependencies(file_path, &content)?);
        }
        _ => {}
    }

    Ok(dependencies)
}

fn detect_js_dependencies(file: &str, content: &str) -> Result<Vec<Dependency>, String> {
    let mut deps = Vec::new();

    // Match: import ... from "..."
    let import_re = Regex::new(r#"import\s+.*?\s+from\s+['"]([^'"]+)['"]"#).unwrap();
    // Match: require("...")
    let require_re = Regex::new(r#"require\(['"]([^'"]+)['"]\)"#).unwrap();

    for (line_num, line) in content.lines().enumerate() {
        if let Some(cap) = import_re.captures(line) {
            deps.push(Dependency {
                file: file.to_string(),
                dependency: cap[1].to_string(),
                import_type: "import".to_string(),
                line_number: line_num + 1,
            });
        }
        if let Some(cap) = require_re.captures(line) {
            deps.push(Dependency {
                file: file.to_string(),
                dependency: cap[1].to_string(),
                import_type: "require".to_string(),
                line_number: line_num + 1,
            });
        }
    }

    Ok(deps)
}

fn detect_python_dependencies(file: &str, content: &str) -> Result<Vec<Dependency>, String> {
    let mut deps = Vec::new();

    let import_re = Regex::new(r"^import\s+(.+)$").unwrap();
    let from_import_re = Regex::new(r"^from\s+(.+?)\s+import").unwrap();

    for (line_num, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if let Some(cap) = import_re.captures(trimmed) {
            deps.push(Dependency {
                file: file.to_string(),
                dependency: cap[1].to_string(),
                import_type: "import".to_string(),
                line_number: line_num + 1,
            });
        }
        if let Some(cap) = from_import_re.captures(trimmed) {
            deps.push(Dependency {
                file: file.to_string(),
                dependency: cap[1].to_string(),
                import_type: "from".to_string(),
                line_number: line_num + 1,
            });
        }
    }

    Ok(deps)
}

fn detect_rust_dependencies(file: &str, content: &str) -> Result<Vec<Dependency>, String> {
    let mut deps = Vec::new();

    let use_re = Regex::new(r"^use\s+([^;]+);").unwrap();

    for (line_num, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if let Some(cap) = use_re.captures(trimmed) {
            deps.push(Dependency {
                file: file.to_string(),
                dependency: cap[1].to_string(),
                import_type: "use".to_string(),
                line_number: line_num + 1,
            });
        }
    }

    Ok(deps)
}

fn detect_go_dependencies(file: &str, content: &str) -> Result<Vec<Dependency>, String> {
    let mut deps = Vec::new();

    let import_re = Regex::new(r#"import\s+"([^"]+)""#).unwrap();

    for (line_num, line) in content.lines().enumerate() {
        if let Some(cap) = import_re.captures(line) {
            deps.push(Dependency {
                file: file.to_string(),
                dependency: cap[1].to_string(),
                import_type: "import".to_string(),
                line_number: line_num + 1,
            });
        }
    }

    Ok(deps)
}

/// Extract functions from a file
pub fn extract_functions(file_path: &str) -> Result<Vec<Function>, String> {
    let content =
        fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let extension = Path::new(file_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    match extension {
        "js" | "jsx" | "ts" | "tsx" => extract_js_functions(file_path, &content),
        "py" => extract_python_functions(file_path, &content),
        "rs" => extract_rust_functions(file_path, &content),
        _ => Ok(Vec::new()),
    }
}

fn extract_js_functions(file: &str, content: &str) -> Result<Vec<Function>, String> {
    let mut functions = Vec::new();

    // Match: function name(...) { }, const name = (...) => { }, etc.
    let func_re = Regex::new(
        r"(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:async\s*)?\([^)]*\)\s*(?:=>)?\s*\{",
    )
    .unwrap();

    let lines: Vec<&str> = content.lines().collect();

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(cap) = func_re.captures(line) {
            let name = cap[1].to_string();
            let signature = line.trim().to_string();

            // Try to find closing brace (simple heuristic)
            let mut brace_count =
                line.matches('{').count() as i32 - line.matches('}').count() as i32;
            let mut end_line = line_num;

            for i in (line_num + 1)..lines.len() {
                brace_count += lines[i].matches('{').count() as i32;
                brace_count -= lines[i].matches('}').count() as i32;

                if brace_count == 0 {
                    end_line = i;
                    break;
                }

                if i - line_num > 1000 {
                    break; // Prevent runaway
                }
            }

            let func_content = lines[line_num..=end_line].join("\n");

            functions.push(Function {
                file: file.to_string(),
                name,
                signature,
                line_start: line_num + 1,
                line_end: end_line + 1,
                content: func_content,
            });
        }
    }

    Ok(functions)
}

fn extract_python_functions(file: &str, content: &str) -> Result<Vec<Function>, String> {
    let mut functions = Vec::new();

    let func_re = Regex::new(r"^def\s+(\w+)\s*\([^)]*\):").unwrap();
    let lines: Vec<&str> = content.lines().collect();

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(cap) = func_re.captures(line.trim()) {
            let name = cap[1].to_string();
            let signature = line.trim().to_string();

            // Find end by indentation
            let base_indent = line.len() - line.trim_start().len();
            let mut end_line = line_num;

            for i in (line_num + 1)..lines.len() {
                let current_indent = lines[i].len() - lines[i].trim_start().len();
                if !lines[i].trim().is_empty() && current_indent <= base_indent {
                    end_line = i - 1;
                    break;
                }
                end_line = i;
            }

            let func_content = lines[line_num..=end_line].join("\n");

            functions.push(Function {
                file: file.to_string(),
                name,
                signature,
                line_start: line_num + 1,
                line_end: end_line + 1,
                content: func_content,
            });
        }
    }

    Ok(functions)
}

fn extract_rust_functions(file: &str, content: &str) -> Result<Vec<Function>, String> {
    let mut functions = Vec::new();

    let func_re = Regex::new(r"fn\s+(\w+)\s*\([^)]*\)").unwrap();
    let lines: Vec<&str> = content.lines().collect();

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(cap) = func_re.captures(line) {
            let name = cap[1].to_string();
            let signature = line.trim().to_string();

            // Find closing brace
            let mut brace_count =
                line.matches('{').count() as i32 - line.matches('}').count() as i32;
            let mut end_line = line_num;

            for i in (line_num + 1)..lines.len() {
                brace_count += lines[i].matches('{').count() as i32;
                brace_count -= lines[i].matches('}').count() as i32;

                if brace_count == 0 {
                    end_line = i;
                    break;
                }

                if i - line_num > 1000 {
                    break;
                }
            }

            let func_content = lines[line_num..=end_line].join("\n");

            functions.push(Function {
                file: file.to_string(),
                name,
                signature,
                line_start: line_num + 1,
                line_end: end_line + 1,
                content: func_content,
            });
        }
    }

    Ok(functions)
}

/// Extract TODO/FIXME/NOTE comments
pub fn extract_todos(file_path: &str) -> Result<Vec<TodoItem>, String> {
    let content = fs::read_to_string(file_path).map_err(|e| format!("Failed to read: {}", e))?;

    let mut todos = Vec::new();
    let todo_re = Regex::new(r"(?://|#|/\*)\s*(TODO|FIXME|NOTE|HACK|XXX):?\s*(.*)").unwrap();

    for (line_num, line) in content.lines().enumerate() {
        if let Some(cap) = todo_re.captures(line) {
            todos.push(TodoItem {
                file: file_path.to_string(),
                todo_type: cap[1].to_string(),
                message: cap[2].trim().to_string(),
                line_number: line_num + 1,
                context: line.trim().to_string(),
            });
        }
    }

    Ok(todos)
}

/// Filter comments from code
pub fn filter_comments(content: &str, extension: &str, include: bool) -> String {
    if include {
        return content.to_string();
    }

    match extension {
        "js" | "jsx" | "ts" | "tsx" | "rs" | "go" | "java" | "c" | "cpp" => {
            filter_c_style_comments(content)
        }
        "py" | "sh" | "bash" => filter_hash_comments(content),
        _ => content.to_string(),
    }
}

fn filter_c_style_comments(content: &str) -> String {
    let single_line_re = Regex::new(r"//.*$").unwrap();
    let multi_line_re = Regex::new(r"/\*[\s\S]*?\*/").unwrap();

    let mut result = multi_line_re.replace_all(content, "").to_string();
    result = single_line_re
        .replace_all(&result, "")
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect::<Vec<&str>>()
        .join("\n");

    result
}

fn filter_hash_comments(content: &str) -> String {
    content
        .lines()
        .filter(|line| !line.trim().starts_with('#'))
        .collect::<Vec<&str>>()
        .join("\n")
}

/// Detect project type from directory
pub fn detect_project_type(dir_path: &str) -> Result<ProjectType, String> {
    let indicators = vec![
        ("package.json", "Node.js"),
        ("next.config.js", "Next.js"),
        ("next.config.ts", "Next.js"),
        ("Cargo.toml", "Rust"),
        ("requirements.txt", "Python"),
        ("pyproject.toml", "Python"),
        ("Pipfile", "Python"),
        ("go.mod", "Go"),
        ("pom.xml", "Java/Maven"),
        ("build.gradle", "Java/Gradle"),
        ("Gemfile", "Ruby"),
        ("composer.json", "PHP"),
        (".csproj", "C#/.NET"),
    ];

    let mut found_indicators = Vec::new();
    let mut scores: HashMap<&str, f32> = HashMap::new();

    for (file, proj_type) in &indicators {
        let file_path = Path::new(dir_path).join(file);
        if file_path.exists() {
            found_indicators.push(file.to_string());
            *scores.entry(proj_type).or_insert(0.0) += 1.0;
        }
    }

    // Special handling for Next.js (higher priority if both package.json and next.config exist)
    if found_indicators.contains(&"package.json".to_string())
        && (found_indicators.contains(&"next.config.js".to_string())
            || found_indicators.contains(&"next.config.ts".to_string()))
    {
        *scores.entry(&"Next.js").or_insert(0.0) += 2.0;
    }

    let (detected_type, confidence) = scores
        .iter()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
        .map(|(t, s)| (t.to_string(), *s / indicators.len() as f32))
        .unwrap_or(("Unknown".to_string(), 0.0));

    Ok(ProjectType {
        detected_type,
        confidence,
        indicators: found_indicators,
    })
}

/// Resolve imports to absolute paths
pub fn resolve_imports(file_path: &str) -> Result<Vec<String>, String> {
    let dependencies = detect_dependencies(file_path)?;
    let base_dir = Path::new(file_path)
        .parent()
        .ok_or("Could not get parent directory")?;

    let mut resolved_paths = Vec::new();

    for dep in dependencies {
        // Skip system/library imports (heuristic: no ./ or ../ and no extension)
        // This is a basic heuristic and might need refinement
        if !dep.dependency.starts_with('.') && !dep.dependency.starts_with('/') {
            continue;
        }

        let dep_path = dep.dependency;
        let potential_path = base_dir.join(&dep_path);

        // Try exact match
        if potential_path.exists() && potential_path.is_file() {
            if let Some(s) = potential_path.to_str() {
                resolved_paths.push(s.to_string());
            }
            continue;
        }

        // Try adding extensions
        let extensions = ["js", "jsx", "ts", "tsx", "css", "scss", "json", "py", "rs"];
        for ext in extensions {
            let with_ext = potential_path.with_extension(ext);
            if with_ext.exists() && with_ext.is_file() {
                if let Some(s) = with_ext.to_str() {
                    resolved_paths.push(s.to_string());
                }
                break;
            }

            // Handle index files (e.g. import from "./components" -> "./components/index.js")
            let index_path = potential_path.join(format!("index.{}", ext));
            if index_path.exists() && index_path.is_file() {
                if let Some(s) = index_path.to_str() {
                    resolved_paths.push(s.to_string());
                }
                break;
            }
        }
    }

    // Remove duplicates
    resolved_paths.sort();
    resolved_paths.dedup();

    Ok(resolved_paths)
}
