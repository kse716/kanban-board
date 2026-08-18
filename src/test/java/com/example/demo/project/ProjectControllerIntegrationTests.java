package com.example.demo.project;

import com.example.demo.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProjectControllerIntegrationTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        projectRepository.deleteAll();
    }

    @Test
    void managesProjectsAndKeepsTasksSeparated() throws Exception {
        Project first = projectRepository.save(new Project("웹 리뉴얼", "#315bea"));
        Project second = projectRepository.save(new Project("모바일 앱", "#8b74e8"));

        mockMvc.perform(post("/api/tasks")
                        .param("projectId", first.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "프로젝트별 작업",
                                  "status": "TODO",
                                  "position": 0,
                                  "tags": [],
                                  "checklist": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(first.getId()));

        mockMvc.perform(get("/api/tasks")
                        .param("projectId", first.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("프로젝트별 작업"));

        mockMvc.perform(get("/api/tasks")
                        .param("projectId", second.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        mockMvc.perform(put("/api/projects/{id}", first.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "웹 리뉴얼 2차", "color": "#315bea"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("웹 리뉴얼 2차"))
                .andExpect(jsonPath("$.taskCount").value(1));
    }
}
