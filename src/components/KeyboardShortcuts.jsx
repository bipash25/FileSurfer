import { useHotkeys } from "react-hotkeys-hook";
import { X, Command, Keyboard } from "lucide-react";

export default function KeyboardShortcuts({
    onSelectAll,
    onDeselectAll,
    onCopy,
    onSearch,
    onSettings,
    onToggleTheme,
    onHistory
}) {
    // Select All: Ctrl+A or Cmd+A
    useHotkeys('ctrl+a, meta+a', (e) => {
        e.preventDefault();
        onSelectAll();
    }, { enableOnFormTags: false });

    // Deselect All: Ctrl+D or Cmd+D
    useHotkeys('ctrl+d, meta+d', (e) => {
        e.preventDefault();
        onDeselectAll();
    }, { enableOnFormTags: false });

    // Copy: Ctrl+Shift+C
    useHotkeys('ctrl+shift+c, meta+shift+c', (e) => {
        e.preventDefault();
        onCopy();
    });

    // Search: Ctrl+F
    useHotkeys('ctrl+f, meta+f', (e) => {
        e.preventDefault();
        onSearch();
    });

    // Settings: Ctrl+,
    useHotkeys('ctrl+,', (e) => {
        e.preventDefault();
        onSettings();
    });

    // Theme: Ctrl+Shift+T
    useHotkeys('ctrl+shift+t', (e) => {
        e.preventDefault();
        onToggleTheme();
    });

    // History: Ctrl+H
    useHotkeys('ctrl+h, meta+h', (e) => {
        e.preventDefault();
        onHistory();
    });

    return null;
}

export function KeyboardHelp({ onClose }) {
    const shortcuts = [
        { keys: ["Ctrl", "A"], desc: "Select All Files" },
        { keys: ["Ctrl", "D"], desc: "Deselect All" },
        { keys: ["Ctrl", "Shift", "C"], desc: "Copy Selected Content" },
        { keys: ["Ctrl", "F"], desc: "Focus Search" },
        { keys: ["Ctrl", ","], desc: "Open Settings" },
        { keys: ["Ctrl", "Shift", "T"], desc: "Toggle Theme" },
        { keys: ["Ctrl", "H"], desc: "Clipboard History" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <Keyboard size={18} className="text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-2">
                    {shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                            <span className="text-sm font-medium text-foreground">{shortcut.desc}</span>
                            <div className="flex gap-1.5">
                                {shortcut.keys.map((key, k) => (
                                    <kbd key={k} className="px-2 py-1 bg-secondary border border-border rounded-md text-xs font-mono font-semibold text-muted-foreground shadow-sm min-w-[1.5rem] text-center">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-3 bg-secondary/20 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">Press <kbd className="font-mono font-semibold">Esc</kbd> to close any modal</p>
                </div>
            </div>
        </div>
    );
}
