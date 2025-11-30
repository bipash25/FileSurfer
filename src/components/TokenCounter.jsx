import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Calculator, AlertTriangle, AlertCircle, X } from "lucide-react";

export default function TokenCounter({ content }) {
    const [tokenEstimate, setTokenEstimate] = useState(null);
    const [showPopover, setShowPopover] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (content) {
            estimateTokens();
        } else {
            setTokenEstimate(null);
        }
    }, [content]);

    // Close popover on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function estimateTokens() {
        try {
            const estimate = await invoke("estimate_file_tokens", { content });
            setTokenEstimate(estimate);
        } catch (error) {
            console.error("Token estimation failed:", error);
        }
    }

    if (!tokenEstimate) return null;

    const isLarge = tokenEstimate.gpt4_estimate > 100000;
    const isWarning = tokenEstimate.gpt4_estimate > 50000;

    return (
        <div className="relative" ref={popoverRef}>
            <button
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border
                    ${isLarge
                        ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                        : isWarning
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
                            : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
                    }
                `}
                onClick={() => setShowPopover(!showPopover)}
            >
                <Calculator size={14} />
                <span>{tokenEstimate.gpt4_estimate.toLocaleString()} tokens</span>
            </button>

            {showPopover && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-3 border-b border-border/50 bg-secondary/20 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Calculator size={14} className="text-primary" />
                            <h4 className="text-xs font-semibold">Token Details</h4>
                        </div>
                        <button onClick={() => setShowPopover(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">GPT-4</span>
                                <span className="text-sm font-mono font-medium">{tokenEstimate.gpt4_estimate.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Claude</span>
                                <span className="text-sm font-mono font-medium">{tokenEstimate.claude_estimate.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Gemini</span>
                                <span className="text-sm font-mono font-medium">{tokenEstimate.gemini_estimate.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Chars</span>
                                <span className="text-xs font-mono">{tokenEstimate.char_count.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Words</span>
                                <span className="text-xs font-mono">{tokenEstimate.word_count.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase">Lines</span>
                                <span className="text-xs font-mono">{tokenEstimate.line_count.toLocaleString()}</span>
                            </div>
                        </div>

                        {isLarge && (
                            <div className="flex items-start gap-2 text-[10px] text-destructive bg-destructive/10 p-2 rounded">
                                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                <span>Very large! May exceed limits</span>
                            </div>
                        )}
                        {isWarning && !isLarge && (
                            <div className="flex items-start gap-2 text-[10px] text-yellow-500 bg-yellow-500/10 p-2 rounded">
                                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                <span>Large content</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
