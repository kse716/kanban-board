import React, {useState} from 'react';
import './App.css';

function Signup({onBack, onLogin}) {
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [message, setMessage] = useState(null);

    const handleSubmit = event => {
        event.preventDefault();

        if (password.length < 8) {
            setMessage({
                type: 'error',
                text: '비밀번호는 8자 이상 입력해 주세요.'
            });
            return;
        }

        if (password !== passwordConfirm) {
            setMessage({
                type: 'error',
                text: '비밀번호와 비밀번호 확인이 일치하지 않습니다.'
            });
            return;
        }

        setMessage({
            type: 'success',
            text: '입력 확인이 완료되었습니다. 회원가입 API를 연결하면 계정이 생성됩니다.'
        });
    };

    return (
        <main className="login-page">
            <section className="login-panel">
                <button className="login-back" type="button" onClick={onBack}>
                    ← 보드로 돌아가기
                </button>

                <div className="login-heading">
                    <h1>회원가입</h1>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label>
                        이름
                        <input
                            type="text"
                            placeholder="이름을 입력하세요"
                            autoComplete="name"
                            required
                        />
                    </label>

                    <label>
                        이메일
                        <input
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        비밀번호
                        <input
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            placeholder="8자 이상 입력하세요"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </label>

                    <label>
                        비밀번호 확인
                        <input
                            type="password"
                            value={passwordConfirm}
                            onChange={event => setPasswordConfirm(event.target.value)}
                            placeholder="비밀번호를 다시 입력하세요"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </label>

                    {message && (
                        <p className={`auth-message ${message.type}`} role="status">
                            {message.text}
                        </p>
                    )}

                    <button className="login-button" type="submit">
                        회원가입
                    </button>

                    <button
                        className="auth-secondary-button"
                        type="button"
                        onClick={onLogin}
                    >
                        이미 계정이 있나요? 로그인
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Signup;
