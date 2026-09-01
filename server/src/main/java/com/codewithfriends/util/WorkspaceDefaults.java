package com.codewithfriends.util;
public final class WorkspaceDefaults {
    private WorkspaceDefaults() {}

    /**
     * default content for file type
     * @param type file type
     * @return the corresponding default file content.
     */
    public static String forType(String type) { 
        return switch (type) {
            case "html" -> "\n<h1>Hello World!</h1>";
            case "css" -> "h1 {\n color: royalBlue;\n}";
            case "javascript" -> "console.log('Hello Friend!')";
            default -> "";
        };
    };
}
