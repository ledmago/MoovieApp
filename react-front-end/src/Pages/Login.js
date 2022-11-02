
import '../App.css';
import './Login.css';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { AxiosGetRequest, AxiosPostRequest } from "../helpers/Request";
function Login() {
    const [isError, setIsError] = useState(false)
    const [warningMessageText, setWarningMessageText] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const { email, password } = formData;
    const onLogin = async (e) => {
        AxiosPostRequest("api/auth/login", { email, password }).then(({ data }) => {
            if (data.token) {
                Cookies.set("token", data.token);
                localStorage.setItem('user', JSON.stringify({ ...data.user, genres: data.genres }));
                window.location.reload();
            }
            else {
                setWarningMessageText("Email or password is wrong")
                setIsError(true)
            }

        })
            .catch((er) => {
                setWarningMessageText("Email or password is wrong")
                setIsError(true)
            })


    }


    return (
        <div className='login-wrapper background'>
            ads
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Login</h5>
                    {isError && <div className='warning-message'>{warningMessageText}</div>}
                    <input class="form-control form-control-l" name="email" value={email} type="text" placeholder="Email adress" onChange={handleChange}></input>
                    <input class="form-control form-control-l" type="password" value={password} name="password" placeholder="Password" onChange={handleChange}></input>
                    <div className="button btn btn-danger" onClick={() => onLogin()}>Login</div>
                    <a href="register" className='register-link'>New User ? Register Here</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
