import React, {useMemo} from 'react';
import './StatsDashboard.css';

const statusItems = [
    {id: 'todo', label: '할 일', color: '#87909e'},
    {id: 'progress', label: '진행 중', color: '#4e7cff'},
    {id: 'review', label: '검토', color: '#f4a340'},
    {id: 'done', label: '완료', color: '#38aa74'}
];

function StatsDashboard({tasks}) {
    const stats = useMemo(() => {
        const statusCounts = {
            todo: 0,
            progress: 0,
            review: 0,
            done: 0
        };

        tasks.forEach(task => {
            if (statusCounts[task.column] !== undefined) {
                statusCounts[task.column] += 1;
            }
        });

        const total = tasks.length;
        const completed = statusCounts.done;
        const completionRate = total === 0
            ? 0
            : Math.round((completed / total) * 100);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueTasks = tasks
            .filter(task => {
                if (!task.due || task.due === '일정 미정' || task.column === 'done') {
                    return false;
                }

                const dueDate = new Date(`${task.due}T00:00:00`);
                return !Number.isNaN(dueDate.getTime()) && dueDate < today;
            })
            .sort((a, b) => a.due.localeCompare(b.due));

        return {
            total,
            completed,
            completionRate,
            overdueTasks,
            statusCounts
        };
    }, [tasks]);

    return (
        <section className="stats-dashboard" aria-label="프로젝트 통계">
            <div className="stats-summary">
                <article className="stats-card">
                    <span>전체 작업</span>
                    <strong>{stats.total}</strong>
                </article>
                <article className="stats-card">
                    <span>완료 작업</span>
                    <strong>{stats.completed}</strong>
                </article>
                <article className="stats-card">
                    <span>완료율</span>
                    <strong>{stats.completionRate}%</strong>
                </article>
                <article className="stats-card overdue">
                    <span>기한 초과</span>
                    <strong>{stats.overdueTasks.length}</strong>
                </article>
            </div>

            <div className="stats-content">
                <article className="stats-panel">
                    <div className="stats-panel-heading">
                        <div>
                            <span>작업 분포</span>
                            <h2>상태별 작업</h2>
                        </div>
                        <strong>{stats.total}개</strong>
                    </div>

                    <div className="status-stat-list">
                        {statusItems.map(status => {
                            const count = stats.statusCounts[status.id];
                            const percentage = stats.total === 0
                                ? 0
                                : Math.round((count / stats.total) * 100);

                            return (
                                <div className="status-stat" key={status.id}>
                                    <div className="status-stat-label">
                                        <span className="status-stat-dot"
                                              style={{background: status.color}}/>
                                        <strong>{status.label}</strong>
                                        <span>{count}개</span>
                                    </div>
                                    <div className="status-stat-track"
                                         aria-label={`${status.label} ${percentage}%`}>
                                        <span style={{
                                            width: `${percentage}%`,
                                            background: status.color
                                        }}/>
                                    </div>
                                    <span className="status-stat-percent">{percentage}%</span>
                                </div>
                            );
                        })}
                    </div>
                </article>

                <article className="stats-panel">
                    <div className="stats-panel-heading">
                        <div>
                            <span>주의 필요</span>
                            <h2>기한이 지난 작업</h2>
                        </div>
                        <strong className="overdue-count">{stats.overdueTasks.length}개</strong>
                    </div>

                    {stats.overdueTasks.length === 0 ? (
                        <p className="stats-empty">기한이 지난 작업이 없습니다.</p>
                    ) : (
                        <div className="overdue-task-list">
                            {stats.overdueTasks.map(task => (
                                <div className="overdue-task" key={task.id}>
                                    <div>
                                        <strong>{task.title}</strong>
                                        <span>{task.assignee || '담당자 미정'}</span>
                                    </div>
                                    <time dateTime={task.due}>{task.due}</time>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </div>
        </section>
    );
}

export default StatsDashboard;
