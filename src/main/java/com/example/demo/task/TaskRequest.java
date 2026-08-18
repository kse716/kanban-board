package com.example.demo.task;

import java.time.LocalDate;
import java.util.List;

public record TaskRequest(String title,
                          String description,
                          TaskStatus status,
                          Long position,
                          String assignee,
                          LocalDate dueDate,
                          List<String> tags,
                          List<ChecklistItem> checklist) {
}
