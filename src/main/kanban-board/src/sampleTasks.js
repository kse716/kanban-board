const sampleTasks = [
    {
        id: 1786287600001,
        column: 'todo',
        title: '사용자 인터뷰 질문 정리',
        description: '신규 사용자의 온보딩 경험을 확인할 질문을 정리합니다.',
        tag: '기획',
        color: 'blue',
        assignee: '김민지',
        due: '2026-08-12',
        createdAt: '2026-08-07T01:30:00.000Z',
        updatedAt: '2026-08-07T01:30:00.000Z'
    },
    {
        id: 1786287600002,
        column: 'todo',
        title: '알림 정책 초안 작성',
        description: '이메일과 서비스 내 알림의 발송 조건을 정의합니다.',
        tag: '운영',
        color: 'orange',
        assignee: '박서준',
        due: '2026-08-14',
        createdAt: '2026-08-07T03:10:00.000Z',
        updatedAt: '2026-08-08T02:20:00.000Z'
    },
    {
        id: 1786287600003,
        column: 'progress',
        title: '대시보드 와이어프레임',
        description: '핵심 지표를 빠르게 파악할 수 있도록 화면 구조를 설계합니다.',
        tag: '디자인',
        color: 'pink',
        assignee: '이서연',
        due: '2026-08-11',
        createdAt: '2026-08-06T05:00:00.000Z',
        updatedAt: '2026-08-10T00:40:00.000Z'
    },
    {
        id: 1786287600004,
        column: 'progress',
        title: '검색 기능 구현',
        description: '제목, 설명, 담당자를 기준으로 카드를 검색할 수 있게 만듭니다.',
        tag: '개발',
        color: 'green',
        assignee: '최도윤',
        due: '2026-08-13',
        createdAt: '2026-08-08T02:15:00.000Z',
        updatedAt: '2026-08-10T01:05:00.000Z'
    },
    {
        id: 1786287600005,
        column: 'review',
        title: '모바일 반응형 검토',
        description: '모바일 화면에서 보드와 팝업이 자연스럽게 표시되는지 확인합니다.',
        tag: '디자인',
        color: 'purple',
        assignee: '정하린',
        due: '2026-08-10',
        createdAt: '2026-08-05T07:20:00.000Z',
        updatedAt: '2026-08-09T06:45:00.000Z'
    },
    {
        id: 1786287600006,
        column: 'review',
        title: '카드 편집 기능 테스트',
        description: '작업 생성과 수정 결과가 로컬 스토리지에 정상 저장되는지 확인합니다.',
        tag: '개발',
        color: 'green',
        assignee: '김민지',
        due: '2026-08-11',
        createdAt: '2026-08-08T04:30:00.000Z',
        updatedAt: '2026-08-10T02:00:00.000Z'
    },
    {
        id: 1786287600007,
        column: 'done',
        title: '프로젝트 킥오프',
        description: '프로젝트 목표와 일정, 담당 역할을 팀에 공유했습니다.',
        tag: '운영',
        color: 'gray',
        assignee: '박서준',
        due: '2026-08-05',
        createdAt: '2026-08-04T00:30:00.000Z',
        updatedAt: '2026-08-05T08:10:00.000Z'
    },
    {
        id: 1786287600008,
        column: 'done',
        title: '칸반보드 기본 레이아웃',
        description: '할 일, 진행 중, 검토, 완료 칼럼의 기본 화면을 완성했습니다.',
        tag: '개발',
        color: 'blue',
        assignee: '최도윤',
        due: '2026-08-07',
        createdAt: '2026-08-04T02:00:00.000Z',
        updatedAt: '2026-08-07T07:30:00.000Z'
    }
];

export default sampleTasks;
