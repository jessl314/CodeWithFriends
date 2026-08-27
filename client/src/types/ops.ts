export type InsertOp = {
    kind: "insert";
    type: string;
    index: number;
    text: string;
    senderId: string;
};

export type DeleteOp = {
    kind: "delete";
    type: string;
    index: number;
    length: number;
    senderId: string;
};

export type TextOp = InsertOp | DeleteOp;

export function applyOp(content: string, op: TextOp): string {
    if (op.kind === "insert") {
        return content.slice(0, op.index) + op.text + content.slice(op.index);
    }
    return content.slice(0, op.index) + content.slice(op.index + op.length);
}
