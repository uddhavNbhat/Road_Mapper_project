
import axios from "axios";
import { useRef, useState } from "react";
import "./register.css";

export default function Register({ setShowRegister }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const usernameRef = useRef();
  const passwordRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUser = {
      username: usernameRef.current.value,
      password: passwordRef.current.value,
    };

    try {
      await axios.post("http://localhost:4050/userController/signup", newUser);
      setError(false);
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  };
  return (
    <div className="registerContainer">
      <div className="logo">
        Register
      </div>
      <form onSubmit={handleSubmit}>
        <input autoFocus placeholder="username" ref={usernameRef} />
        <input
          type="password"
          min="6"
          placeholder="password"
          ref={passwordRef}
        />
        <button className="registerBtn" type="submit">
          Register
        </button>
        {success && (
          <span className="success">Successfull. You can login now!</span>
        )}
        {error && <span className="failure">Something went wrong!</span>}
      </form>
      <button type="button" onClick={() => setShowRegister(false)}>Cancel</button>
    </div>
  );
}