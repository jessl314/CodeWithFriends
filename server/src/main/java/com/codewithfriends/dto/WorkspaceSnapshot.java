package com.codewithfriends.dto;

/**
 * full code text spanning html, css, javascript
 */
public class WorkspaceSnapshot {
    private String html;
    private String css;
    private String javascript;

    public WorkspaceSnapshot() {}

    public WorkspaceSnapshot(String html, String css, String javascript) {
        this.html = html;
        this.css = css;
        this.javascript = javascript;
    }

    public String getHtml() { return html; }
    public void setHtml(String html) { this.html = html; }
    public String getCss() { return css; }
    public void setCss(String css) { this.css = css; }
    public String getJavascript() { return javascript; }
    public void setJavascript(String javascript) { this.javascript = javascript; }

}