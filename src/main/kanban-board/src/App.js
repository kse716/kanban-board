import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import Select, {components} from 'react-select';
import {Trash2} from 'lucide-react';

import Login from './login';
import ProjectSidebar from './components/ProjectSidebar/ProjectSidebar';
import './App.css';

const columns = [
    {
        id: 'todo',
        title: '할 일',
        dot: '#87909e'
    },
    {
        id: 'progress',
        title: '진행 중',
        dot: '#4e7cff'
    },
    {
        id: 'review',
        title: '검토',
        dot: '#f4a340'
    },
    {
        id: 'done',
        title: '완료',
        dot: '#38aa74'
    }
];

const sortOptions = [
    {
        value: 'due-asc',
        label: '마감일 빠른순'
    },
    {
        value: 'due-desc',
        label: '마감일 늦은순'
    },
    {
        value: 'title',
        label: '이름순'
    },
    {
        value: 'manager-name',
        label: '담당자 이름순'
    },
    {
        value: 'newest',
        label: '최근 생성순'
    },
    {
        value: 'updated',
        label: '최근 수정순'
    }
];

const defaultTags = [
    {
        id: 'planning',
        name: '기획',
        color: 'blue'
    },
    {
        id: 'design',
        name: '디자인',
        color: 'pink'
    },
    {
        id: 'development',
        name: '개발',
        color: 'green'
    },
    {
        id: 'operation',
        name: '운영',
        color: 'orange'
    },
    {
        id: 'uncategorized',
        name: '미분류',
        color: 'gray'
    }
];

const projectColors = ['#315bea', '#8b74e8', '#38a878', '#e8904f'];

// 실제 로그인 API가 연결되면 /api/users/me 응답으로 교체합니다.
const currentUser = {
    id: 'user-001',
    name: '사용자'
};

const createEmptyForm = (column = 'todo') => ({
    title: '',
    description: '',
    column,
    tags: [],
    assignee: '',
    due: '',
    checklist: []
});

const normalizeTask = task => ({
    ...task,

    // 백엔드 status를 기존 React column 형식으로 변환
    column: task.status
        ? task.status.toLowerCase()
        : task.column || 'todo',

    // 백엔드 dueDate를 기존 React due 형식으로 변환
    due: task.dueDate || task.due || '일정 미정',

    tags: Array.isArray(task.tags)
        ? task.tags.map(tag =>
            typeof tag === 'string'
                ? tag
                : tag.name
        )
        : task.tag
            ? [task.tag]
            : [],

    checklist: Array.isArray(task.checklist)
        ? task.checklist
        : [],

    assignee: task.assignee || '담당자 미정'
});

function TagOption(props) {
    const {data, selectProps} = props;

    return (
        <components.Option {...props}>
            <div className="tag-option">
                <span className={`tag ${data.color}`}>
                    {data.label}
                </span>

                {data.value !== '미분류' && (
                    <button
                        type="button"
                        className="tag-option-delete"
                        aria-label={`${data.label} 태그 삭제`}
                        onMouseDown={event => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                        onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            selectProps.deleteTag(data.value);
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </components.Option>
    );
}

function TagMenuList(props) {
    const {selectProps} = props;

    return (
        <components.MenuList {...props}>
            {props.children}

            <div
                className="tag-add-area"
                onMouseDown={event => {
                    event.stopPropagation();
                    selectProps.setTagInputActive(true);
                }}
            >
                <input
                    value={selectProps.newTagName}
                    onChange={event =>
                        selectProps.setNewTagName(event.target.value)
                    }
                    onFocus={() =>
                        selectProps.setTagInputActive(true)
                    }
                    onBlur={event => {
                        if (
                            !event.relatedTarget?.closest?.(
                                '.tag-add-area'
                            )
                        ) {
                            selectProps.setTagInputActive(false);
                            selectProps.setTagMenuOpen(false);
                        }
                    }}
                    onKeyDown={event => {
                        event.stopPropagation();

                        if (event.key === 'Enter') {
                            event.preventDefault();
                            selectProps.addTag();
                        }
                    }}
                    placeholder="새 태그 입력"
                    aria-label="새 태그 이름"
                />

                <button
                    type="button"
                    onMouseDown={event => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        selectProps.addTag();
                    }}
                >
                    추가
                </button>
            </div>
        </components.MenuList>
    );
}

function App() {

    const reorderTasks = (
        currentTasks,
        sourceTaskId,
        targetColumn,
        targetTaskId = null,
        dropPosition = 'after'
    ) => {
        const draggedTask = currentTasks.find(
            task => task.id === sourceTaskId
        );

        if (!draggedTask) {
            return currentTasks;
        }

        const remainingTasks = currentTasks.filter(
            task => task.id !== sourceTaskId
        );

        const movedTask = {
            ...draggedTask,
            column: targetColumn
        };

        let nextTasks;

        // 칼럼의 빈 공간에 놓은 경우
        if (targetTaskId === null) {
            const targetIndexes = remainingTasks
                .map((task, index) => ({
                    task,
                    index
                }))
                .filter(
                    item =>
                        item.task.column === targetColumn
                );

            if (targetIndexes.length === 0) {
                nextTasks = [
                    ...remainingTasks,
                    movedTask
                ];
            } else {
                const lastIndex =
                    targetIndexes[
                    targetIndexes.length - 1
                        ].index;

                nextTasks = [...remainingTasks];

                nextTasks.splice(
                    lastIndex + 1,
                    0,
                    movedTask
                );
            }
        } else {
            // 특정 카드의 위 또는 아래에 놓은 경우
            const targetIndex =
                remainingTasks.findIndex(
                    task => task.id === targetTaskId
                );

            if (targetIndex === -1) {
                nextTasks = [
                    ...remainingTasks,
                    movedTask
                ];
            } else {
                const insertIndex =
                    dropPosition === 'before'
                        ? targetIndex
                        : targetIndex + 1;

                nextTasks = [...remainingTasks];

                nextTasks.splice(
                    insertIndex,
                    0,
                    movedTask
                );
            }
        }

        // 각 칼럼의 position을 0부터 다시 계산
        const columnPositions = {
            todo: 0,
            progress: 0,
            review: 0,
            done: 0
        };

        return nextTasks.map(task => ({
            ...task,
            position:
                columnPositions[task.column]++
        }));
    };


    const [page, setPage] = useState(
        window.location.pathname
    );

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(
        () => localStorage.getItem('flow-kanban-sidebar-collapsed') === 'true'
    );

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isProjectLoading, setProjectLoading] = useState(true);
    const [projectError, setProjectError] = useState('');

    const [tasks, setTasks] = useState([]);
    const [isLoading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({
        columns: [],
        tags: []
    });

    const [isFilterOpen, setFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('manual');
    const [isSortOpen, setSortOpen] = useState(false);

    const [draggedId, setDraggedId] = useState(null);
    const draggedIdRef = useRef(null);  //현재 잡은 카드
    const dragStartPointRef = useRef(null);  //처음 누른 위치
    const didDragRef = useRef(null);  //단순 클릭인지 실제 드래그인지 구분

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] =
        useState(null);
    const [isSaving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [form, setForm] = useState(
        createEmptyForm()
    );

    const [checklistInput, setChecklistInput] =
        useState('');

    const [isChecklistOpen, setChecklistOpen] =
        useState(false);

    const [tags, setTags] = useState(() => {
        try {
            const savedTags = JSON.parse(
                localStorage.getItem(
                    'flow-kanban-tags'
                )
            );

            return Array.isArray(savedTags) &&
            savedTags.length > 0
                ? savedTags
                : defaultTags;
        } catch {
            return defaultTags;
        }
    });

    const [newTagName, setNewTagName] = useState('');
    const [isTagMenuOpen, setTagMenuOpen] = useState(false);
    const tagInputActiveRef = useRef(false);

    const closeTagMenu = () => {
        tagInputActiveRef.current = false;
        setTagMenuOpen(false);
    }

    const [
        collapsedTaskIds,
        setCollapsedTaskIds
    ] = useState(() => {
        try {
            const savedValue = localStorage.getItem(
                'flow-kanban-collapsed'
            );

            return savedValue
                ? JSON.parse(savedValue)
                : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(
            'flow-kanban-sidebar-collapsed',
            String(isSidebarCollapsed)
        );
    }, [isSidebarCollapsed]);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                setProjectLoading(true);
                setProjectError('');

                const response = await fetch('/api/projects');
                if (!response.ok) {
                    throw new Error(`프로젝트 조회 실패: ${response.status}`);
                }

                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error('프로젝트 응답이 배열이 아닙니다.');
                }

                setProjects(data);

                const savedProjectId = Number(
                    localStorage.getItem('flow-kanban-selected-project')
                );
                const savedProjectExists = data.some(
                    project => project.id === savedProjectId
                );

                setSelectedProjectId(
                    savedProjectExists
                        ? savedProjectId
                        : data[0]?.id ?? null
                );
            } catch (error) {
                console.error(error);
                setProjectError('프로젝트 목록을 불러오지 못했습니다.');
            } finally {
                setProjectLoading(false);
            }
        };

        loadProjects();
    }, []);

    /* 선택된 프로젝트의 작업만 조회합니다. */
    useEffect(() => {
        if (selectedProjectId === null) {
            setTasks([]);
            setLoading(false);
            return;
        }

        localStorage.setItem(
            'flow-kanban-selected-project',
            String(selectedProjectId)
        );

        const loadTasks = async () => {
            try {
                setLoading(true);
                setLoadError('');

                const response = await fetch(
                    `/api/tasks?projectId=${selectedProjectId}`
                );

                if (!response.ok) {
                    throw new Error(
                        `작업 조회 실패: ${response.status}`
                    );
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error(
                        '작업 응답이 배열이 아닙니다.'
                    );
                }

                const convertedTasks =
                    data.map(normalizeTask);

                setTasks(convertedTasks);

                /*
                 * 접힘 상태가 한 번도 저장되지 않았다면
                 * 처음 불러온 작업을 모두 접습니다.
                 */
                if (
                    localStorage.getItem(
                        'flow-kanban-collapsed'
                    ) === null
                ) {
                    setCollapsedTaskIds(
                        convertedTasks.map(
                            task => task.id
                        )
                    );
                }
            } catch (error) {
                console.error(error);

                setLoadError(
                    '작업 목록을 불러오지 못했습니다.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, [selectedProjectId]);

    useEffect(() => {
        const handlePopState = () => {
            setPage(window.location.pathname);
        };

        window.addEventListener(
            'popstate',
            handlePopState
        );

        return () => {
            window.removeEventListener(
                'popstate',
                handlePopState
            );
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(
            'flow-kanban-tags',
            JSON.stringify(tags)
        );
    }, [tags]);

    useEffect(() => {
        localStorage.setItem(
            'flow-kanban-collapsed',
            JSON.stringify(collapsedTaskIds)
        );
    }, [collapsedTaskIds]);

    useEffect(() => {
        const clearDragging = () => {
            setDraggedId(null);
        };

        const clearDraggingOnEscape = event => {
            if (event.key === 'Escape') {
                clearDragging();
            }
        };

        const clearDraggingWhenHidden = () => {
            if (document.hidden) {
                clearDragging();
            }
        };

        window.addEventListener('dragend', clearDragging, true);
        window.addEventListener('drop', clearDragging, true);
        window.addEventListener('blur', clearDragging);
        window.addEventListener('keydown', clearDraggingOnEscape);
        document.addEventListener(
            'visibilitychange',
            clearDraggingWhenHidden
        );

        return () => {
            window.removeEventListener('dragend', clearDragging, true);
            window.removeEventListener('drop', clearDragging, true);
            window.removeEventListener('blur', clearDragging);
            window.removeEventListener('keydown', clearDraggingOnEscape);
            document.removeEventListener(
                'visibilitychange',
                clearDraggingWhenHidden
            );
        };
    }, []);

    const navigateTo = path => {
        window.history.pushState({}, '', path);
        setPage(path);
    };

    const selectedProject = projects.find(
        project => project.id === selectedProjectId
    ) || null;

    const selectProject = projectId => {
        if (projectId === selectedProjectId) return;

        closeTaskModal();
        setQuery('');
        setFilters({columns: [], tags: []});
        setSelectedProjectId(projectId);
    };

    const createProject = async name => {
        try {
            setProjectError('');
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name,
                    color: projectColors[projects.length % projectColors.length]
                })
            });

            if (!response.ok) {
                throw new Error(`프로젝트 생성 실패: ${response.status}`);
            }

            const created = await response.json();
            setProjects(current => [...current, created]);
            setSelectedProjectId(created.id);
            return created;
        } catch (error) {
            console.error(error);
            setProjectError('프로젝트를 만들지 못했습니다.');
            return null;
        }
    };

    const renameProject = async (project, name) => {
        try {
            setProjectError('');
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, color: project.color})
            });

            if (!response.ok) {
                throw new Error(`프로젝트 수정 실패: ${response.status}`);
            }

            const updated = await response.json();
            setProjects(current => current.map(item =>
                item.id === updated.id ? updated : item
            ));
            return updated;
        } catch (error) {
            console.error(error);
            setProjectError('프로젝트 이름을 바꾸지 못했습니다.');
            return null;
        }
    };

    const deleteProject = async project => {
        const shouldDelete = window.confirm(
            `"${project.name}" 프로젝트와 포함된 작업 ${project.taskCount ?? 0}개를 모두 삭제하시겠습니까?`
        );
        if (!shouldDelete) return;

        try {
            setProjectError('');
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`프로젝트 삭제 실패: ${response.status}`);
            }

            const remaining = projects.filter(item => item.id !== project.id);
            setProjects(remaining);

            if (selectedProjectId === project.id) {
                setSelectedProjectId(remaining[0]?.id ?? null);
            }
        } catch (error) {
            console.error(error);
            setProjectError('프로젝트를 삭제하지 못했습니다.');
        }
    };

    const filteredTasks = useMemo(() => {
        const term = query
            .trim()
            .toLowerCase();

        return tasks.filter(task => {
            const taskTags = Array.isArray(task.tags)
                ? task.tags
                : [];

            const searchTarget = [
                task.title,
                task.description,
                task.assignee,
                ...taskTags
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch =
                !term ||
                searchTarget.includes(term);

            const matchesColumn =
                filters.columns.length === 0 ||
                filters.columns.includes(
                    task.column
                );

            const matchesTag =
                filters.tags.length === 0 ||
                filters.tags.some(tagName =>
                    taskTags.includes(tagName)
                );

            return (
                matchesSearch &&
                matchesColumn &&
                matchesTag
            );
        });
    }, [query, tasks, filters]);

    const getDueTime = due => {
        if (!due || due === '일정 미정') {
            return Number.MAX_SAFE_INTEGER;
        }

        const time = new Date(due).getTime();

        return Number.isNaN(time)
            ? Number.MAX_SAFE_INTEGER
            : time;
    };

    const sortedTasks = useMemo(() => {
        const result = [...filteredTasks];

        switch (sortBy) {
            case 'due-asc':
                return result.sort(
                    (a, b) =>
                        getDueTime(a.due) -
                        getDueTime(b.due)
                );

            case 'due-desc':
                return result.sort(
                    (a, b) =>
                        getDueTime(b.due) -
                        getDueTime(a.due)
                );

            case 'title':
                return result.sort(
                    (a, b) =>
                        (a.title || '').localeCompare(
                            b.title || '',
                            'ko'
                        )
                );

            case 'manager-name':
                return result.sort(
                    (a, b) =>
                        (
                            a.assignee || ''
                        ).localeCompare(
                            b.assignee || '',
                            'ko'
                        )
                );

            case 'newest':
                return result.sort(
                    (a, b) =>
                        new Date(
                            b.createdAt
                        ).getTime() -
                        new Date(
                            a.createdAt
                        ).getTime()
                );

            case 'updated':
                return result.sort(
                    (a, b) =>
                        new Date(
                            b.updatedAt
                        ).getTime() -
                        new Date(
                            a.updatedAt
                        ).getTime()
                );

            default:
                return result;
        }
    }, [filteredTasks, sortBy]);

    const activeFilterCount =
        filters.columns.length +
        filters.tags.length;

    const toggleFilter = (group, value) => {
        setFilters(current => ({
            ...current,

            [group]: current[group].includes(value)
                ? current[group].filter(
                    item => item !== value
                )
                : [
                    ...current[group],
                    value
                ]
        }));
    };

    const toggleFilterPopover = () => {
        setFilterOpen(current => {
            const next = !current;

            if (next) {
                setSortOpen(false);
            }

            return next;
        });
    };

    const toggleSortPopover = () => {
        setSortOpen(current => {
            const next = !current;

            if (next) {
                setFilterOpen(false);
            }

            return next;
        });
    };

    const closeTaskModal = () => {
        closeTagMenu();
        setNewTagName('');

        setModalOpen(false);
        setEditingTaskId(null);
        setSaveError('');
        setChecklistInput('');
        setChecklistOpen(false);
        setForm(createEmptyForm());
    };

    const openCreateModal = (
        column = 'todo'
    ) => {
        closeTagMenu();
        setNewTagName('');

        setEditingTaskId(null);
        setSaveError('');
        setChecklistInput('');
        setChecklistOpen(false);
        setForm(createEmptyForm(column));
        setModalOpen(true);
    };

    const openEditModal = task => {
        closeTagMenu();
        setNewTagName('');

        setEditingTaskId(task.id);
        setSaveError('');

        setForm({
            title: task.title || '',
            description: task.description || '',
            column: task.column || 'todo',
            tags: Array.isArray(task.tags)
                ? task.tags
                : [],
            assignee:
                task.assignee === '담당자 미정'
                    ? ''
                    : task.assignee || '',
            due:
                task.due === '일정 미정'
                    ? ''
                    : task.due || '',
            checklist: Array.isArray(task.checklist)
                ? task.checklist
                : []
        });

        setChecklistInput('');
        setChecklistOpen(false);
        setModalOpen(true);
    };

    const saveTask = async event => {
        event.preventDefault();

        if (!form.title.trim() || selectedProjectId === null) {
            return;
        }

        const taskValues = {
            ...form,
            title: form.title.trim(),
            description:
                form.description.trim() ||
                '세부 내용을 추가해 주세요.',
            assignee:
                form.assignee.trim() ||
                '담당자 미정',
            due:
                form.due ||
                '일정 미정',
            checklist: form.checklist
                .filter(item =>
                    item.text.trim()
                )
                .map(item => ({
                    ...item,
                    text: item.text.trim()
                }))
        };

        const editingTask = editingTaskId === null
            ? null
            : tasks.find(task => task.id === editingTaskId);

        const lastPosition = tasks
            .filter(task => task.column === taskValues.column)
            .reduce(
                (maximum, task) => Math.max(maximum, task.position ?? 0),
                -1
            );

        const requestBody = {
            title: taskValues.title,
            description: taskValues.description,
            status: taskValues.column.toUpperCase(),
            position: editingTask?.position ?? lastPosition + 1,
            assignee: taskValues.assignee,
            dueDate:
                taskValues.due === '일정 미정'
                    ? null
                    : taskValues.due,
            tags: taskValues.tags,
            checklist: taskValues.checklist
        };

        const isEditing = editingTaskId !== null;
        const url = isEditing
            ? `/api/tasks/${editingTaskId}`
            : `/api/tasks?projectId=${selectedProjectId}`;

        try {
            setSaving(true);
            setSaveError('');

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`작업 저장 실패: ${response.status}`);
            }

            const savedTask = normalizeTask(await response.json());

            if (isEditing) {
                setTasks(current =>
                    current.map(task =>
                        task.id === editingTaskId
                            ? savedTask
                            : task
                    )
                );
            } else {
                setTasks(current => [
                    ...current,
                    savedTask
                ]);
                setProjects(current => current.map(project =>
                    project.id === selectedProjectId
                        ? {...project, taskCount: (project.taskCount ?? 0) + 1}
                        : project
                ));
                setCollapsedTaskIds(current => [
                    ...current,
                    savedTask.id
                ]);
            }

            closeTaskModal();
        } catch (error) {
            console.error(error);
            setSaveError(
                '작업을 저장하지 못했습니다. 서버 연결을 확인한 뒤 다시 시도해 주세요.'
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteTask = async id => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`작업 삭제 실패: ${response.status}`);
            }

            setTasks(current => current.filter(task => task.id !== id));
            setProjects(current => current.map(project =>
                project.id === selectedProjectId
                    ? {...project, taskCount: Math.max(0, (project.taskCount ?? 0) - 1)}
                    : project
            ));
        } catch (error) {
            console.error(error);
            window.alert('작업을 삭제하지 못했습니다.');
        }
    };

    const moveTask = async (
        targetColumn,
        targetTaskId = null,
        dropPosition = 'after'
    ) => {
        const sourceTaskId =
            draggedIdRef.current;

        if (sourceTaskId === null) {
            return;
        }

        const previousTasks = tasks;

        const nextTasks = reorderTasks(
            tasks,
            sourceTaskId,
            targetColumn,
            targetTaskId,
            dropPosition
        );

        setTasks(nextTasks);
        setDraggedId(null);

        try {
            await saveTaskOrder(nextTasks);
        } catch (error) {
            console.error(error);
            setTasks(previousTasks);

            window.alert(
                '작업 이동을 저장하지 못했습니다.'
            );
        }
    };

    const startPointerDrag = (event, taskId) => {
        if (
            event.button !== 0 ||
            sortBy !== 'manual' ||
            event.target.closest('button, input, textarea, select, a')
        ) {
            return;
        }

        draggedIdRef.current = taskId;
        dragStartPointRef.current = {
            x: event.clientX,
            y: event.clientY
        };
        didDragRef.current = false;

        event.currentTarget.setPointerCapture(
            event.pointerId
        );
    };

    const updatePointerDrag = event => {
        if (
            draggedIdRef.current === null ||
            !dragStartPointRef.current
        ) {
            return;
        }

        const distanceX =
            event.clientX -
            dragStartPointRef.current.x;

        const distanceY =
            event.clientY -
            dragStartPointRef.current.y;

        const distance = Math.hypot(
            distanceX,
            distanceY
        );

        if (
            !didDragRef.current &&
            distance >= 5
        ) {
            didDragRef.current = true;
            setDraggedId(
                draggedIdRef.current
            );
        }
    };

    const finishPointerDrag = event => {
        const sourceTaskId =
            draggedIdRef.current;

        if (
            sourceTaskId === null ||
            !didDragRef.current
        ) {
            draggedIdRef.current = null;
            dragStartPointRef.current = null;
            setDraggedId(null);
            return;
        }

        const columnElements = [
            ...document.querySelectorAll(
                '[data-column-id]'
            )
        ];

        const targetColumn =
            columnElements.find(element => {
                const rect =
                    element.getBoundingClientRect();

                return (
                    event.clientX >= rect.left &&
                    event.clientX <= rect.right &&
                    event.clientY >= rect.top &&
                    event.clientY <= rect.bottom
                );
            });

        if (targetColumn) {
            const columnId =
                targetColumn.dataset.columnId;

            const targetCard = [
                ...targetColumn.querySelectorAll(
                    '[data-task-id]'
                )
            ].find(element => {
                const targetTaskId = Number(
                    element.dataset.taskId
                );

                if (targetTaskId === sourceTaskId) {
                    return false;
                }

                const rect =
                    element.getBoundingClientRect();

                return (
                    event.clientY >= rect.top &&
                    event.clientY <= rect.bottom
                );
            });

            if (targetCard) {
                const targetTaskId = Number(
                    targetCard.dataset.taskId
                );

                const rect =
                    targetCard.getBoundingClientRect();

                const position =
                    event.clientY <
                    rect.top + rect.height / 2
                        ? 'before'
                        : 'after';

                moveTask(
                    columnId,
                    targetTaskId,
                    position
                );
            } else {
                moveTask(columnId);
            }
        }

        draggedIdRef.current = null;
        dragStartPointRef.current = null;
        setDraggedId(null);

        window.setTimeout(() => {
            didDragRef.current = false;
        }, 0);
    };

    const cancelPointerDrag = () => {
        draggedIdRef.current = null;
        dragStartPointRef.current = null;
        didDragRef.current = false;
        setDraggedId(null);
    };


    const toggleTaskCollapsed = taskId => {
        setCollapsedTaskIds(current =>
            current.includes(taskId)
                ? current.filter(
                    id => id !== taskId
                )
                : [
                    ...current,
                    taskId
                ]
        );
    };

    const tagOptions = tags.map(tag => ({
        value: tag.name,
        label: tag.name,
        color: tag.color
    }));

    const addTag = () => {
        const trimmedName = newTagName.trim();

        if (!trimmedName) {
            return;
        }

        const duplicated = tags.some(
            tag =>
                tag.name.toLowerCase() ===
                trimmedName.toLowerCase()
        );

        if (duplicated) {
            window.alert(
                '이미 존재하는 태그입니다.'
            );

            return;
        }

        const newTag = {
            id: crypto.randomUUID(),
            name: trimmedName,
            color: 'gray'
        };

        setTags(current => [
            ...current,
            newTag
        ]);

        setForm(current => ({
            ...current,
            tags: [
                ...current.tags,
                trimmedName
            ]
        }));

        setNewTagName('');
    };

    const deleteTag = tagName => {
        if (tagName === '미분류') {
            return;
        }

        const shouldDelete =
            window.confirm(
                `"${tagName}" 태그를 삭제하시겠습니까?\n` +
                '이 태그를 사용하는 작업은 미분류로 변경됩니다.'
            );

        if (!shouldDelete) {
            return;
        }

        setTags(current =>
            current.filter(
                tag => tag.name !== tagName
            )
        );

        setTasks(current =>
            current.map(task => {
                const taskTags =
                    Array.isArray(task.tags)
                        ? task.tags
                        : [];

                if (
                    !taskTags.includes(tagName)
                ) {
                    return task;
                }

                const remainingTags =
                    taskTags.filter(
                        name =>
                            name !== tagName
                    );

                return {
                    ...task,
                    tags:
                        remainingTags.length > 0
                            ? remainingTags
                            : ['미분류']
                };
            })
        );

        setFilters(current => ({
            ...current,
            tags: current.tags.filter(
                selectedTag =>
                    selectedTag !== tagName
            )
        }));

        setForm(current => ({
            ...current,
            tags: current.tags.filter(
                name =>
                    name !== tagName
            )
        }));
    };

    const addChecklistItem = () => {
        const text =
            checklistInput.trim();

        if (!text) {
            return;
        }

        setForm(current => ({
            ...current,
            checklist: [
                ...current.checklist,
                {
                    id: crypto.randomUUID(),
                    text,
                    completed: false
                }
            ]
        }));

        setChecklistInput('');
    };

    const toggleChecklistItem = itemId => {
        setForm(current => ({
            ...current,
            checklist:
                current.checklist.map(item =>
                    item.id === itemId
                        ? {
                            ...item,
                            completed:
                                !item.completed
                        }
                        : item
                )
        }));
    };

    const updateChecklistItem = (
        itemId,
        text
    ) => {
        setForm(current => ({
            ...current,
            checklist:
                current.checklist.map(item =>
                    item.id === itemId
                        ? {
                            ...item,
                            text
                        }
                        : item
                )
        }));
    };

    const deleteChecklistItem = itemId => {
        setForm(current => ({
            ...current,
            checklist:
                current.checklist.filter(
                    item =>
                        item.id !== itemId
                )
        }));
    };

    const removeEmptyChecklistItem =
        itemId => {
            setForm(current => ({
                ...current,
                checklist:
                    current.checklist.filter(
                        item =>
                            item.id !== itemId ||
                            item.text.trim() !== ''
                    )
            }));
        };

    const formatDateTime = value => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);

        if (
            Number.isNaN(date.getTime())
        ) {
            return '-';
        }

        return new Intl.DateTimeFormat(
            'ko-KR',
            {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }
        ).format(date);
    };

    const formatDueDate = due => {
        if (
            !due ||
            due === '일정 미정'
        ) {
            return '일정 미정';
        }

        const match = due.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

        if (!match) {
            return due;
        }

        const [
            ,
            year,
            month,
            day
        ] = match;

        return `${year.slice(-2)}.${month}.${day}`;
    };

    const getDDay = due => {
        if (
            !due ||
            due === '일정 미정'
        ) {
            return '';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(
            `${due}T00:00:00`
        );

        const days = Math.ceil(
            (dueDate - today) /
            (1000 * 60 * 60 * 24)
        );

        if (days === 0) {
            return 'D-Day';
        }

        if (days < 0) {
            return `D+${Math.abs(days)}`;
        }

        return `D-${days}`;
    };

    const getDDayClass = dDay => {
        if (dDay === 'D-Day') {
            return 'dday-today';
        }

        if (dDay.startsWith('D-')) {
            return 'dday-before';
        }

        if (dDay.startsWith('D+')) {
            return 'dday-after';
        }

        return 'dday-none';
    };

    if (page === '/login') {
        return (
            <Login
                onBack={() =>
                    navigateTo('/')
                }
            />
        );
    }

    if (isProjectLoading || isLoading) {
        return (
            <div className="state-screen">
                <main>
                    <p>
                        프로젝트와 작업을 불러오는 중입니다.
                    </p>
                </main>
            </div>
        );
    }

    if (loadError || (projectError && projects.length === 0)) {
        return (
            <div className="state-screen">
                <main>
                    <p>{loadError || projectError}</p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        다시 시도
                    </button>
                </main>
            </div>
        );
    }

    const createOrderRequests = nextTasks => {
        const positions = {
            todo: 0,
            progress: 0,
            review: 0,
            done: 0
        };

        return nextTasks.map(task => ({
            id: task.id,
            status: task.column.toUpperCase(),
            position: positions[task.column]++
        }));
    };

    const saveTaskOrder = async nextTasks => {
        const response = await fetch('/api/tasks/reorder', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                createOrderRequests(nextTasks)
            )
        });

        if (!response.ok) {
            throw new Error(
                `작업 순서 저장 실패: ${response.status}`
            );
        }
    };

    return (
        <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <ProjectSidebar
                user={currentUser}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelect={selectProject}
                onCreate={createProject}
                onRename={renameProject}
                onDelete={deleteProject}
                collapsed={isSidebarCollapsed}
                onToggle={() => setSidebarCollapsed(current => !current)}
            />

            <main className="workspace-main">
                {projectError && (
                    <div className="workspace-error" role="alert">
                        {projectError}
                        <button type="button" onClick={() => setProjectError('')} aria-label="오류 닫기">×</button>
                    </div>
                )}

                <div className="page-heading">
                    <div className="page-title-area">
                        <h1>{selectedProject?.name || '프로젝트를 선택하세요'}</h1>
                    </div>

                    <div className="page-actions">
                        <button
                            className="login-button"
                            type="button"
                            onClick={() =>
                                navigateTo(
                                    '/login'
                                )
                            }
                        >
                            로그인
                        </button>

                        <button
                            className="primary-button"
                            type="button"
                            disabled={selectedProjectId === null}
                            onClick={() =>
                                openCreateModal()
                            }
                        >
                            ＋ 새 작업
                        </button>
                    </div>
                </div>

                <div className="toolbar">
                    <label className="board-search">
                        <span aria-hidden="true">
                            ⌕
                        </span>

                        <input
                            type="search"
                            value={query}
                            onChange={event =>
                                setQuery(
                                    event.target.value
                                )
                            }
                            placeholder="작업 이름, 설명, 담당자 검색"
                            aria-label="작업 검색"
                        />

                        {query && (
                            <button
                                type="button"
                                onClick={() =>
                                    setQuery('')
                                }
                                aria-label="검색어 지우기"
                            >
                                ×
                            </button>
                        )}
                    </label>

                    <div className="filters">
                        <button
                            className={
                                activeFilterCount
                                    ? 'filter-button active'
                                    : 'filter-button'
                            }
                            type="button"
                            onClick={
                                toggleFilterPopover
                            }
                            aria-expanded={
                                isFilterOpen
                            }
                        >
                            필터

                            {activeFilterCount >
                                0 && (
                                    <span>
                                    {
                                        activeFilterCount
                                    }
                                </span>
                                )}
                        </button>

                        {isFilterOpen && (
                            <div className="filter-popover">
                                <div className="filter-heading">
                                    <strong>
                                        작업 필터
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilterOpen(
                                                false
                                            )
                                        }
                                        aria-label="필터 닫기"
                                    >
                                        ×
                                    </button>
                                </div>

                                <fieldset>
                                    <legend>
                                        상태
                                    </legend>

                                    {columns.map(
                                        column => (
                                            <label
                                                key={
                                                    column.id
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={filters.columns.includes(
                                                        column.id
                                                    )}
                                                    onChange={() =>
                                                        toggleFilter(
                                                            'columns',
                                                            column.id
                                                        )
                                                    }
                                                />

                                                <span
                                                    className="filter-dot"
                                                    style={{
                                                        background:
                                                        column.dot
                                                    }}
                                                />

                                                {
                                                    column.title
                                                }
                                            </label>
                                        )
                                    )}
                                </fieldset>

                                <fieldset>
                                    <legend>
                                        분류
                                    </legend>

                                    {tags.map(tag => (
                                        <label
                                            key={tag.id}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.tags.includes(
                                                    tag.name
                                                )}
                                                onChange={() =>
                                                    toggleFilter(
                                                        'tags',
                                                        tag.name
                                                    )
                                                }
                                            />

                                            <span
                                                className={`tag ${tag.color}`}
                                            >
                                                {
                                                    tag.name
                                                }
                                            </span>
                                        </label>
                                    ))}
                                </fieldset>

                                <div className="filter-footer">
                                    <span>
                                        {
                                            filteredTasks.length
                                        }
                                        개의 작업
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            activeFilterCount ===
                                            0
                                        }
                                        onClick={() =>
                                            setFilters(
                                                {
                                                    columns:
                                                        [],
                                                    tags: []
                                                }
                                            )
                                        }
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sort-control">
                        <button
                            className={
                                sortBy !== 'manual'
                                    ? 'sort-button active'
                                    : 'sort-button'
                            }
                            type="button"
                            onClick={
                                toggleSortPopover
                            }
                            aria-expanded={
                                isSortOpen
                            }
                        >
                            정렬
                        </button>

                        {isSortOpen && (
                            <div className="sort-popover">
                                <strong>
                                    정렬 기준
                                </strong>

                                {sortOptions.map(
                                    option => (
                                        <button
                                            type="button"
                                            key={
                                                option.value
                                            }
                                            className={
                                                sortBy ===
                                                option.value
                                                    ? 'selected'
                                                    : ''
                                            }
                                            onClick={() => {
                                                setSortBy(
                                                    option.value
                                                );

                                                setSortOpen(
                                                    false
                                                );
                                            }}
                                        >
                                            <span>
                                                {
                                                    option.label
                                                }
                                            </span>

                                            {sortBy ===
                                                option.value && (
                                                    <b>
                                                        ✓
                                                    </b>
                                                )}
                                        </button>
                                    )
                                )}

                                <div className="filter-footer">
                                    <button
                                        type="button"
                                        disabled={
                                            sortBy ===
                                            'manual'
                                        }
                                        onClick={() => {
                                            setSortBy(
                                                'manual'
                                            );

                                            setSortOpen(
                                                false
                                            );
                                        }}
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="board">
                    {columns.map(column => {
                        const items =
                            sortedTasks.filter(
                                task =>
                                    task.column ===
                                    column.id
                            );

                        return (
                            <section
                                className="column"
                                data-column-id={column.id}
                                key={column.id}

                            >
                                <div className="column-header">
                                    <div>
                                        <span
                                            className="column-dot"
                                            style={{
                                                background:
                                                column.dot
                                            }}
                                        />

                                        <h2>
                                            {
                                                column.title
                                            }
                                        </h2>

                                        <span className="count">
                                            {
                                                items.length
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="card-list">
                                    {items.map(task => {
                                        const taskTagNames =
                                            Array.isArray(
                                                task.tags
                                            )
                                                ? task.tags
                                                : [];

                                        const isCollapsed =
                                            collapsedTaskIds.includes(
                                                task.id
                                            );

                                        const dDay =
                                            getDDay(
                                                task.due
                                            );

                                        const dDayClass =
                                            getDDayClass(
                                                dDay
                                            );

                                        return (
                                            <article
                                                key={task.id}
                                                data-task-id={task.id}
                                                //네이티브 드래그 코드 제거
                                                // draggable={sortBy === 'manual'}
                                                className={`task-card ${draggedId === task.id ? 'dragging' : ''
                                                } ${isCollapsed ? 'collapsed' : ''}`}

                                                // onClick={() => {
                                                //     if (
                                                //         draggedId ===
                                                //         null
                                                //     ) {
                                                //         openEditModal(
                                                //             task
                                                //         );
                                                //     }
                                                // }}
                                                // onDragStart={
                                                //     event => {
                                                //         setDraggedId(
                                                //             task.id
                                                //         );
                                                //
                                                //         event.dataTransfer.effectAllowed =
                                                //             'move';
                                                //
                                                //         event.dataTransfer.setData(
                                                //             'text/plain',
                                                //             String(
                                                //                 task.id
                                                //             )
                                                //         );
                                                //     }
                                                // }
                                                // onDragOver={
                                                //     event => {
                                                //         event.preventDefault();
                                                //         event.stopPropagation();
                                                //     }
                                                // }
                                                // onDrop={
                                                //     event => {
                                                //         event.preventDefault();
                                                //         event.stopPropagation();
                                                //
                                                //         if (
                                                //             task.id ===
                                                //             draggedId
                                                //         ) {
                                                //             finishDragging();
                                                //             return;
                                                //         }
                                                //
                                                //         const cardRect =
                                                //             event.currentTarget.getBoundingClientRect();
                                                //
                                                //         const cardMiddle =
                                                //             cardRect.top +
                                                //             cardRect.height /
                                                //             2;
                                                //
                                                //         const dropPosition =
                                                //             event.clientY <
                                                //             cardMiddle
                                                //                 ? 'before'
                                                //                 : 'after';
                                                //
                                                //         moveTask(
                                                //             column.id,
                                                //             task.id,
                                                //             dropPosition
                                                //         );
                                                //     }
                                                // }
                                                // onDragEnd={
                                                //     finishDragging
                                                // }
                                                onPointerDown={event =>
                                                    startPointerDrag(
                                                        event,
                                                        task.id
                                                    )
                                                }
                                                onPointerMove={
                                                    updatePointerDrag
                                                }
                                                onPointerUp={
                                                    finishPointerDrag
                                                }
                                                onPointerCancel={
                                                    cancelPointerDrag
                                                }
                                                onClick={() => {
                                                    if (didDragRef.current) {
                                                        didDragRef.current = false;
                                                        return;
                                                    }

                                                    openEditModal(task);
                                                }}
                                            >
                                                <div className="card-top">
                                                    <div className="task-tags">
                                                        {taskTagNames.map(
                                                            tagName => {
                                                                const tagInfo =
                                                                    tags.find(
                                                                        tag =>
                                                                            tag.name ===
                                                                            tagName
                                                                    );

                                                                return (
                                                                    <span
                                                                        className={`tag ${
                                                                            tagInfo?.color ||
                                                                            'gray'
                                                                        }`}
                                                                        key={
                                                                            tagName
                                                                        }
                                                                    >
                                                                        {
                                                                            tagName
                                                                        }
                                                                    </span>
                                                                );
                                                            }
                                                        )}
                                                    </div>

                                                    {dDay && (
                                                        <div className="task-Dday">
                                                            <span
                                                                className={`task-dday ${dDayClass}`}
                                                            >
                                                                {
                                                                    dDay
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {isCollapsed ? (
                                                    <div className="task-title-row">
                                                        <h3 className="collapsed-title">
                                                            {
                                                                task.title
                                                            }
                                                        </h3>

                                                        <span className="collapsed-assignee">
                                                            {task.assignee ||
                                                                '담당자 미정'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="task-title">
                                                            {
                                                                task.title
                                                            }
                                                        </h3>

                                                        <p className="task-description">
                                                            {
                                                                task.description
                                                            }
                                                        </p>

                                                        <p className="task-due">
                                                            ~{' '}
                                                            {formatDueDate(
                                                                task.due
                                                            )}{' '}
                                                            (
                                                            {getDDay(
                                                                task.due
                                                            )}
                                                            )
                                                        </p>

                                                        <div className="card-top">
                                                            <p className="task-assignee">
                                                                담당자:{' '}
                                                                {
                                                                    task.assignee
                                                                }
                                                            </p>

                                                            <div className="card-actions">
                                                                <button
                                                                    type="button"
                                                                    className="delete-button"
                                                                    onClick={
                                                                        event => {
                                                                            event.stopPropagation();

                                                                            const shouldDelete =
                                                                                window.confirm(
                                                                                    '이 작업을 삭제하시겠습니까?'
                                                                                );

                                                                            if (
                                                                                shouldDelete
                                                                            ) {
                                                                                deleteTask(
                                                                                    task.id
                                                                                );
                                                                            }
                                                                        }
                                                                    }
                                                                    aria-label={`${task.title} 삭제`}
                                                                >
                                                                    <Trash2
                                                                        aria-hidden="true"
                                                                        strokeWidth={
                                                                            1.8
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="card-footer">
                                                            <span className="due">
                                                                ◷ 생성{' '}
                                                                {formatDateTime(
                                                                    task.createdAt
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="card-footer">
                                                            <span className="due">
                                                                ◷ 수정{' '}
                                                                {formatDateTime(
                                                                    task.updatedAt
                                                                )}
                                                                {' '}(
                                                                수정:{' '}
                                                                {task
                                                                        .updatedBy
                                                                        ?.name ||
                                                                    '알 수 없음'}
                                                                )
                                                            </span>
                                                        </div>
                                                    </>
                                                )}

                                                <button
                                                    type="button"
                                                    className="collapse-button"
                                                    onClick={
                                                        event => {
                                                            event.stopPropagation();

                                                            toggleTaskCollapsed(
                                                                task.id
                                                            );
                                                        }
                                                    }
                                                    aria-label={
                                                        isCollapsed
                                                            ? `${task.title} 펼치기`
                                                            : `${task.title} 접기`
                                                    }
                                                    aria-expanded={
                                                        !isCollapsed
                                                    }
                                                >
                                                    {isCollapsed
                                                        ? '+ 더보기'
                                                        : '- 접기'}
                                                </button>
                                            </article>
                                        );
                                    })}

                                    {items.length ===
                                        0 && (
                                            <div className="empty-state">
                                                작업이 없습니다.
                                            </div>
                                        )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </main>

            {isModalOpen && (
                <div
                    className="modal-backdrop"
                    onMouseDown={
                        closeTaskModal
                    }
                >
                    <form
                        className="modal"
                        onSubmit={saveTask}
                        onMouseDown={event => {
                            event.stopPropagation();

                            const clickedInsideTagSelect =
                                event.target.closest?.(
                                    '.tag-select-area'
                                );

                            if (!clickedInsideTagSelect) {
                                closeTagMenu();
                            }
                        }}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>
                                    {editingTaskId !==
                                    null
                                        ? '작업 편집'
                                        : '작업 추가'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeTaskModal
                                }
                                aria-label="닫기"
                            >
                                ×
                            </button>
                        </div>

                        <label>
                            작업 이름

                            <input
                                autoFocus
                                value={form.title}
                                onChange={event =>
                                    setForm(
                                        current => ({
                                            ...current,
                                            title:
                                            event
                                                .target
                                                .value
                                        })
                                    )
                                }
                                required
                            />
                        </label>

                        <label>
                            설명

                            <textarea
                                value={
                                    form.description
                                }
                                onChange={event =>
                                    setForm(
                                        current => ({
                                            ...current,
                                            description:
                                            event
                                                .target
                                                .value
                                        })
                                    )
                                }
                                placeholder="작업 내용 입력"
                                rows="4"
                            />
                        </label>

                        <div className="form-row">
                            <label>
                                상태

                                <select
                                    value={
                                        form.column
                                    }
                                    onChange={event =>
                                        setForm(
                                            current => ({
                                                ...current,
                                                column:
                                                event
                                                    .target
                                                    .value
                                            })
                                        )
                                    }
                                >
                                    {columns.map(
                                        column => (
                                            <option
                                                value={
                                                    column.id
                                                }
                                                key={
                                                    column.id
                                                }
                                            >
                                                {
                                                    column.title
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label>
                                분류

                                <div className="tag-select-area">
                                    <Select
                                        isMulti
                                        isSearchable={false}
                                        isClearable={false}
                                        value={tagOptions.filter(option =>
                                            form.tags.includes(
                                                option.value
                                            )
                                        )}
                                        options={tagOptions}
                                        onChange={selectedOptions => {
                                            setForm(current => ({
                                                ...current,
                                                tags: (
                                                    selectedOptions ?? []
                                                ).map(
                                                    option =>
                                                        option.value
                                                )
                                            }));
                                        }}
                                        components={{
                                            Option: TagOption,
                                            MenuList: TagMenuList,
                                            IndicatorSeparator: () =>
                                                null
                                        }}
                                        menuIsOpen={isTagMenuOpen}
                                        onMenuOpen={() =>
                                            setTagMenuOpen(true)
                                        }
                                        onMenuClose={closeTagMenu}
                                        deleteTag={deleteTag}
                                        newTagName={newTagName}
                                        setNewTagName={setNewTagName}
                                        setTagMenuOpen={setTagMenuOpen}
                                        setTagInputActive={active => {
                                            tagInputActiveRef.current =
                                                active;
                                        }}
                                        addTag={addTag}
                                        placeholder="태그 선택"
                                        noOptionsMessage={() =>
                                            '일치하는 태그가 없습니다'
                                        }
                                        closeMenuOnSelect={false}
                                        classNamePrefix="tag-select"
                                    />
                                </div>
                            </label>
                        </div>

                        <label>
                            담당자

                            <input
                                value={
                                    form.assignee
                                }
                                onChange={event =>
                                    setForm(
                                        current => ({
                                            ...current,
                                            assignee:
                                            event
                                                .target
                                                .value
                                        })
                                    )
                                }
                                placeholder="담당자 이름을 입력하세요"
                            />
                        </label>

                        <label>
                            마감일

                            <input
                                type="date"
                                value={form.due}
                                onChange={event =>
                                    setForm(
                                        current => ({
                                            ...current,
                                            due:
                                            event
                                                .target
                                                .value
                                        })
                                    )
                                }
                            />
                        </label>

                        <fieldset className="modal-checklist">
                            <div className="modal-checklist-header">
                                <span>
                                    체크리스트
                                </span>

                                <button
                                    type="button"
                                    className={`checklist-toggle ${
                                        isChecklistOpen
                                            ? 'open'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        setChecklistOpen(
                                            current =>
                                                !current
                                        )
                                    }
                                    aria-label={
                                        isChecklistOpen
                                            ? '체크리스트 접기'
                                            : '체크리스트 펼치기'
                                    }
                                    aria-expanded={
                                        isChecklistOpen
                                    }
                                >
                                    <span aria-hidden="true"/>
                                </button>
                            </div>

                            {isChecklistOpen && (
                                <div className="modal-checklist-content">
                                    <div className="modal-checklist-items">
                                        {form.checklist.map(
                                            item => (
                                                <div
                                                    className="modal-checklist-item"
                                                    key={
                                                        item.id
                                                    }
                                                >
                                                    <input
                                                        className="checklist-checkbox"
                                                        type="checkbox"
                                                        checked={
                                                            item.completed
                                                        }
                                                        onChange={() =>
                                                            toggleChecklistItem(
                                                                item.id
                                                            )
                                                        }
                                                        aria-label={`${item.text} 완료 여부`}
                                                    />

                                                    <input
                                                        className={
                                                            item.completed
                                                                ? 'checklist-text completed'
                                                                : 'checklist-text'
                                                        }
                                                        type="text"
                                                        value={
                                                            item.text
                                                        }
                                                        onChange={
                                                            event =>
                                                                updateChecklistItem(
                                                                    item.id,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                        }
                                                        onBlur={() =>
                                                            removeEmptyChecklistItem(
                                                                item.id
                                                            )
                                                        }
                                                        onKeyDown={
                                                            event => {
                                                                if (
                                                                    event.key ===
                                                                    'Enter'
                                                                ) {
                                                                    event.preventDefault();

                                                                    const nextInput =
                                                                        event.currentTarget
                                                                            .closest(
                                                                                '.modal-checklist-item'
                                                                            )
                                                                            ?.nextElementSibling
                                                                            ?.querySelector(
                                                                                'input[type="text"]'
                                                                            );

                                                                    nextInput?.focus();
                                                                }
                                                            }
                                                        }
                                                        placeholder="체크리스트 항목"
                                                    />

                                                    <button
                                                        type="button"
                                                        className="checklist-delete"
                                                        onClick={() =>
                                                            deleteChecklistItem(
                                                                item.id
                                                            )
                                                        }
                                                        aria-label={`${item.text} 삭제`}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        )}

                                        <div className="modal-checklist-item checklist-new-item">
                                            <span
                                                className="checklist-add-icon"
                                                aria-hidden="true"
                                            >
                                                ＋
                                            </span>

                                            <input
                                                type="text"
                                                className="checklist-text"
                                                value={
                                                    checklistInput
                                                }
                                                onChange={
                                                    event =>
                                                        setChecklistInput(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                }
                                                onKeyDown={
                                                    event => {
                                                        if (
                                                            event.key ===
                                                            'Enter' &&
                                                            !event
                                                                .nativeEvent
                                                                .isComposing
                                                        ) {
                                                            event.preventDefault();
                                                            addChecklistItem();
                                                        }
                                                    }
                                                }
                                                onBlur={() => {
                                                    if (
                                                        checklistInput.trim()
                                                    ) {
                                                        addChecklistItem();
                                                    }
                                                }}
                                                placeholder="항목 추가"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </fieldset>

                        <div className="modal-actions">
                            {saveError && (
                                <p className="modal-error" role="alert">
                                    {saveError}
                                </p>
                            )}

                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={
                                    closeTaskModal
                                }
                            >
                                취소
                            </button>

                            <button
                                className="primary-button"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? '저장 중...'
                                    : editingTaskId !== null
                                    ? '변경사항 저장'
                                    : '작업 만들기'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default App;



//정렬, 필터링, 컴포넌트가 3개 이상 넘어갔을 때 스크롤될 수 잇게
//옆 보드로 끌었을 때 동시에 위치 바꿀 수 있게, 컬럼에 담당자, 로그/생성 및 수정일자, 필터/정렬 열었을 때 안 겹치게, 정렬에 초기화 버튼

//카드 접을 수 있게(최소한의 정보만 보이도록, 인디케이터), 분류 추가하거나 관리할 수 있게 -> 해당 분류에 포함되는 작업이 하나라도 남아 있을 때 삭제하겠냐고 물어보는 팝업
//인디케이터 -> 한번에 접었다 펼 수 있는 것? 접힌 것의 개수? => 접었다폈다인듯
//분류는 관리할수 있게.. 복수로 설정할 수 있게 하는건?
//https://reveur1996.tistory.com/108
//https://next-ui-components-guide.vercel.app/

//더보기 버튼 아래로, 디데이 컴포넌트 만들어서 태그 옆에 생성(색 지정)
//IndicatorSeparator,isclearable, creatable select

// overflow-y: auto;
// scrollbar-width: none; //스크롤바 안보이게


//https://wikidocs.net/249309


//기본적인 디자인 말고 컴포넌트를 따로 디자인해보기..
//=> 디자인을 더 신경쓰는 게 좋지 않을까?
//접었을 때 담당자 이름도 보이게
//접었는데 작업 이름이 긴 경우 -> ... 생략 가능하게
