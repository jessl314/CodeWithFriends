import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";

export type MonacoLanguage = "html" | "css" | "javascript";

export interface WorkspaceFile {
    id: string;
    fileName: string;
    language: MonacoLanguage;
    content: string;
}

interface EditorPaneProps {
    language: MonacoLanguage;
    value: string;
    onChange: OnChange;
    onMount: OnMount;
}

export default function EditorPane({
    language,
    value,
    onChange,
    onMount,
}: EditorPaneProps) {
    return (
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
    );
}
