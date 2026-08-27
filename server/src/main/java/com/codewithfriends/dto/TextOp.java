package com.codewithfriends.dto;

/**
 * Operational mutation on the wire.
 * kind = "insert" uses {@code text}; kind = "delete" uses {@code length}.
 */
public class TextOp {
    private String kind;
    private String type;
    private int index;
    private String text;
    private int length;
    private String senderId;

    public TextOp() {}

    public static TextOp insert(String type, int index, String text, String senderId) {
        TextOp op = new TextOp();
        op.setKind("insert");
        op.setType(type);
        op.setIndex(index);
        op.setText(text);
        op.setSenderId(senderId);
        return op;
    }

    public static TextOp delete(String type, int index, int length, String senderId) {
        TextOp op = new TextOp();
        op.setKind("delete");
        op.setType(type);
        op.setIndex(index);
        op.setLength(length);
        op.setSenderId(senderId);
        return op;
    }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public int getLength() { return length; }
    public void setLength(int length) { this.length = length; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
}
