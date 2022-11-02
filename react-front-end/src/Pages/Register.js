
import '../App.css';
import './Login.css';
import React, { useState } from 'react';
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
    const { email, password, firstName, lastName } = formData;

    const onRegister = async (e) => {
        AxiosPostRequest("api/auth/register", { email, password, firstName, lastName }).then(({ data }) => {
            if (data.token) {
                Cookies.set("token", data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/'
            }
            else {
                setWarningMessageText(data.message)
                setIsError(true)
            }

        })
            .catch((er) => {
                setWarningMessageText("Please fill empty fileds")
                setIsError(true)
            })


    }

    return (
        <div className='login-wrapper background'>
            ads
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Register</h5>
                    {isError && <div className='warning-message'>{warningMessageText}</div>}
                    <input class="form-control form-control-l" type="text" placeholder="Email adress" name="email" onChange={handleChange}></input>
                    <input class="form-control form-control-l" type="password" placeholder="Password" name="password" onChange={handleChange}></input>
                    <input class="form-control form-control-l" type="text" placeholder="First Name" name="firstName" onChange={handleChange}></input>
                    <input class="form-control form-control-l" type="text" placeholder="Last Name" name="lastName" onChange={handleChange}></input>

                    <a href="#" className="button btn btn-danger" onClick={onRegister}>Register</a>
                    <a className='register-link' href="/">Already registered ? Login Here</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
