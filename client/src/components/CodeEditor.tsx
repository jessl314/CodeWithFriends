/*Code Editor component -> using Monaco to allow html, css, and javascript coding*/
import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useDebounce } from "../hooks/useDebounce";
import { compilerTemplate } from "../utils/compiler";
import EditorPane, { type MonacoLanguage } from "./EditorPane";

export default function CodeEditor() {
    const [htmlCode, setHTMLCode] = useState("\n<h1>Hello World!</h1>");
    const [cssCode, setCSSCode] = useState("h1 {\n color: royalBlue;\n}");
    const [jsCode, setJSCode] = useState("console.log('Hello Friend!')");

    // reference to keep track of STOMP client across renders
    const stompClientRef = useRef<Client | null>(null);
    // reference to prevent local echo loopback crashes
    const isIncomingUpdateRef = useRef<boolean>(false);
    // one Monaco instance per language so remote ops target the matching editor
    const editorRefs = useRef<Partial<Record<MonacoLanguage, any>>>({});
    const monacoRef = useRef<any>(null);

    const handleEditorMount = (language: MonacoLanguage) => (editor: any, monaco: any) => {
        editorRefs.current[language] = editor;
        monacoRef.current = monaco;

        editor.onDidChangeModelContent((event: any) => {
            if (isIncomingUpdateRef.current) return;
            for (const change of event.changes) {
                const flatIndex: number = change.rangeOffset;
                const insertedText: string = change.text;
                const deletedLength: number = change.rangeLength;

                const operationPayload = {
                    type: language,
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
                    const language = payload.type as MonacoLanguage;
                    const editor = editorRefs.current[language];

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
    const combinedCode = { htmlCode, cssCode, jsCode };
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
            {/* LEFT: three stacked Monaco instances */}
            <div className="flex flex-col h-full w-1/2 min-h-0 gap-2">
                <EditorPane
                    language="html"
                    fileName="index.html"
                    value={htmlCode}
                    onChange={(value) => setHTMLCode(value ?? "")}
                    onMount={handleEditorMount("html")}
                />
                <EditorPane
                    language="css"
                    fileName="styles.css"
                    value={cssCode}
                    onChange={(value) => setCSSCode(value ?? "")}
                    onMount={handleEditorMount("css")}
                />
                <EditorPane
                    language="javascript"
                    fileName="script.js"
                    value={jsCode}
                    onChange={(value) => setJSCode(value ?? "")}
                    onMount={handleEditorMount("javascript")}
                />
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
