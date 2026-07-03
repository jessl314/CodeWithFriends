package com.codewithfriends.dto;

public class CodePayload {
    private String type; // "html", "css", "javascript"
    private int index; // flat character position
    private String actionType; // insert or delete
    private String text; // character string typed

    public CodePayload() {}

    public CodePayload(String type, String text) {
        this.type = type;
        this.text = text;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getContent() { return text; }
    public void setContent(String text) { this.text = text;}
}
