import { useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Import common language support
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";

export default function SyntaxHighlighter({ code, language }) {
    useEffect(() => {
        Prism.highlightAll();
    }, [code, language]);

    const getLanguage = () => {
        const langMap = {
            "js": "javascript",
            "jsx": "jsx",
            "ts": "typescript",
            "tsx": "tsx",
            "py": "python",
            "rs": "rust",
            "go": "go",
            "java": "java",
            "json": "json",
            "md": "markdown",
            "css": "css",
            "sh": "bash",
            "bash": "bash"
        };
        return langMap[language] || "javascript";
    };

    return (
        <pre className="syntax-highlighted">
            <code className={`language-${getLanguage()}`}>
                {code}
            </code>
        </pre>
    );
}

export function detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || "text";
}
