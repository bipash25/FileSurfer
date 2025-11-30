import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, RefreshCw, Box, Code, CheckSquare, AlertCircle } from "lucide-react";

export default function CodeAnalysisPanel({ selectedFiles, selectedPath }) {
    const [dependencies, setDependencies] = useState([]);
    const [functions, setFunctions] = useState([]);
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("dependencies");

    useEffect(() => {
        if (selectedFiles.length > 0) {
            analyzeCode();
        } else {
            setDependencies([]);
            setFunctions([]);
            setTodos([]);
        }
    }, [selectedFiles]);

    async function analyzeCode() {
        setLoading(true);
        try {
            const depPromises = selectedFiles.map(file =>
                invoke("get_dependencies", { filePath: file }).catch(() => [])
            );
            const funcPromises = selectedFiles.map(file =>
                invoke("get_functions", { filePath: file }).catch(() => [])
            );
            const todoPromises = selectedFiles.map(file =>
                invoke("get_todos", { filePath: file }).catch(() => [])
            );

            const [allDeps, allFuncs, allTodos] = await Promise.all([
                Promise.all(depPromises),
                Promise.all(funcPromises),
                Promise.all(todoPromises)
            ]);

            setDependencies(allDeps.flat());
            setFunctions(allFuncs.flat());
            setTodos(allTodos.flat());
        } catch (error) {
            console.error("Code analysis failed:", error);
        } finally {
            setLoading(false);
        }
    }

    if (selectedFiles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground/50 border border-dashed border-border rounded-lg bg-secondary/10">
                <Search size={32} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">Select files to analyze code</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="flex justify-between items-center p-3 border-b border-border bg-secondary/20">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Code size={16} className="text-primary" />
                    Code Analysis
                </h4>
                <button
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50"
                    onClick={analyzeCode}
                    disabled={loading}
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    {loading ? "Analyzing..." : "Refresh"}
                </button>
            </div>

            <div className="flex border-b border-border bg-secondary/10">
                <button
                    className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === "dependencies" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                    onClick={() => setActiveTab("dependencies")}
                >
                    <Box size={12} /> Deps ({dependencies.length})
                </button>
                <button
                    className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === "functions" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                    onClick={() => setActiveTab("functions")}
                >
                    <Code size={12} /> Funcs ({functions.length})
                </button>
                <button
                    className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === "todos" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
                    onClick={() => setActiveTab("todos")}
                >
                    <CheckSquare size={12} /> TODOs ({todos.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background p-0">
                {activeTab === "dependencies" && (
                    <div className="divide-y divide-border/50">
                        {dependencies.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground">No dependencies found</div>
                        ) : (
                            dependencies.map((dep, idx) => (
                                <div key={idx} className="p-3 hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{dep.import_type}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                                            {getRelativePath(dep.file, selectedPath)}:{dep.line_number}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-foreground break-all">{dep.dependency}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "functions" && (
                    <div className="divide-y divide-border/50">
                        {functions.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground">No functions found</div>
                        ) : (
                            functions.map((func, idx) => (
                                <div key={idx} className="p-3 hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-foreground">{func.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {getRelativePath(func.file, selectedPath)}:{func.line_start}-{func.line_end}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground bg-secondary/30 p-1.5 rounded overflow-x-auto whitespace-nowrap custom-scrollbar">
                                        {func.signature}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "todos" && (
                    <div className="divide-y divide-border/50">
                        {todos.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground">No TODOs found</div>
                        ) : (
                            todos.map((todo, idx) => (
                                <div key={idx} className="p-3 hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`
                                            text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider
                                            ${todo.todo_type.toLowerCase().includes('fix') ? 'bg-destructive/10 text-destructive' : 'bg-blue-500/10 text-blue-500'}
                                        `}>
                                            {todo.todo_type}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                                            {getRelativePath(todo.file, selectedPath)}:{todo.line_number}
                                        </span>
                                    </div>
                                    <div className="text-sm text-foreground">{todo.message}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function getRelativePath(fullPath, basePath) {
    if (!basePath) return fullPath;
    return fullPath.replace(basePath, "").replace(/^[\\\/]/, "");
}
