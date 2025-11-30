import { Folder, Loader2 } from "lucide-react";
import FileTreeNode from "./FileTreeNode";

export default function FileTree({ fileTree, selectedFiles, onToggle, loading, expandedNodes = [], onToggleExpand }) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground animate-in fade-in duration-300">
                <Loader2 size={24} className="animate-spin mb-3 text-primary" />
                <span className="text-sm font-medium">Scanning files...</span>
            </div>
        );
    }

    if (!fileTree || fileTree.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 text-sm">
                <Folder size={32} className="mb-2 opacity-20" />
                <span className="font-medium">No files found</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-4 select-none">
            {fileTree.map((node) => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    selectedFiles={selectedFiles}
                    onToggle={onToggle}
                    expandedNodes={expandedNodes}
                    onToggleExpand={onToggleExpand}
                    depth={0}
                />
            ))}
        </div>
    );
}


