package com.example.demo.project;

import com.example.demo.task.Task;
import com.example.demo.task.TaskRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class ProjectDataInitializer implements ApplicationRunner {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public ProjectDataInitializer(
            ProjectRepository projectRepository,
            TaskRepository taskRepository
    ) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Project defaultProject = projectRepository
                .findAllByOrderByCreatedAtAsc()
                .stream()
                .findFirst()
                .orElseGet(() -> projectRepository.save(
                        new Project("첫 번째 프로젝트", "#315bea")
                ));

        List<Task> unassignedTasks = taskRepository.findAllByProjectIsNull();
        unassignedTasks.forEach(task -> task.setProject(defaultProject));
    }
}
