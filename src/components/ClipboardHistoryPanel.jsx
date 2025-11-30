import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Clipboard, X, Trash2, Copy, Clock, FileText } from "lucide-react";

export default function ClipboardHistoryPanel({ onClose }) {
    const [history, setHistory] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    async function loadHistory() {
        try {
            const hist = await invoke("get_clipboard_history");
            setHistory(hist);
        } catch (error) {
            console.error("Failed to load clipboard history:", error);
        }
    }

    async function reCopy(item) {
        try {
            await invoke("copy_clipboard", { content: item.content });
            console.log("Re-copied from history!");
            onClose();
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    }

    async function clearHistory() {
        try {
            await invoke("clear_clipboard");
            setHistory({ items: [], max_items: 10 });
        } catch (error) {
            console.error("Failed to clear history:", error);
        }
    }

    if (!history) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <Clipboard size={18} className="text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Clipboard History</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {history.items.length > 0 && (
                            <button
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                onClick={clearHistory}
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                        )}
                        <button
                            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                            onClick={onClose}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {history.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                            <Clipboard size={48} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">No clipboard history yet</p>
                        </div>
                    ) : (
                        history.items.map((item, idx) => (
                            <div key={idx} className="group bg-secondary/10 hover:bg-secondary/30 border border-border/50 rounded-lg p-3 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                                            {item.format}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <FileText size={12} /> {item.file_count} files
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock size={10} />
                                        {new Date(item.timestamp * 1000).toLocaleString()}
                                    </span>
                                </div>

                                <div className="bg-background border border-border/50 rounded p-2 mb-3 text-xs font-mono text-muted-foreground line-clamp-3 break-all">
                                    {item.content.substring(0, 300)}
                                    {item.content.length > 300 && "..."}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                                        onClick={() => reCopy(item)}
                                    >
                                        <Copy size={12} /> Re-Copy
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
