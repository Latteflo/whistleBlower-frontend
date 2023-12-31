import React, { useState } from "react"
import "./styles/style.css"
import { useAuth } from "../AuthContext/AuthContext"
import Accordion from "../register/Accordion"
import { useNavigate } from "react-router"

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const navigate = useNavigate()
  const { setToken, setUserId, setUserRoleId, setUserRole, setUsername } = useAuth(); 
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedbackMessage("Logging in...")

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }

    try {
      const response = await fetch(
        "https://whistle-blower-server.vercel.app/users/login",
        requestOptions
      )
      const data = await response.json()

      if (response.ok) {
        if (data.token && data.user && data.user.id) {
          console.log("Login successful")
          setToken(data.token)
          setUserId(data.user.id)
          setUserRoleId(data.user.id)
          sessionStorage.setItem("token", data.token); 
          sessionStorage.setItem("userId", data.user.id)
          sessionStorage.setItem("role", data.user.role)
          sessionStorage.setItem("userRoleId", data.user.id)
          setFeedbackMessage("Login successful! Redirecting...")
          const userRole = data.user?.role || "client"
          setUserRole(userRole)
          const username = data.user?.username || ""; 
          setUsername(username);
          sessionStorage.setItem("username", username);
          if (userRole === "admin") {
            navigate("/dashboard/admin")
          } else {
            navigate("/dashboard/client")
          }
        }
      } else {
        switch (response.status) {
          case 400:
            setFeedbackMessage("Invalid username or password.")
            break
          case 401:
            setFeedbackMessage("Unauthorized. Please check your credentials.")
            break
          case 500:
            setFeedbackMessage("Internal Server Error. Please try again later.")
            break
          default:
            setFeedbackMessage(
              `Server returned ${response.status}: ${response.statusText}`
            )
        }
      }
    } catch (error) {
      setFeedbackMessage("An error occurred during login.")
      console.error("Login error:", error)
    }
  }

  return (
    <section className="registerBody">
      <div className="registerLeft">
        <Accordion />
      </div>
      <div className="register-right">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="userSection">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="passwordSection">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="redirect-to-login">
          <p>
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")} className="register">
              Register
            </span>
          </p>
        </div>{" "}
        <div className="feedbackMessage">{feedbackMessage}</div>
      </div>{" "}
    </section>
  )
}

export default Login
