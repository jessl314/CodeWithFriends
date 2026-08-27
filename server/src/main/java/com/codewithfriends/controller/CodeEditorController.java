package com.codewithfriends.controller;

import com.codewithfriends.dto.TextOp;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;
// Spring Data Redis Imports 
import org.springframework.data.redis.core.StringRedisTemplate;

@Controller
public class CodeEditorController {

    private static final String KEY_PREFIX = "workspace:";
    private final StringRedisTemplate redis;

    public CodeEditorController(StringRedisTemplate redis) {
        this.redis = redis;
    }
    /**
     * store updated code after micro-operation into Redis
     * @param incomingOp incoming micro-operation
     * @return micro-operation object 
     */
    @MessageMapping("/update-code")
    @SendTo("/topic/workspace")
    public TextOp handleCodeUpdate(TextOp incomingOp) {
        String key = KEY_PREFIX + incomingOp.getType()
        // based on the workspace:file get the full file string
        String current = redis.opsForValue().get(key);
        if (current == null) {
            current = defaultFor(incomingOp.getType());
        }
        redis.opsForValue().set(key, applyOp(current, incomingOp));
        return incomingOp;
    }
    /**
     * apply insert or delete operation to the content requested. keeps shared notepad in sync between users
     * @param content file content as a string
     * @param op operation object to be applied to content
     * @return updated full content
     */
    private static String applyOp(String content, TextOp op) {
        if ("insert".equals(op.getKind())) {
            String text = op.getText() != null ? op.getText() : "";
            // i : index, insert char after i
            int i = Math.min(Math.max(op.getIndex(), 0), content.length());
            return content.substring(0, i) + text + content.substring(i);
        }
        if ("delete".equals(op.getKind())) {
            int i = Math.min(Math.max(op.getIndex(), 0), content.length());
            int end = Math.min(i + Math.max(op.getLength(), 0), content.length());
            return content.substring(0, i) + content.substring(end);
        }
        return content;
    }

    /**
     * default content for file type
     * @param type file type
     * @return the corresponding default file content.
     */
    private static String defaultFor(String type) {
        return switch (type) {
            case "html" -> "\n<h1>Hello World!</h1>";
            case "css" -> "h1 {\n color: royalBlue;\n}";
            case "javascript" -> "console.log('Hello Friend!')";
            default -> "";
        };
    }


}
