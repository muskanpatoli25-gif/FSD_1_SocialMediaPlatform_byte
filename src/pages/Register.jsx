
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
       `${API_URL}/api/auth/register`,
        {
          name: name.trim(),
          username: username.trim().replace(/^@/, ""),
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      login(token, user);
      navigate("/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-new">
      {/* Left Brand Panel */}
      <div className="auth-brand-panel-new">
        <Link to="/" className="auth-new-logo">
          <span className="auth-new-logo-mark">L</span>
          <span>LINKUP</span>
        </Link>

        <div className="auth-brand-content-new">
          <span className="auth-eyebrow">JOIN LINKUP</span>

          <h1>
            Create your space.
            <br />
            <span>Connect with others.</span>
          </h1>

          <p>
            Build your profile, share your thoughts, discover new
            conversations, and connect with people who share your interests.
          </p>
        </div>

        <div className="auth-brand-footer-new">
          <span>✦</span>
          Your community starts here.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel-new">
        <div className="auth-form-container-new">
          <div className="mobile-auth-logo-new">
            <Link to="/" className="auth-new-logo">
              <span className="auth-new-logo-mark">L</span>
              <span>LINKUP</span>
            </Link>
          </div>

          <div className="auth-heading-new">
            <span>GET STARTED</span>

            <h2>Create your account</h2>

            <p>
              Join LINKUP and start connecting with your community.
            </p>
          </div>

          <form className="auth-form-new" onSubmit={handleSubmit}>
            <div className="auth-field-new">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field-new">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field-new">
              <label htmlFor="register-email">Email address</label>

              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field-new">
              <label htmlFor="register-password">Password</label>

              <input
                id="register-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <label className="auth-checkbox-new">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />

              <span>
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>

            {error && (
              <p role="alert" style={{ color: "#c62828" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-new"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider-new">
            <span></span>
            <small>OR</small>
            <span></span>
          </div>

          <button type="button" className="google-button-new">
            <span>G</span>
            Continue with Google
          </button>

          <p className="auth-switch-new">
            Already have an account?
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
