import { useState } from "react";
import { X, Check, Filter, Info } from "lucide-react";

export default function InverseSelectionPanel({ onApply, onClose }) {
    const [excludePatterns, setExcludePatterns] = useState("*test*\n*spec*\n*.test.js\n*.spec.js");
    const [presets, setPresets] = useState([
        { name: "Tests", patterns: "*test*\n*spec*\n*.test.*\n*.spec.*\n__tests__/" },
        { name: "Documentation", patterns: "*.md\n*.txt\nDOCS/\ndocs/" },
        { name: "Config Files", patterns: "*.config.*\n*.json\n*.yaml\n*.yml\n.env*" },
        { name: "Build Output", patterns: "dist/\nbuild/\nout/\n*.min.*" },
    ]);

    function applyPreset(patterns) {
        setExcludePatterns(patterns);
    }

    function handleApply() {
        const patterns = excludePatterns
            .split("\n")
            .map(p => p.trim())
            .filter(p => p.length > 0);
        onApply(patterns);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <Filter size={18} className="text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Inverse Selection</h2>
                    </div>
                    <button
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                        <Info size={18} className="text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">How it works</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter patterns to <strong>exclude</strong> from selection. Everything else will be selected.
                                Supports glob patterns like <code className="bg-secondary/50 px-1 py-0.5 rounded text-foreground">*</code>, <code className="bg-secondary/50 px-1 py-0.5 rounded text-foreground">**</code>, and <code className="bg-secondary/50 px-1 py-0.5 rounded text-foreground">?</code>.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Presets</div>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    className="px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md border border-border transition-colors"
                                    onClick={() => applyPreset(preset.patterns)}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Exclude Patterns (one per line)</label>
                        <textarea
                            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            value={excludePatterns}
                            onChange={(e) => setExcludePatterns(e.target.value)}
                            rows={8}
                            placeholder="*test*&#10;*.md&#10;dist/"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/20">
                    <button
                        className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors border border-border"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                        onClick={handleApply}
                    >
                        <Check size={16} /> Apply Inverse Selection
                    </button>
                </div>
            </div>
        </div>
    );
}
