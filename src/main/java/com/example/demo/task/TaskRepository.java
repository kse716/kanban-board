package com.example.demo.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByOrderByStatusAscPositionAsc();

    List<Task> findAllByProject_IdOrderByStatusAscPositionAsc(Long projectId);

    List<Task> findAllByProjectIsNull();

    long countByProject_Id(Long projectId);
}
