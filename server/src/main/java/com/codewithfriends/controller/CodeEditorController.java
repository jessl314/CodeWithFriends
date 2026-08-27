package com.codewithfriends.controller;

import com.codewithfriends.dto.TextOp;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class CodeEditorController {

    @MessageMapping("/update-code")
    @SendTo("/topic/workspace")
    public TextOp handleCodeUpdate(TextOp incomingOp) {
        return incomingOp;
    }
}
