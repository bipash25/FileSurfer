import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function ProjectTypeDetector({ currentPath }) {
    const [projectType, setProjectType] = useState(null);

    useEffect(() => {
        if (currentPath) {
            detectType();
        }
    }, [currentPath]);

    async function detectType() {
        try {
            const detected = await invoke("get_project_type", { dirPath: currentPath });
            setProjectType(detected);
        } catch (error) {
            console.error("Project type detection failed:", error);
        }
    }

    if (!projectType || projectType.detected_type === "Unknown") {
        return null;
    }

    const getProjectIcon = (type) => {
        const icons = {
            "Node.js": "📦",
            "Next.js": "▲",
            "Rust": "🦀",
            "Python": "🐍",
            "Go": "🔵",
            "Java/Maven": "☕",
            "Java/Gradle": "☕",
            "Ruby": "💎",
            "PHP": "🐘",
            "C#/.NET": "#️⃣"
        };
        return icons[type] || "📁";
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-secondary/20 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
                <span className="text-lg">{getProjectIcon(projectType.detected_type)}</span>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">{projectType.detected_type}</span>
                    <span className="text-[10px] text-muted-foreground">
                        {Math.round(projectType.confidence * 100)}% confidence
                    </span>
                </div>
            </div>
            {projectType.indicators.length > 0 && (
                <div className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded truncate" title={projectType.indicators.join(", ")}>
                    Detected: {projectType.indicators.join(", ")}
                </div>
            )}
        </div>
    );
}
