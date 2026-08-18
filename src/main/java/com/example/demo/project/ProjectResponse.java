package com.example.demo.project;

import java.time.Instant;

public record ProjectResponse(
        Long id,
        String name,
        String color,
        Instant createdAt,
        long taskCount
) {
}
