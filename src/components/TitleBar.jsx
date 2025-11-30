import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Copy } from "lucide-react";

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const appWindow = getCurrentWindow();

    useEffect(() => {
        const updateMaximizedState = async () => {
            setIsMaximized(await appWindow.isMaximized());
        };

        updateMaximizedState();

        const unlisten = appWindow.listen("tauri://resize", updateMaximizedState);

        return () => {
            unlisten.then(f => f());
        };
    }, []);

    const minimize = () => appWindow.minimize();
    const toggleMaximize = async () => {
        await appWindow.toggleMaximize();
        setIsMaximized(await appWindow.isMaximized());
    };
    const close = () => appWindow.close();

    return (
        <div data-tauri-drag-region className="h-8 bg-background border-b border-border flex justify-between items-center select-none fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center gap-2 px-3 pointer-events-none">
                <div className="w-4 h-4 flex items-center justify-center">
                    <img src="/filesurfer.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">FileSurfer</span>
            </div>

            <div className="flex h-full">
                <button
                    onClick={minimize}
                    className="h-full w-10 flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="h-full w-10 flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    <Square size={12} className={isMaximized ? "fill-current opacity-50" : ""} />
                </button>
                <button
                    onClick={close}
                    className="h-full w-10 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
                    title="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
