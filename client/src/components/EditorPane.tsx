import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";

export type MonacoLanguage = "html" | "css" | "javascript";

interface EditorPaneProps {
    language: MonacoLanguage;
    fileName: string;
    value: string;
    onChange: OnChange;
    onMount: OnMount;
}

export default function EditorPane({
    language,
    fileName,
    value,
    onChange,
    onMount,
}: EditorPaneProps) {
    return (
        <div className="flex flex-col flex-1 min-h-0 bg-[#1e1e1e] rounded-lg overflow-hidden border border-neutral-800">
            <div className="shrink-0 bg-[#181818] border-b border-neutral-800 px-3 py-1.5 text-left">
                <span className="text-xs font-mono text-blue-400">{fileName}</span>
            </div>
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language}
                    value={value}
                    onChange={onChange}
                    onMount={onMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
}
