import { useEffect, useState } from "react";
import SyntaxHighlighter from "./SyntaxHighlighter";
import { Copy, Download, FileJson, FileCode, FileText, Edit2, Check, Loader2, Code, FileType } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export default function PreviewPanel({
    content,
    onContentChange,
    loading,
    selectedFiles,
    format,
    onFormatChange,
    readOnly = false,
    onDetectImports
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");

    useEffect(() => {
        setEditedContent(content);
        setIsEditing(false);
    }, [content]);

    const handleSave = () => {
        onContentChange(editedContent);
        setIsEditing(false);
    };

    const handleExport = async () => {
        try {
            await invoke("export_file", {
                request: {
                    files: selectedFiles,
                    base_path: "", // Context handled in backend or App.jsx
                    format: format,
                    max_file_size_mb: 10
                }
            });
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in fade-in duration-300">
                <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                <span className="text-sm font-medium">Generating preview...</span>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} className="opacity-50" />
                </div>
                <p className="text-sm font-medium">Select files to view content</p>
                <p className="text-xs mt-1 opacity-70">Choose files from the sidebar to generate a preview</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card/30 rounded-lg overflow-hidden border border-border/50 shadow-sm">
            <div className="flex justify-between items-center p-3 border-b border-border/50 bg-secondary/20">
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/50">
                    <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${format === 'markdown'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                        onClick={() => onFormatChange('markdown')}
                    >
                        <FileText size={12} /> Markdown
                    </button>
                    <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${format === 'json'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                        onClick={() => onFormatChange('json')}
                    >
                        <FileCode size={12} /> JSON
                    </button>
                    <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${format === 'xml'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                        onClick={() => onFormatChange('xml')}
                    >
                        <Code size={12} /> XML
                    </button>
                </div>

                <div className="flex gap-2">
                    {!readOnly && (
                        <button
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border
                                ${isEditing
                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                    : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                                }
                            `}
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                        >
                            {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                            {isEditing ? "Done" : "Edit"}
                        </button>
                    )}
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
                        onClick={handleExport}
                    >
                        <Download size={12} /> Export
                    </button>
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
                        onClick={() => onDetectImports && onDetectImports()}
                        title="Detect and select imported files"
                    >
                        <FileType size={12} /> Detect Imports
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-background">
                {isEditing ? (
                    <textarea
                        className="w-full h-full p-4 font-mono text-sm bg-transparent border-none resize-none focus:ring-0 outline-none text-foreground leading-relaxed"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        spellCheck={false}
                    />
                ) : (
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <SyntaxHighlighter
                            code={content}
                            language={format === 'markdown' ? 'markdown' : format === 'json' ? 'json' : 'xml'}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
