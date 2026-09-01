package com.codewithfriends.controller;

import com.codewithfriends.dto.WorkspaceSnapshot;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.codewithfriends.util.WorkspaceDefaults;

// cross origin required so vite (port 5174/5173) can fetch port 8080
@RestController
@CrossOrigin(originPatterns = "*")
public class WorkspaceController {

    private static final String KEY_PREFIX = "workspace:";
    private final StringRedisTemplate redis;

    public WorkspaceController(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @GetMapping("/api/workspace")
    public WorkspaceSnapshot snapshot() {
        return new WorkspaceSnapshot(
            read("html"),
            read("css"),
            read("javascript")
        );
    }

    private String read(String type) {
        String stored = redis.opsForValue().get(KEY_PREFIX + type);
        return stored != null ? stored : WorkspaceDefaults.forType(type);
    }
}