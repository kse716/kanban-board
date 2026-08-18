package com.example.demo.task;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaskControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
    }

    @Test
    void createsAndUpdatesTaskInDatabase() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "DB 저장 테스트",
                                  "description": "생성 데이터",
                                  "status": "TODO",
                                  "position": 0,
                                  "assignee": "김개발",
                                  "dueDate": "2026-08-20",
                                  "tags": ["개발"],
                                  "checklist": [
                                    {"id": "check-1", "text": "API 연결", "completed": false}
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.tags[0]").value("개발"))
                .andExpect(jsonPath("$.checklist[0].text").value("API 연결"));

        Task created = taskRepository.findAll().getFirst();
        assertThat(created.getTitle()).isEqualTo("DB 저장 테스트");
        assertThat(created.getTags()).containsExactly("개발");
        assertThat(created.getChecklist()).hasSize(1);

        mockMvc.perform(put("/api/tasks/{id}", created.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "수정된 작업",
                                  "description": "수정 데이터",
                                  "status": "PROGRESS",
                                  "position": 2,
                                  "assignee": "이수정",
                                  "dueDate": "2026-08-21",
                                  "tags": ["개발", "검토"],
                                  "checklist": [
                                    {"id": "check-1", "text": "API 연결", "completed": true}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정된 작업"))
                .andExpect(jsonPath("$.status").value("PROGRESS"))
                .andExpect(jsonPath("$.checklist[0].completed").value(true));

        taskRepository.flush();
        Task updated = taskRepository.findById(created.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("수정된 작업");
        assertThat(updated.getStatus()).isEqualTo(TaskStatus.PROGRESS);
        assertThat(updated.getTags()).containsExactly("개발", "검토");
        assertThat(updated.getChecklist().getFirst().isCompleted()).isTrue();
    }
}
