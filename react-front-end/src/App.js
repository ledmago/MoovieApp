
import './App.css';
import Login from './Pages/Login';
import Home from './Pages/Home';
import Register from './Pages/Register';
import { Routes, Route, } from "react-router-dom";
import Cookies from 'js-cookie';
function App() {
  if (!Cookies.get("token"))
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    )
  else {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    )
  }
}

export default App;
