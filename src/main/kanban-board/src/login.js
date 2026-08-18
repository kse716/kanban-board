import React from 'react';
import './App.css';

function Login({onBack}) {
    const handleSubmit = event => {
        event.preventDefault();
    };

    return (
        <main className="login-page">
            <section className="login-panel">
                <button className="login-back" type="button" onClick={onBack}>← 보드로 돌아가기</button>
                <div className="login-heading">
                    <h1>로그인</h1>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <label>
                        이메일
                        <input type="email" placeholder="name@example.com" autoComplete="email" required/>
                    </label>
                    <label>
                        비밀번호
                        <input type="password" placeholder="비밀번호를 입력하세요" autoComplete="current-password" required/>
                    </label>
                    <button className="login-button" type="submit">로그인</button>
                </form>
            </section>
        </main>
    );
}

export default Login;
