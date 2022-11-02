import axios from 'axios';
import Cookies from 'js-cookie';
export async function AxiosGetRequest(url, token = false, addParams) {
    const options = {}
    if (token) options.token = token
    return await axios.get("http://localhost:8000/" + url, {
        params: { ...options, ...addParams },

    })
}
export async function AxiosPostRequest(url, addParams) {
    const options = {}
    if (Cookies.get('token')) options.token = Cookies.get('token')
    return await axios.post("http://localhost:8000/" + url,
        { ...options, ...addParams },

    )
}