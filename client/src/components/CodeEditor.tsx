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

    // reference to keep track of STOMP client across renders
    const stompClientRef = useRef<Client | null>(null);
    // reference to prevent local echo loopback crashes
    const isIncomingUpdateRef = useRef<boolean>(false);
    // one Monaco instance per file so remote ops can target background tabs
    const editorRefs = useRef<Record<string, any>>({});
    const monacoRef = useRef<any>(null);

    const handleEditorMount = (fileId: string) => (editor: any, monaco: any) => {
        editorRefs.current[fileId] = editor;
        monacoRef.current = monaco;

        editor.onDidChangeModelContent((event: any) => {
            if (isIncomingUpdateRef.current) return;
            for (const change of event.changes) {
                const flatIndex: number = change.rangeOffset;
                const insertedText: string = change.text;
                const deletedLength: number = change.rangeLength;

                const operationPayload = {
                    type: fileId,
                    index: flatIndex,
                    actionType: deletedLength > 0 ? "delete" : "insert",
                    text: deletedLength > 0 ? "" : insertedText,
                };

                // broadcast this code to server ONLY if
                // the change came from keyboard typing
                if (stompClientRef.current?.connected && !isIncomingUpdateRef.current) {
                    stompClientRef.current.publish({
                        destination: "/app/update-code",
                        body: JSON.stringify(operationPayload),
                    });
                }
            }
        });
    };

    const updateFileContent = (fileId: string, content: string) => {
        setFiles((prev) =>
            prev.map((file) => (file.id === fileId ? { ...file, content } : file))
        );
    };

    // --- WebSocket Plumbing ---------------
    /* sending a request to change from HTTP to STOMP protocol when the app loads up*/

    useEffect(() => {
        /* Initialize SockJS handshake link which
         points to Spring Boot port */
        const socket = new SockJS("http://localhost:8080/cwf-edit");

        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log("[STOMP Debug]:", str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log("Connected to Spring Boot WebSockets!");
            client.subscribe("/topic/workspace", (message) => {
                if (message.body) {
                    const payload = JSON.parse(message.body);
                    const editor = editorRefs.current[payload.type];

                    if (!editor || !monacoRef.current) return;

                    const model = editor.getModel();

                    // flagging the update as coming from the server to prevent sending it back
                    isIncomingUpdateRef.current = true;

                    // specify where the edit should occur with Monaco range
                    const startPosition = model.getPositionAt(payload.index);

                    const endPosition =
                        payload.actionType === "delete"
                            ? model.getPositionAt(payload.index + 1)
                            : startPosition;
                    // assume single character deletions for now

                    const range = new monacoRef.current.Range(
                        startPosition.lineNumber,
                        startPosition.column,
                        endPosition.lineNumber,
                        endPosition.column
                    );

                    // execute the edit on UI
                    editor.executeEdits("remote-sync", [
                        {
                            range: range,
                            text: payload.actionType === "insert" ? payload.text : "",
                            forceMoveMarkers: true,
                        },
                    ]);

                    setTimeout(() => {
                        isIncomingUpdateRef.current = false;
                    }, 50);
                }
            });
        };
        // fires off network request and initiate HTTP handshake to endpoint
        // upgrade to live TCP WebSocket connection
        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, []);

    // --- Local Code Compiling/Debugging ---
    const combinedCode = {
        htmlCode: joinByLanguage(files, "html"),
        cssCode: joinByLanguage(files, "css"),
        jsCode: joinByLanguage(files, "javascript"),
    };
    const debouncedCode = useDebounce(combinedCode, 300);
    const [compiledSrcDoc, setCompiledSrcDoc] = useState("");

    useEffect(() => {
        const compiled = compilerTemplate(
            debouncedCode.htmlCode,
            debouncedCode.cssCode,
            debouncedCode.jsCode
        );
        setCompiledSrcDoc(compiled);
    }, [debouncedCode]);

    return (
        <div className="flex flex-row gap-4 h-[75vh] w-full min-h-0 bg-[#141414] p-4 rounded-xl">
            {/* LEFT: tabbed code editor */}
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
                                onChange={(value) =>
                                    updateFileContent(file.id, value ?? "")
                                }
                                onMount={handleEditorMount(file.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {/* RIGHT: Live iframe Preview */}
            <div className="w-1/2 h-full min-h-0 bg-white rounded-lg overflow-hidden border border-neutral-800 shadow-2xl">
                <iframe
                    title="Live Preview"
                    srcDoc={compiledSrcDoc}
                    sandbox="allow-scripts"
                    className="w-full h-full bg-white"
                />
            </div>
        </div>
    );
}
