/*Code Editor component -> using Monaco to allow html, css, and javascript coding*/
import { useState, useEffect, useRef} from 'react';
import Editor from '@monaco-editor/react';
import { Client } from "@stomp/stompjs";
import SockJS from 'sockjs-client';
import { useDebounce } from "../hooks/useDebounce";
import { compilerTemplate } from "../utils/compiler";

// language options
type MonacoLanguage = "html" | "css" | "javascript"

// tab model for UI
interface TabConfig {
    id: MonacoLanguage,
    fileName: string
}

const TABS: TabConfig[] = [
    {id: "html", fileName: "index.html"},
    {id: "css", fileName: "styles.css"},
    {id: "javascript", fileName: "script.js"}
]


export default function CodeEditor() {
    const [activeTab, setActiveTab] = useState<MonacoLanguage>("html");
    const [htmlCode, setHTMLCode] = useState("\n<h1>Hello World!</h1>");
    const [cssCode, setCSSCode] = useState("h1 {\n color: royalBlue;\n}");
    const [jsCode, setJSCode] = useState("console.log('Hello Friend!')");
  
    const getCurrentCodeVal = () =>{
        if (activeTab == "html") return htmlCode;
        else if (activeTab == "css") return cssCode;
        else return jsCode;
    }

    // reference to keep track of STOMP client across renders
    const stompClientRef = useRef<Client | null>(null);
    // reference to prevent local echo loopback crashes
    const isIncomingUpdateRef = useRef<boolean>(false);
    // reference to track the editor and monaco instance
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const handleEditorMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        
        editor.onDidChangeModelContent((event: any) => {
            const code = editor.getValue() || "";
            if (activeTab === "html") setHTMLCode(code);
            else if (activeTab === "css") setCSSCode(code);
            else if (activeTab === "javascript") setJSCode(code);
            if (isIncomingUpdateRef.current) return;
            for (const change of event.changes) {
                const flatIndex: number = change.rangeOffset;
                const insertedText: string = change.text;
                //
                const deletedLength: number = change.rangeLength;

                const operationPayload = {
                    type: activeTab,
                    index: flatIndex,
                    actionType: deletedLength > 0 ? "delete": "insert",
                    text: deletedLength > 0 ? "": insertedText
                }

                // broadcast this code to server ONLY if
                // the change came from keyboard typing
                // using Stomp but no incoming update currently
                if (stompClientRef.current?.connected && !isIncomingUpdateRef.current) {
                    stompClientRef.current.publish({
                        destination: '/app/update-code',
                        body: JSON.stringify(operationPayload)
                    });
                }
            };
        }) 
    }

    // --- WebSocket Plumbing ---------------
    /* sending a request to change from HTTP to STOMP protocol when the app loads up*/

    useEffect(() => {
        /* Initialize SockJS handshake link which
         points to Spring Boot port */
        const socket = new SockJS('http://localhost:8080/cwf-edit');

        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log('[STOMP Debug]:', str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('Connected to Spring Boot WebSockets!')
            client.subscribe('/topic/workspace', (message) => {
                if (message.body) {
                    const payload = JSON.parse(message.body);

                // activeTab does not match file type of operation, update the operation file's string storage
                if (payload.type !== activeTab) {
                    if (payload.type === 'html') setHTMLCode((prev) => applySimplePayloadToString(prev, payload));
                    else if (payload.type === 'css') setCSSCode((prev) => applySimplePayloadToString(prev, payload));
                    else if (payload.type === 'javascript') setJSCode((prev) => applySimplePayloadToString(prev, payload));
                    return;
                }
                
                if (editorRef.current) {
                    const model = editorRef.current.getModel();

                    // flagging the update as coming from the server to prevent sending it back
                    isIncomingUpdateRef.current = true;

                    // specify where the edit should occur with Monaco range
                    const startPosition = model.getPositionAt(payload.index)

                    const endPosition = payload.actionType === "delete" ? model.getPositionAt(payload.index + 1) : startPosition;
                    // assume single character deletions for now

                    const range = new monacoRef.current.Range(
                        startPosition.lineNumber,
                        startPosition.column,
                        endPosition.lineNumber,
                        endPosition.column
                    );

                    // execute the edit on UI
                    editorRef.current.executeEdits("remote-sync", [{
                        range: range,
                        text: payload.actionType === "insert" ? payload.text : "",
                        forceMoveMarkers: true 
                    }]);
                    
                    // synchronize React code state with Monaco edited string
                    if (payload.type === 'html') setHTMLCode(payload.content);
                    else if (payload.type === 'css') setCSSCode(payload.content);
                    else if (payload.type === "javascript")
                    setJSCode(payload.content);
                    // wait 50 ms after user update to flip the update reference back to false
                    // prevents echoes/triggering onchange unnessarily 
                    setTimeout(() => {isIncomingUpdateRef.current = false; }, 50);

                }
                    
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

    function applySimplePayloadToString(currentText: string, payload: any): string {
        if (payload.actionType === "insert") {
        return currentText.slice(0, payload.index) + payload.text + currentText.slice(payload.index);
        } else {
            return currentText.slice(0, payload.index) + currentText.slice(payload.index + 1);
        }
    }

    
    
    // --- Local Code Compiling/Debugging ---
    const combinedCode = { htmlCode, cssCode, jsCode};
    const debouncedCode = useDebounce(combinedCode, 300);
    const [compiledSrcDoc, setCompiledSrcDoc] = useState('');

    useEffect(() => {
        const compiled = compilerTemplate(debouncedCode.htmlCode, debouncedCode.cssCode, debouncedCode.jsCode);
        setCompiledSrcDoc(compiled);
    }, [debouncedCode]);


    return (
        <div className="flex flex-row gap-4 h-[75vh] w-full bg-[#141414] p-4 rounded-xl">
            {/* LEFT: Code Editor Container */}
            <div className="flex flex-col h-[75vh] w-1/2 bg-[#1e1e1e] rounded-lg overflow-hidden border border-neutral-800">
                {/*file tab bar */}
                <div className="flex bg-[#181818] border-b border-neutral-800 p-2 gap-1">
                    {TABS.map((tab) => {
                        // flagging if the tab with the specified id is active
                        // = is assignment, === is equality
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-1.5 text-xs font-mono rounded-t transition-colors duration-150 cursor-pointer ${isActive ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-blue-500 font-semibold" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"}`}>
                                {tab.fileName}
                            </button>
                        );
                    })}
                </div>
                {/*Monaco Instance for files */}
                <div className="flex-1 w-full">
                    <Editor height="100%" theme="vs-dark" language={activeTab} value = {getCurrentCodeVal()} onMount={handleEditorMount} options={{minimap: {enabled: false}, fontSize: 14, automaticLayout: true}}/>
                </div>
            </div>
            {/*RIGHT: Live iframe Preview */}
            <div className="w-1/2 h-full bg-white rounded-lg overflow-hidden border border-neutral-800 shadow-2xl">
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
