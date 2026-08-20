import React, {useState} from 'react';
import {Check, ChevronLeft, ChevronRight, FolderKanban, Pencil, Plus, Trash2, X} from 'lucide-react';
import './ProjectSidebar.css';

const namedColors = {
    blue: '#315bea', lavender: '#8b74e8', mint: '#38a878', peach: '#e8904f'
};

const resolveColor = color => namedColors[color] || color || '#315bea';

function ProjectSidebar({
    user,
    projects,
    selectedProjectId,
    onSelect,
    onCreate,
    onRename,
    onDelete,
    collapsed,
    onToggle
}) {
    const [isCreating, setCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);
    const userName = user?.name || '사용자';
    const userId = user?.id || 'ID 미지정';

    const toggleSidebar = () => {
        if (!collapsed) {
            setCreating(false);
            setNewProjectName('');
            setEditingId(null);
            setEditingName('');
        }

        onToggle();
    };

    const openCreateForm = () => {
        if (collapsed) {
            onToggle();
        }

        setCreating(true);
    };

    const submitNewProject = async event => {
        event.preventDefault();
        const name = newProjectName.trim();
        if (!name) return;

        setSubmitting(true);
        const created = await onCreate(name);
        setSubmitting(false);

        if (created) {
            setNewProjectName('');
            setCreating(false);
        }
    };

    const submitRename = async (event, project) => {
        event.preventDefault();
        const name = editingName.trim();
        if (!name) return;

        setSubmitting(true);
        const updated = await onRename(project, name);
        setSubmitting(false);

        if (updated) {
            setEditingId(null);
            setEditingName('');
        }
    };

    return (
        <aside id="project-sidebar" className={`project-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-brand">
                <span className="sidebar-brand-mark" aria-hidden="true">
                    {userName.charAt(0).toUpperCase()}
                </span>
                <div className="sidebar-brand-copy">
                    <strong title={userName}>{userName}</strong>
                    <small title={String(userId)}>{userId}</small>
                </div>
                <button
                    className="sidebar-toggle"
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
                    aria-expanded={!collapsed}
                    title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
                >
                    {collapsed
                        ? <ChevronRight aria-hidden="true" size={17}/>
                        : <ChevronLeft aria-hidden="true" size={17}/>
                    }
                </button>
            </div>

            <div className="project-section-heading">
                <span>프로젝트</span>
                <button type="button" onClick={openCreateForm} aria-label="새 프로젝트 만들기">
                    <Plus aria-hidden="true" size={16}/>
                </button>
            </div>

            {isCreating && (
                <form className="project-inline-form" onSubmit={submitNewProject}>
                    <input autoFocus value={newProjectName}
                           onChange={event => setNewProjectName(event.target.value)}
                           placeholder="프로젝트 이름" maxLength={100}/>
                    <button type="submit" disabled={isSubmitting || !newProjectName.trim()}
                            aria-label="프로젝트 추가"><Check aria-hidden="true" size={15}/></button>
                    <button type="button" onClick={() => { setCreating(false); setNewProjectName(''); }}
                            aria-label="프로젝트 추가 취소"><X aria-hidden="true" size={15}/></button>
                </form>
            )}

            <nav className="project-list" aria-label="프로젝트 목록">
                {projects.map(project => {
                    const isSelected = project.id === selectedProjectId;

                    if (project.id === editingId) {
                        return (
                            <form className="project-inline-form" key={project.id}
                                  onSubmit={event => submitRename(event, project)}>
                                <input autoFocus value={editingName}
                                       onChange={event => setEditingName(event.target.value)} maxLength={100}/>
                                <button type="submit" disabled={isSubmitting || !editingName.trim()}
                                        aria-label="프로젝트 이름 저장"><Check aria-hidden="true" size={15}/></button>
                                <button type="button" onClick={() => setEditingId(null)}
                                        aria-label="프로젝트 이름 변경 취소"><X aria-hidden="true" size={15}/></button>
                            </form>
                        );
                    }

                    return (
                        <div className={`project-item ${isSelected ? 'active' : ''}`} key={project.id}>
                            <button className="project-select-button" type="button"
                                    onClick={() => onSelect(project.id)}
                                    title={collapsed ? project.name : undefined}
                                    aria-current={isSelected ? 'page' : undefined}>
                                <span className="project-color" style={{background: resolveColor(project.color)}}/>
                                <FolderKanban aria-hidden="true" size={16}/>
                                <span className="project-name">{project.name}</span>
                                <span className="project-count">{project.taskCount ?? 0}</span>
                            </button>
                            <div className="project-item-actions">
                                <button type="button" onClick={() => {
                                    setEditingId(project.id);
                                    setEditingName(project.name);
                                }} aria-label={`${project.name} 이름 변경`}>
                                    <Pencil aria-hidden="true" size={13}/>
                                </button>
                                <button type="button" onClick={() => onDelete(project)}
                                        aria-label={`${project.name} 삭제`}>
                                    <Trash2 aria-hidden="true" size={13}/>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {projects.length === 0 && <p className="project-empty-message">프로젝트를 만들어 작업을 시작하세요.</p>}
        </aside>
    );
}

export default ProjectSidebar;
