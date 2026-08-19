package com.example.demo.task;

public record TaskOrderRequest(
        Long id,
        TaskStatus status,
        Long position
) {
}