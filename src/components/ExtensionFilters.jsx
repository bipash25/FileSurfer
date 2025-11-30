import { useState } from "react";
import { Filter, X, Check } from "lucide-react";

export default function ExtensionFilters({ selectedExtensions, onFilterChange }) {
    const [showModal, setShowModal] = useState(false);

    const commonExtensions = [
        ".js", ".jsx", ".ts", ".tsx", ".css", ".html",
        ".json", ".md", ".py", ".rs", ".go", ".java", ".c",
        ".cpp", ".h", ".hpp", ".sql", ".xml", ".yaml", ".yml",
        ".sh", ".bat", ".ps1", ".php", ".rb", ".lua"
    ];

    const toggleExtension = (ext) => {
        if (selectedExtensions.includes(ext)) {
            onFilterChange(selectedExtensions.filter(e => e !== ext));
        } else {
            onFilterChange([...selectedExtensions, ext]);
        }
    };

    return (
        <>
            <button
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors border ${selectedExtensions.length > 0
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
                    }`}
                onClick={() => setShowModal(true)}
            >
                <div className="flex items-center gap-2">
                    <Filter size={14} />
                    <span>Filter by Type</span>
                </div>
                {selectedExtensions.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                        {selectedExtensions.length}
                    </span>
                )}
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                    <div
                        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-secondary/20">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-md">
                                    <Filter size={18} className="text-primary" />
                                </div>
                                <h2 className="text-lg font-semibold">Filter by Extension</h2>
                            </div>
                            <button
                                className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                onClick={() => setShowModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-muted-foreground">Select extensions to include:</span>
                                {selectedExtensions.length > 0 && (
                                    <button
                                        className="text-xs text-destructive hover:underline"
                                        onClick={() => onFilterChange([])}
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {commonExtensions.map(ext => {
                                    const isSelected = selectedExtensions.includes(ext);
                                    return (
                                        <button
                                            key={ext}
                                            className={`
                                                px-2 py-1.5 rounded-md text-xs font-mono transition-all border
                                                ${isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                                                }
                                            `}
                                            onClick={() => toggleExtension(ext)}
                                        >
                                            {ext}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/20">
                            <button
                                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                                onClick={() => setShowModal(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
