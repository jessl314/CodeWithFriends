/*Code Editor component -> using Monaco to allow html, css, and javascript coding*/
import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useDebounce } from "../hooks/useDebounce";
import { compilerTemplate } from "../utils/compiler";
import EditorPane, {
    type MonacoLanguage,
    type WorkspaceFile,
} from "./EditorPane";
import { applyOp, type TextOp } from "../types/ops";

const INITIAL_FILES: WorkspaceFile[] = [
    {
        id: "html",
        fileName: "index.html",
        language: "html",
        content: "\n<h1>Hello World!</h1>",
    },
    {
        id: "css",
        fileName: "styles.css",
        language: "css",
        content: "h1 {\n color: royalBlue;\n}",
    },
    {
        id: "javascript",
        fileName: "script.js",
        language: "javascript",
        content: "console.log('Hello Friend!')",
    },
];

function joinByLanguage(files: WorkspaceFile[], language: MonacoLanguage) {
    return files
        .filter((file) => file.language === language)
        .map((file) => file.content)
        .join("\n");
}

export default function CodeEditor() {
    const [files, setFiles] = useState<WorkspaceFile[]>(INITIAL_FILES);
    const [activeFileId, setActiveFileId] = useState(INITIAL_FILES[0].id);

    const stompClientRef = useRef<Client | null>(null);
    const clientIdRef = useRef(crypto.randomUUID());
    const isIncomingUpdateRef = useRef(false);
    const filesRef = useRef(files);
    filesRef.current = files;

    const editorRefs = useRef<Record<string, any>>({});
    const monacoRef = useRef<any>(null);

    const updateFileContent = (fileId: string, content: string) => {
        setFiles((prev) => {
            const current = prev.find((file) => file.id === fileId);
            if (current?.content === content) return prev;
            return prev.map((file) => (file.id === fileId ? { ...file, content } : file));
        });
    };

    const publishOp = (op: TextOp) => {
        if (isIncomingUpdateRef.current) return;
        if (!stompClientRef.current?.connected) return;
        stompClientRef.current.publish({
            destination: "/app/update-code",
            body: JSON.stringify(op),
        });
    };

    const handleEditorMount = (fileId: string) => (editor: any, monaco: any) => {
        editorRefs.current[fileId] = editor;
        monacoRef.current = monaco;

        editor.onDidChangeModelContent((event: any) => {
            if (isIncomingUpdateRef.current) return;
            // React `value` updates call setValue, which is a flush — not a keystroke
            if (event.isFlush) return;

            for (const change of event.changes) {
                const index: number = change.rangeOffset;
                const insertedText: string = change.text;
                const deletedLength: number = change.rangeLength;

                if (deletedLength > 0) {
                    publishOp({
                        kind: "delete",
                        type: fileId,
                        index,
                        length: deletedLength,
                        senderId: clientIdRef.current,
                    });
                }
                if (insertedText) {
                    publishOp({
                        kind: "insert",
                        type: fileId,
                        index,
                        text: insertedText,
                        senderId: clientIdRef.current,
                    });
                }
            }
        });
    };

    const applyRemoteOp = (op: TextOp) => {
        if (op.kind !== "insert" && op.kind !== "delete") return;

        isIncomingUpdateRef.current = true;
        const current =
            filesRef.current.find((file) => file.id === op.type)?.content ?? "";
        updateFileContent(op.type, applyOp(current, op));
        setTimeout(() => {
            isIncomingUpdateRef.current = false;
        }, 50);
    };

    useEffect(() => {
        const socket = new SockJS("http://localhost:8080/cwf-edit");

        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log("[STOMP Debug]:", str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        const hydrateFromSnapshot = ( snapshot : {
            html: string;
            css: string;
            javascript: string;
        }) => {
            isIncomingUpdateRef.current = true;
            setFiles((prev) => 
                prev.map((file) => ({
                ...file,
                content: snapshot[file.id as "html" | "css" | "javascript"]

                }))
            );
            setTimeout(() => {
                isIncomingUpdateRef.current = false;
            }, 50);
        };

        client.onConnect = () => {
            console.log("Connected to Spring Boot WebSockets!");
            client.subscribe("/topic/workspace", (message) => {
                if (!message.body) return;
                const op: TextOp = JSON.parse(message.body);
                if (op.senderId === clientIdRef.current) return;
                applyRemoteOp(op);
            });
        };

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("http://localhost:8080/api/workspace");
                if (res.ok && !cancelled) {
                    hydrateFromSnapshot(await res.json());
                }
            } catch {
                // keep INITIAL_FILES
            }
            if (!cancelled) {
                client.activate();
                stompClientRef.current = client;
            }
        })();


        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
            cancelled = true;
            client.deactivate();
        };
    }, []);

    const htmlCode = joinByLanguage(files, "html");
    const cssCode = joinByLanguage(files, "css");
    const jsCode = joinByLanguage(files, "javascript");
    const debouncedHtml = useDebounce(htmlCode, 300);
    const debouncedCss = useDebounce(cssCode, 300);
    const debouncedJs = useDebounce(jsCode, 300);
    const [compiledSrcDoc, setCompiledSrcDoc] = useState(() =>
        compilerTemplate(htmlCode, cssCode, jsCode)
    );

    useEffect(() => {
        setCompiledSrcDoc(compilerTemplate(debouncedHtml, debouncedCss, debouncedJs));
    }, [debouncedHtml, debouncedCss, debouncedJs]);

    return (
        <div className="flex flex-row gap-4 h-[75vh] w-full min-h-0 bg-[#141414] p-4 rounded-xl">
            <div className="flex flex-col h-full w-1/2 min-h-0 bg-[#1e1e1e] rounded-lg overflow-hidden border border-neutral-800">
                <div className="flex shrink-0 overflow-x-auto bg-[#181818] border-b border-neutral-800 p-2 gap-1">
                    {files.map((file) => {
                        const isActive = activeFileId === file.id;
                        return (
                            <button
                                key={file.id}
                                type="button"
                                onClick={() => setActiveFileId(file.id)}
                                className={`px-4 py-1.5 text-xs font-mono rounded-t transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-blue-500 font-semibold"
                                        : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                                }`}
                            >
                                {file.fileName}
                            </button>
                        );
                    })}
                </div>
                <div className="relative flex-1 min-h-0">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className={`absolute inset-0 ${
                                file.id === activeFileId ? "z-10" : "invisible z-0"
                            }`}
                        >
                            <EditorPane
                                language={file.language}
                                value={file.content}
                                onChange={(value) => {
                                    if (value === undefined) return;
                                    updateFileContent(file.id, value);
                                }}
                                onMount={handleEditorMount(file.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="relative w-1/2 h-full min-h-0 bg-white rounded-lg overflow-hidden border border-neutral-800 shadow-2xl">
                <iframe
                    title="Live Preview"
                    srcDoc={compiledSrcDoc}
                    sandbox="allow-scripts"
                    className="absolute inset-0 h-full w-full border-0 bg-white"
                />
            </div>
        </div>
    );
}
