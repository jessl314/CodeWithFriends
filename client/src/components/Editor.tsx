/*Code Editor component -> using Monaco to allow html, css, and javascript coding*/
import { useState } from 'react';
import Editor from '@monaco-editor/react';

// tab types for ts
type Tab = "html" | "css" | "javascript"

export default function Editor() {
    const [activeTab, setActiveTab] = useState<Tab>("html");
    const [htmlCode, setHTMLCode] = useState("\n<h1>Hello World!</h1>");
    const [cssCode, setCSSCode] = useState("{\n color: royalBlue;\n");
    const [jsCode, setJSCode] = useState("console.log('Hello Friend!')");

    const getCurrentCodeVal = () =>{
        if (activeTab == "html") return htmlCode;
        else if (activeTab == "css") return cssCode;
        else return jsCode;
    }

    const handleEditorChange = (newVal: string | undefined) => {
        if (activeTab == "html") setHTMLCode;
        else if (activeTab == "css") setCSSCode;
        else if (activeTab == "javascript") setJSCode;
    };

    return (
        <div className="flex flex-col h-[75vh] w-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-neutral-800">
            
        </div>

    );
}
