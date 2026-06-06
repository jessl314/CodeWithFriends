/*Code Editor component -> using Monaco to allow html, css, and javascript coding*/
import { useState } from 'react';
import Editor from '@monaco-editor/react';

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
    
    const handleEditorChange = (newVal: string | undefined) => {
        const code = newVal || "";
        if (activeTab === "html") setHTMLCode(code);
        else if (activeTab === "css") setCSSCode(code);
        else if (activeTab === "javascript") setJSCode(code);
    };

    return (
        <div className="flex flex-col h-[75vh] w-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-neutral-800">
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
                <Editor height="100%" theme="vs-dark" language={activeTab} value = {getCurrentCodeVal()} onChange={handleEditorChange} options={{minimap: {enabled: false}, fontSize: 14, automaticLayout: true}}/>
            </div>
        </div>
    );
}
