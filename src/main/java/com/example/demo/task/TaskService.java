package com.example.demo.task;

import com.example.demo.project.Project;
import com.example.demo.project.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskService(
            TaskRepository taskRepository,
            ProjectRepository projectRepository
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    public List<Task> findAll(Long projectId) {
        List<Task> tasks;
        if (projectId == null) {
            tasks = taskRepository.findAllByOrderByStatusAscPositionAsc();
        } else {
            requireProject(projectId);
            tasks = taskRepository
                    .findAllByProject_IdOrderByStatusAscPositionAsc(projectId);
        }

        tasks.forEach(this::initializeCollections);
        return tasks;
    }

    public Task findById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "작업을 찾을 수 없습니다: " + id
                        )
                );

        initializeCollections(task);
        return task;
    }

    private void initializeCollections(Task task) {
        task.getTags().size();
        task.getChecklist().size();
    }

    @Transactional
    public Task create(Long projectId, TaskRequest request) {
        Project project = requireProject(projectId);
        Task task = new Task();

        task.setProject(project);
        task.setTitle(requireTitle(request.title()));
        task.setDescription(request.description());
        task.setStatus(
                request.status() == null
                        ? TaskStatus.TODO
                        : request.status()
        );
        task.setPosition(
                request.position() == null
                        ? 0L
                        : request.position()
        );
        task.setAssignee(request.assignee());
        task.setDueDate(request.dueDate());
        task.setTags(request.tags());
        task.setChecklist(request.checklist());

        return taskRepository.save(task);
    }

    @Transactional
    public Task update(Long id, TaskRequest request) {
        Task task = findById(id);

        task.setTitle(requireTitle(request.title()));
        task.setDescription(request.description());
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (request.position() != null) {
            task.setPosition(request.position());
        }
        task.setAssignee(request.assignee());
        task.setDueDate(request.dueDate());
        task.setTags(request.tags());
        task.setChecklist(request.checklist());

        return taskRepository.save(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = findById(id);
        taskRepository.delete(task);
    }

    private String requireTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("작업 제목은 필수입니다.");
        }

        return title.trim();
    }

    private Project requireProject(Long projectId) {
        if (projectId == null) {
            return projectRepository.findAllByOrderByCreatedAtAsc()
                    .stream()
                    .findFirst()
                    .orElseGet(() -> projectRepository.save(
                            new Project("첫 번째 프로젝트", "#315bea")
                    ));
        }

        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "프로젝트를 찾을 수 없습니다: " + projectId
                ));
    }

    @Transactional
    public void reorder(List<TaskOrderRequest> requests) {
        for (TaskOrderRequest request : requests) {
            Task task = taskRepository.findById(request.id())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "작업을 찾을 수 없습니다." + request.id()
                            ));
            task.setStatus(request.status());
            task.setPosition(request.position());
        }
    }
}
