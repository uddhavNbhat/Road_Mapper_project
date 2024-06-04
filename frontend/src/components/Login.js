import axios from "axios";
import { useRef, useState } from "react";
import "./login.css";

export default function Login({ setShowLogin, setCurrentUser, myStorage }) {
  const [error, setError] = useState(false);
  const usernameRef = useRef();
  const passwordRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = {
      username: usernameRef.current.value,
      password: passwordRef.current.value,
    };
    try {
      const res = await axios.post("http://localhost:4050/userController/login", user);
      myStorage.setItem('token', res.data.token);
      myStorage.setItem('user', res.data.username); // Store the username in local storage
      setCurrentUser(res.data.username);
      setShowLogin(false);
    } catch (err) {
      setError(true);
      console.log(err);
    }
  };

  return (
    <div className="loginContainer">
      <div className="logo">
        Login
      </div>
      <form onSubmit={handleSubmit}>
        <input autoFocus placeholder="username" ref={usernameRef} />
        <input
          type="password"
          min="6"
          placeholder="password"
          ref={passwordRef}
        />
        <button className="loginBtn" type="submit">
          Login
        </button>
        {error && <span className="failure">Something went wrong!</span>}
      </form>
      <button type="button" onClick={() => setShowLogin(false)}>Cancel</button>
    </div>
  );
}
