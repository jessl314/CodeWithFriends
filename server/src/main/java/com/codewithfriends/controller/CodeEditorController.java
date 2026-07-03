package com.codewithfriends.controller;
import com.codewithfriends.dto.CodePayload;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class CodeEditorController {
    
    @MessageMapping("/update-code")
    @SendTo("/topic/workspace")
    public CodePayload handleCodeUpdate(CodePayload incomingOp) {
        System.out.println("Received micro-delta operation at index: " + incomingOp.getIndex());
        System.out.println("Action executed: " + incomingOp.getActionType());
        return incomingOp;
    }
}


