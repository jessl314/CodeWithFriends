package com.codewithfriends.controller;
import com.codewithfriends.dto.CodePayload;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;

// Spring Data Redis Imports 
import org.springframework.data.redis.core.StringRedisTemplate;

@Controller
public class CodeEditorController {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private StringRedisTemplate redisTemplate;

   
    /* server is listening to see if there is any updated code from this channel then it publishes
    this code string to the redis notepad (workspace:html...) and to the workspace channel so browser tabs can hear it */
    @MessageMapping("/update-code")
    public void handleCodeUpdate(CodePayload payload) {
        // save the key to redis notepad
        String redisKey = "workspace:" + payload.getType();
        redisTemplate.opsForValue().set(redisKey, payload.getContent());
        // broadcast to frontend subscription channel the code that the user updated
        // the Redis is publishing information to the subscribers
        messagingTemplate.convertAndSend("/topic/workspace", payload);
    }

    @MessageMapping("/get-current-workspace")
    // fetching from Redis the saved information for a newly connected tab
    public void handleWorkspaceFetch(String fileType) {
        String redisKey= "workspace: " + fileType;
        String savedCode = redisTemplate.opsForValue().get(redisKey);

        if (savedCode == null) {
            if(fileType.equals("html")) savedCode ="\n<h1>HelloWorld!</h1>";
            else if (fileType.equals("css")) savedCode = "h1 {\n color: royalBlue; \n}";
            else savedCode = "console.log('Hello Friend!')";
        }
        // saving the code string from Redis RAM notepad as current payload/content
        CodePayload payload = new CodePayload();
        payload.setType(fileType);
        payload.setContent(savedCode);

        messagingTemplate.convertAndSend("/topic/workspace", payload);
    }

}


