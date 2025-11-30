import { X, Save, RotateCcw, Settings, FileCode, Database, GitBranch, MessageSquare, Hash } from "lucide-react";
import { useState } from "react";

export default function SettingsPanel({ config, onConfigChange, onClose }) {
    const [localConfig, setLocalConfig] = useState(config);

    const handleChange = (key, value) => {
        setLocalConfig({ ...localConfig, [key]: value });
    };

    const handleSave = () => {
        onConfigChange(localConfig);
        onClose();
    };

    const handleReset = () => {
        setLocalConfig({
            theme: "dark",
            recent_paths: [],
            custom_ignore_patterns: [],
            max_file_size_mb: 10,
            output_format: "markdown",
            git_only_mode: false,
            include_comments: true,
            show_token_count: true
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <Settings size={18} className="text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Settings</h2>
                    </div>
                    <button
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Output Format */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                            <FileCode size={16} className="text-muted-foreground" />
                            Default Output Format
                        </label>
                        <select
                            value={localConfig.output_format}
                            onChange={(e) => handleChange("output_format", e.target.value)}
                            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                            <option value="markdown">Markdown</option>
                            <option value="json">JSON</option>
                            <option value="xml">XML</option>
                        </select>
                    </div>

                    {/* Max File Size */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center justify-between text-foreground">
                            <span className="flex items-center gap-2">
                                <Database size={16} className="text-muted-foreground" />
                                Max File Size
                            </span>
                            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {localConfig.max_file_size_mb} MB
                            </span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={localConfig.max_file_size_mb}
                            onChange={(e) => handleChange("max_file_size_mb", parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2 bg-secondary/20 p-4 rounded-lg border border-border/50">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                                <GitBranch size={16} className="text-muted-foreground" />
                                Git Only Mode
                            </span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localConfig.git_only_mode}
                                    onChange={(e) => handleChange("git_only_mode", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </label>

                        <div className="h-px bg-border/50 my-2" />

                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                                <MessageSquare size={16} className="text-muted-foreground" />
                                Include Comments
                            </span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localConfig.include_comments}
                                    onChange={(e) => handleChange("include_comments", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </label>

                        <div className="h-px bg-border/50 my-2" />

                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                                <Hash size={16} className="text-muted-foreground" />
                                Show Token Count
                            </span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localConfig.show_token_count}
                                    onChange={(e) => handleChange("show_token_count", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </label>
                    </div>

                    {/* Custom Ignore Patterns */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Custom Ignore Patterns</label>
                        <textarea
                            value={localConfig.custom_ignore_patterns.join("\n")}
                            onChange={(e) => handleChange("custom_ignore_patterns", e.target.value.split("\n"))}
                            rows={4}
                            placeholder="*.log&#10;temp/"
                            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                        <p className="text-xs text-muted-foreground">Enter one pattern per line (e.g. *.log, temp/)</p>
                    </div>
                </div>

                <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-secondary/20">
                    <button
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={handleReset}
                    >
                        <RotateCcw size={14} /> Reset Defaults
                    </button>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors border border-border"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                            onClick={handleSave}
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
