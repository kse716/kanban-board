package com.example.demo.task;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ChecklistItem {

    @Column(name = "item_id", nullable = false, length = 64)
    private String id;

    @Column(name = "item_text", nullable = false, length = 500)
    private String text;

    @Column(name = "completed", nullable = false)
    private boolean completed;

    protected ChecklistItem() {
    }

    public ChecklistItem(String id, String text, boolean completed) {
        this.id = id;
        this.text = text;
        this.completed = completed;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
