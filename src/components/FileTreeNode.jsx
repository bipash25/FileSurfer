import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, Folder, File, FileCode, FileJson, FileText, Image, Check } from "lucide-react";

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return <FileCode size={14} className="text-yellow-500" />;
        case 'css':
        case 'scss':
            return <FileCode size={14} className="text-blue-400" />;
        case 'html':
            return <FileCode size={14} className="text-orange-500" />;
        case 'json':
            return <FileJson size={14} className="text-green-500" />;
        case 'md':
        case 'txt':
            return <FileText size={14} className="text-gray-400" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'svg':
        case 'gif':
            return <Image size={14} className="text-purple-400" />;
        default:
            return <File size={14} className="text-muted-foreground" />;
    }
}

export default function FileTreeNode({ node, selectedFiles, onToggle, depth = 0, expandedNodes = [], onToggleExpand }) {
    const checkboxRef = useRef(null);

    // Use centralized expanded state instead of local state
    const expanded = expandedNodes.includes(node.path);

    // Get all file paths under this node
    const getAllFilesRecursive = (node) => {
        let files = [];
        if (node.is_dir && node.children) {
            for (const child of node.children) {
                files = files.concat(getAllFilesRecursive(child));
            }
        } else {
            files.push(node.path);
        }
        return files;
    };

    const nodePaths = getAllFilesRecursive(node);
    const selectedCount = nodePaths.filter(path => selectedFiles.includes(path)).length;
    const isFullySelected = selectedCount === nodePaths.length && nodePaths.length > 0;
    const isPartiallySelected = selectedCount > 0 && selectedCount < nodePaths.length;

    // Update checkbox indeterminate state for folders
    useEffect(() => {
        if (checkboxRef.current && node.is_dir) {
            checkboxRef.current.indeterminate = isPartiallySelected;
        }
    }, [isPartiallySelected, node.is_dir]);

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onToggle(node);
    };

    const handleExpand = (e) => {
        e.stopPropagation();
        if (node.is_dir && node.children && onToggleExpand) {
            onToggleExpand(node.path);
        }
    };

    return (
        <div className="flex flex-col">
            <div
                className={`
                    group flex items-center gap-1.5 py-1 pr-2 cursor-pointer transition-colors border-l-2
                    ${isFullySelected
                        ? 'bg-primary/10 border-primary'
                        : isPartiallySelected
                            ? 'bg-secondary/30 border-secondary'
                            : 'hover:bg-secondary/50 border-transparent'
                    }
                `}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleExpand}
            >
                {node.is_dir ? (
                    <button
                        className={`p-0.5 rounded-sm hover:bg-secondary text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
                        onClick={handleExpand}
                    >
                        <ChevronRight size={12} />
                    </button>
                ) : (
                    <span className="w-4" />
                )}

                <div
                    className="relative flex items-center justify-center w-4 h-4 mr-1 cursor-pointer"
                    onClick={handleCheckboxChange}
                >
                    <input
                        ref={checkboxRef}
                        type="checkbox"
                        className={`
                            appearance-none w-3.5 h-3.5 rounded border transition-all cursor-pointer
                            ${isFullySelected || isPartiallySelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/40 bg-transparent group-hover:border-primary/50'
                            }
                        `}
                        checked={isFullySelected}
                        onChange={handleCheckboxChange}
                    />
                    {isFullySelected && (
                        <Check size={10} className="absolute text-primary-foreground pointer-events-none" strokeWidth={3} />
                    )}
                    {isPartiallySelected && (
                        <div className="absolute w-2 h-0.5 bg-primary-foreground pointer-events-none rounded-full" />
                    )}
                </div>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {node.is_dir ? (
                        <Folder size={14} className={`shrink-0 ${isFullySelected || isPartiallySelected ? 'text-primary' : 'text-blue-400/80'}`} />
                    ) : (
                        getFileIcon(node.name)
                    )}

                    <span className={`truncate text-sm ${isFullySelected ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {node.name}
                    </span>
                </div>

                {!node.is_dir && (
                    <span className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">
                        {formatBytes(node.size)}
                    </span>
                )}
            </div>

            {node.is_dir && expanded && node.children && node.children.length > 0 && (
                <div className="flex flex-col border-l border-border/30 ml-[calc(1rem+3px)]">
                    {node.children.map((child, idx) => (
                        <FileTreeNode
                            key={child.path + idx}
                            node={child}
                            selectedFiles={selectedFiles}
                            onToggle={onToggle}
                            expandedNodes={expandedNodes}
                            onToggleExpand={onToggleExpand}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
