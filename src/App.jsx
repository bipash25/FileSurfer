import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FolderOpen, Search, Settings, Moon, Sun, Copy, FileText,
  Code, History, Filter, X, Menu, ChevronRight, ChevronDown,
  FileCode, Layers, Zap, AlertCircle, Command
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { minimatch } from "minimatch";

import DirectoryPicker from "./components/DirectoryPicker";
import FileTree from "./components/FileTree";
import PreviewPanel from "./components/PreviewPanel";
import SearchBar from "./components/SearchBar";
import ExtensionFilters from "./components/ExtensionFilters";
import SettingsPanel from "./components/SettingsPanel";
import KeyboardShortcuts, { KeyboardHelp } from "./components/KeyboardShortcuts";
import TokenCounter from "./components/TokenCounter";
import CodeAnalysisPanel from "./components/CodeAnalysisPanel";
import ClipboardHistoryPanel from "./components/ClipboardHistoryPanel";
import InverseSelectionPanel from "./components/InverseSelectionPanel";
import ProjectTypeDetector from "./components/ProjectTypeDetector";
import TitleBar from "./components/TitleBar";

function App() {
  // Core state
  const [selectedPath, setSelectedPath] = useState("");
  const [fileTree, setFileTree] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [selectedExtensions, setSelectedExtensions] = useState([]);
  const [filteredTree, setFilteredTree] = useState([]);
  const [inversePatterns, setInversePatterns] = useState([]);

  // Config state
  const [config, setConfig] = useState(null);
  const [outputFormat, setOutputFormat] = useState("markdown");

  // UI state
  const [activeTab, setActiveTab] = useState("preview"); // preview, analysis
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInverseSelection, setShowInverseSelection] = useState(false);

  const searchInputRef = useRef(null);

  // Load config on mount
  useEffect(() => {
    loadAppConfig();
  }, []);

  // Apply theme when config changes
  useEffect(() => {
    if (config) {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(config.theme || "dark");
      setOutputFormat(config.output_format || "markdown");
    }
  }, [config]);

  // Workspace Persistence
  useEffect(() => {
    if (selectedPath) {
      const saveState = async () => {
        try {
          await invoke("save_workspace", {
            state: {
              path: selectedPath,
              expanded_nodes: expandedNodes,
              selected_files: selectedFiles,
              scroll_position: 0,
              search_query: searchQuery,
              selected_extensions: selectedExtensions,
              timestamp: Date.now()
            }
          });
        } catch (e) {
          console.error("Failed to save workspace:", e);
        }
      };
      const timeout = setTimeout(saveState, 1000);
      return () => clearTimeout(timeout);
    }
  }, [selectedPath, selectedFiles, searchQuery, selectedExtensions, expandedNodes]);

  // Filter tree logic
  useEffect(() => {
    if (!fileTree || fileTree.length === 0) {
      setFilteredTree([]);
      return;
    }

    let filtered = filterTree(fileTree, debouncedSearchQuery, selectedExtensions);

    // Apply inverse selection if active
    if (inversePatterns.length > 0) {
      // Logic handled in selection, but visual filtering could happen here
    }

    setFilteredTree(filtered);
  }, [debouncedSearchQuery, selectedExtensions, fileTree, inversePatterns]);

  async function loadAppConfig() {
    try {
      const loadedConfig = await invoke("load_app_config");
      setConfig(loadedConfig);
    } catch (error) {
      console.error("Failed to load config:", error);
      const defaultConfig = {
        theme: "dark",
        recent_paths: [],
        custom_ignore_patterns: [],
        max_file_size_mb: 10,
        output_format: "markdown",
        git_only_mode: false,
        include_comments: true,
        show_token_count: true
      };
      setConfig(defaultConfig);
      // Auto-repair: save the default config to fix the missing fields
      saveAppConfig(defaultConfig);
    }
  }

  async function saveAppConfig(newConfig) {
    try {
      await invoke("save_app_config", { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  async function handlePathSelect(path) {
    setSelectedPath(path);
    try {
      await invoke("add_recent", { path });
      loadAppConfig();

      // Try to load workspace state
      try {
        const state = await invoke("load_workspace", { path });
        if (state && state.path === path) {
          if (state.selected_files?.length > 0) setSelectedFiles(state.selected_files);
          if (state.search_query) setSearchQuery(state.search_query);
          if (state.selected_extensions?.length > 0) setSelectedExtensions(state.selected_extensions);
          if (state.expanded_nodes?.length > 0) setExpandedNodes(state.expanded_nodes);
        }
      } catch (e) {
        // No saved state or error, ignore
      }
    } catch (error) {
      console.error("Failed to add recent path:", error);
    }
    await scanDirectory(path);
  }

  async function scanDirectory(path) {
    setLoading(true);
    setStatus({ type: '', message: '' });
    // Don't clear selection if reloading workspace
    setPreviewContent("");

    try {
      const customPatterns = config?.custom_ignore_patterns || [];
      let tree;

      if (config?.git_only_mode) {
        try {
          const gitFiles = await invoke("get_git_files", { repoPath: path });
          tree = await invoke("scan_dir", { path, customPatterns });
          tree = filterTreeByGitFiles(tree, gitFiles);
        } catch (gitError) {
          console.warn("Git mode failed, fallback:", gitError);
          tree = await invoke("scan_dir", { path, customPatterns });
        }
      } else {
        tree = await invoke("scan_dir", { path, customPatterns });
      }

      setFileTree(tree);
      setStatus({ type: 'success', message: `Scanned ${countFiles(tree)} files` });
    } catch (error) {
      console.error("Error scanning:", error);
      setStatus({ type: 'error', message: `Error: ${error}` });
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  }

  function filterTreeByGitFiles(nodes, gitFiles) {
    return nodes.filter(node => {
      if (node.is_dir && node.children) {
        const filteredChildren = filterTreeByGitFiles(node.children, gitFiles);
        if (filteredChildren.length > 0) {
          node.children = filteredChildren;
          return true;
        }
        return false;
      } else {
        return gitFiles.includes(node.path);
      }
    });
  }

  function filterTree(nodes, query, extensions) {
    if (!query && extensions.length === 0) return nodes;
    return nodes.filter(node => {
      if (extensions.length > 0 && !node.is_dir) {
        const nodeExt = '.' + (node.name.split('.').pop()?.toLowerCase() || '');
        if (!extensions.includes(nodeExt)) return false;
      }
      if (query && !node.name.toLowerCase().includes(query.toLowerCase())) {
        if (!node.is_dir) return false;
        if (node.children) {
          const filteredChildren = filterTree(node.children, query, extensions);
          if (filteredChildren.length === 0) return false;
        }
      }
      if (node.is_dir && node.children) {
        const filteredChildren = filterTree(node.children, query, extensions);
        node.children = filteredChildren;
      }
      return true;
    });
  }

  function countFiles(nodes) {
    let count = 0;
    for (const node of nodes) {
      if (node.is_dir && node.children) count += countFiles(node.children);
      else if (!node.is_dir) count++;
    }
    return count;
  }

  function getAllFilesRecursive(node) {
    let files = [];
    if (node.is_dir && node.children) {
      for (const child of node.children) files = files.concat(getAllFilesRecursive(child));
    } else {
      files.push(node.path);
    }
    return files;
  }

  function toggleSelection(node) {
    const nodePaths = getAllFilesRecursive(node);
    const allSelected = nodePaths.every(path => selectedFiles.includes(path));
    let newSelected;
    if (allSelected) {
      newSelected = selectedFiles.filter(path => !nodePaths.includes(path));
    } else {
      newSelected = [...selectedFiles];
      for (const path of nodePaths) {
        if (!newSelected.includes(path)) newSelected.push(path);
      }
    }
    setSelectedFiles(newSelected);
    generatePreview(newSelected);
  }

  function selectAll() {
    const allFiles = [];
    function collectFiles(nodes) {
      for (const node of nodes) {
        if (node.is_dir && node.children) collectFiles(node.children);
        else allFiles.push(node.path);
      }
    }
    collectFiles(filteredTree.length > 0 ? filteredTree : fileTree);
    setSelectedFiles(allFiles);
    generatePreview(allFiles);
  }

  function deselectAll() {
    setSelectedFiles([]);
    setPreviewContent("");
  }

  function toggleExpandedNode(nodePath) {
    setExpandedNodes(prev => {
      if (prev.includes(nodePath)) {
        return prev.filter(path => path !== nodePath);
      } else {
        return [...prev, nodePath];
      }
    });
  }

  function handleInverseSelection(patterns) {
    setInversePatterns(patterns);

    // Get all files from the tree
    const allFiles = [];
    function collectFiles(nodes) {
      for (const node of nodes) {
        if (node.is_dir && node.children) collectFiles(node.children);
        else allFiles.push(node.path);
      }
    }
    collectFiles(filteredTree.length > 0 ? filteredTree : fileTree);

    // Filter out files that match any of the exclude patterns
    const inversedFiles = allFiles.filter(filePath => {
      // Get relative path for pattern matching
      const relativePath = filePath.replace(selectedPath, '').replace(/^[\\/]+/, '');

      // Check if file matches any exclude pattern
      const shouldExclude = patterns.some(pattern => {
        // Support both file paths and file names
        return minimatch(relativePath, pattern, { matchBase: true, dot: true }) ||
          minimatch(filePath, pattern, { matchBase: true, dot: true });
      });

      return !shouldExclude; // Keep files that DON'T match exclude patterns
    });

    setSelectedFiles(inversedFiles);
    generatePreview(inversedFiles);
    setStatus({
      type: 'success',
      message: `Inverse selection: ${inversedFiles.length} files selected (excluded ${allFiles.length - inversedFiles.length})`
    });
  }

  async function generatePreview(files = selectedFiles) {
    if (files.length === 0) {
      setPreviewContent("");
      return;
    }
    setPreviewLoading(true);
    try {
      const content = await invoke("read_files", {
        request: {
          files: files,
          base_path: selectedPath,
          format: outputFormat,
          max_file_size_mb: config?.max_file_size_mb || 10
        }
      });
      setPreviewContent(content);
    } catch (error) {
      console.error("Error generating preview:", error);
      setStatus({ type: 'error', message: `Error: ${error}` });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!previewContent) return;
    setLoading(true);
    try {
      await invoke("copy_clipboard", { content: previewContent });
      await invoke("add_clipboard_item", {
        content: previewContent,
        fileCount: selectedFiles.length,
        format: outputFormat
      });
      setStatus({ type: 'success', message: `Copied ${selectedFiles.length} files!` });
    } catch (error) {
      setStatus({ type: 'error', message: `Error: ${error}` });
    } finally {
      setLoading(false);
    }
  }
  const displayTree = filteredTree.length > 0 || searchQuery || selectedExtensions.length > 0
    ? filteredTree : fileTree;

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden pt-8">
        {/* Sidebar */}
        <aside className="w-80 flex flex-col border-r border-border bg-card/50">
          <div className="p-4 border-b border-border">
            <DirectoryPicker
              selectedPath={selectedPath}
              onPathSelect={handlePathSelect}
              recentPaths={config?.recent_paths || []}
              onClearRecent={handleClearRecent}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {fileTree.length > 0 && (
              <>
                <ExtensionFilters
                  selectedExtensions={selectedExtensions}
                  onFilterChange={setSelectedExtensions}
                />

                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showInverseSelection
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    onClick={() => setShowInverseSelection(true)}
                    title="Inverse Selection"
                  >
                    <Filter size={12} className="inline mr-1.5" /> Inverse
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    onClick={selectAll}
                  >
                    All
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    onClick={deselectAll}
                  >
                    None
                  </button>
                </div>

                <div className="mt-4">
                  <FileTree
                    fileTree={displayTree}
                    selectedFiles={selectedFiles}
                    onToggle={toggleSelection}
                    loading={loading}
                    expandedNodes={expandedNodes}
                    onToggleExpand={toggleExpandedNode}
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-border bg-card/30">
            <ProjectTypeDetector currentPath={selectedPath} />
            <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground font-medium">
              <span>{countFiles(displayTree)} files</span>
              <span>{selectedFiles.length} selected</span>
            </div>
          </div>
        </aside >

        {/* Main Workspace */}
        < main className="flex-1 flex flex-col min-w-0 bg-background" >
          <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm">
            <div className="flex-1 max-w-xl relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-lg outline-none transition-all placeholder:text-muted-foreground/70"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowHistory(true)}
                title="Clipboard History"
              >
                <History size={20} />
              </button>
              <button
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleToggleTheme}
                title="Toggle Theme"
              >
                {config?.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="h-6 w-px bg-border mx-2" />
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={copyToClipboard}
                disabled={!previewContent}
              >
                <Copy size={18} />
                <span>Copy</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/10">
              <div className="flex p-1 bg-secondary/50 rounded-lg">
                <button
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'preview'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  onClick={() => setActiveTab('preview')}
                >
                  <FileText size={14} className="inline mr-2" /> Preview
                </button>
                <button
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'analysis'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  onClick={() => setActiveTab('analysis')}
                >
                  <Code size={14} className="inline mr-2" /> Analysis
                </button>
              </div>

              {activeTab === 'preview' && (
                <div className="flex items-center gap-2">
                  <TokenCounter content={previewContent} />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'preview' ? (
                <PreviewPanel
                  content={previewContent}
                  onContentChange={setPreviewContent}
                  loading={previewLoading}
                  selectedFiles={selectedFiles}
                  format={outputFormat}
                  onFormatChange={handleFormatChange}
                  readOnly={false}
                  onDetectImports={handleDetectImports}
                />
              ) : (
                <CodeAnalysisPanel
                  selectedFiles={selectedFiles}
                  selectedPath={selectedPath}
                />
              )}
            </div>
          </div>
        </main >

        {/* Modals */}
        {
          showSettings && (
            <SettingsPanel
              config={config}
              onConfigChange={saveAppConfig}
              onClose={() => setShowSettings(false)}
            />
          )
        }
        {
          showKeyboardHelp && (
            <KeyboardHelp onClose={() => setShowKeyboardHelp(false)} />
          )
        }
        {
          showHistory && (
            <ClipboardHistoryPanel onClose={() => setShowHistory(false)} />
          )
        }
        {
          showInverseSelection && (
            <InverseSelectionPanel
              onApply={handleInverseSelection}
              onClose={() => setShowInverseSelection(false)}
            />
          )
        }

        <KeyboardShortcuts
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onCopy={copyToClipboard}
          onSearch={focusSearch}
          onSettings={() => setShowSettings(true)}
          onToggleTheme={handleToggleTheme}
          onHistory={() => setShowHistory(true)}
        />

        {/* Status Toast */}
        {
          status.message && (
            <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 flex items-center gap-3 border ${status.type === 'error'
              ? 'bg-destructive text-destructive-foreground border-destructive/20'
              : 'bg-primary text-primary-foreground border-primary/20'
              }`}>
              {status.type === 'error' ? <AlertCircle size={18} /> : <Zap size={18} />}
              <span>{status.message}</span>
              <button
                onClick={() => setStatus({ type: '', message: '' })}
              >
                <X size={16} />
              </button>
            </div>
          )
        }
      </div>
    </div>
  );

  async function handleDetectImports() {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setStatus({ type: 'info', message: 'Detecting imports...' });

    try {
      let allImports = [];
      for (const file of selectedFiles) {
        try {
          const imports = await invoke("resolve_file_imports", { filePath: file });
          allImports = [...allImports, ...imports];
        } catch (err) {
          console.warn(`Failed to resolve imports for ${file}:`, err);
        }
      }

      // Filter out already selected files
      const newImports = allImports.filter(path => !selectedFiles.includes(path));

      if (newImports.length > 0) {
        const newSelection = [...selectedFiles, ...newImports];
        setSelectedFiles(newSelection);
        generatePreview(newSelection);
        setStatus({ type: 'success', message: `Added ${newImports.length} imported files` });
      } else {
        setStatus({ type: 'info', message: 'No new imports found' });
      }
    } catch (error) {
      console.error("Error detecting imports:", error);
      setStatus({ type: 'error', message: `Error: ${error}` });
    } finally {
      setLoading(false);
    }
  }

  function handleClearRecent() {
    const updatedConfig = { ...config, recent_paths: [] };
    saveAppConfig(updatedConfig);
  }

  function handleToggleTheme() {
    const newTheme = config.theme === 'dark' ? 'light' : 'dark';
    const updatedConfig = { ...config, theme: newTheme };
    saveAppConfig(updatedConfig);
  }

  function handleFormatChange(newFormat) {
    setOutputFormat(newFormat);
    generatePreview();
  }

  function focusSearch() {
    searchInputRef.current?.focus();
  }
}

export default App;
