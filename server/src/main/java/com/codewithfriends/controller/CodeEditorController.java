package com.codewithfriends.controller;

import com.codewithfriends.dto.TextOp;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;

// Spring Data Redis Imports 
import org.springframework.data.redis.core.StringRedisTemplate;

@Controller
public class CodeEditorController {

    @MessageMapping("/update-code")
    @SendTo("/topic/workspace")
    public TextOp handleCodeUpdate(TextOp incomingOp) {
        return incomingOp;
    }

}
