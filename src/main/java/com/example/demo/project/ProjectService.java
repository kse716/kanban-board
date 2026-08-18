package com.example.demo.project;

import com.example.demo.task.Task;
import com.example.demo.task.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            TaskRepository taskRepository
    ) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    public List<ProjectResponse> findAll() {
        return projectRepository.findAllByOrderByCreatedAtAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        String name = requireName(request.name());
        String color = normalizeColor(request.color());

        Project project = projectRepository.save(
                new Project(name, color)
        );

        return toResponse(project);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = requireProject(id);

        project.setName(requireName(request.name()));
        project.setColor(normalizeColor(request.color()));

        return toResponse(project);
    }

    @Transactional
    public void delete(Long id) {
        Project project = requireProject(id);
        List<Task> tasks = taskRepository
                .findAllByProject_IdOrderByStatusAscPositionAsc(id);

        taskRepository.deleteAll(tasks);
        projectRepository.delete(project);
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getColor(),
                project.getCreatedAt(),
                taskRepository.countByProject_Id(project.getId())
        );
    }

    private Project requireProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "프로젝트를 찾을 수 없습니다: " + id
                ));
    }

    private String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("프로젝트 이름은 필수입니다.");
        }

        String trimmed = name.trim();
        if (trimmed.length() > 100) {
            throw new IllegalArgumentException(
                    "프로젝트 이름은 100자 이하여야 합니다."
            );
        }
        return trimmed;
    }

    private String normalizeColor(String color) {
        return color == null || color.isBlank()
                ? "#315bea"
                : color.trim();
    }
}
