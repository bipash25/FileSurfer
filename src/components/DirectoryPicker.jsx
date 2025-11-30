import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, ChevronDown, Clock, X, Folder } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function DirectoryPicker({ selectedPath, onPathSelect, recentPaths, onClearRecent }) {
    const [showRecent, setShowRecent] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowRecent(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleSelectDirectory() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Project Directory"
            });

            if (selected) {
                onPathSelect(selected);
                setShowRecent(false);
            }
        } catch (error) {
            console.error("Failed to open directory picker:", error);
        }
    }

    const currentFolderName = selectedPath ? selectedPath.split(/[\\/]/).pop() : null;

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                    <button
                        className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center justify-center text-sm font-medium shadow-sm hover:shadow-md transition-all"
                        onClick={handleSelectDirectory}
                    >
                        <FolderOpen size={18} className="mr-2" />
                        {selectedPath ? "Change Project" : "Open Project"}
                    </button>

                    {recentPaths.length > 0 && (
                        <button
                            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${showRecent
                                ? 'bg-secondary text-foreground border-border'
                                : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                                }`}
                            onClick={() => setShowRecent(!showRecent)}
                            title="Recent Projects"
                        >
                            <Clock size={18} />
                        </button>
                    )}
                </div>

                {selectedPath && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 text-sm text-muted-foreground" title={selectedPath}>
                        <Folder size={14} className="shrink-0 text-primary/70" />
                        <span className="truncate font-medium text-foreground/80">{currentFolderName}</span>
                    </div>
                )}
            </div>

            {showRecent && recentPaths.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-secondary/30">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Projects</span>
                        <button
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearRecent();
                                setShowRecent(false);
                            }}
                        >
                            Clear History
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {recentPaths.map((path, idx) => (
                            <button
                                key={idx}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors group"
                                onClick={() => {
                                    onPathSelect(path);
                                    setShowRecent(false);
                                }}
                                title={path}
                            >
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Folder size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    {path.split(/[\\/]/).pop()}
                                </div>
                                <div className="text-xs text-muted-foreground truncate pl-5.5 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                    {path}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
