
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      const { token, user } = response.data;

      login(token, user);
      navigate("/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-new">
      <div className="auth-brand-panel-new">
        <Link to="/" className="auth-new-logo">
          <span className="auth-new-logo-mark">L</span>
          <span>LINKUP</span>
        </Link>

        <div className="auth-brand-content-new">
          <span className="auth-eyebrow">WELCOME BACK</span>

          <h1>
            Stay connected.
            <br />
            <span>Stay in the loop.</span>
          </h1>

          <p>
            Continue your conversations, discover new ideas,
            and stay connected with the people and topics you care
            about.
          </p>
        </div>

        <div className="auth-brand-footer-new">
          <span>✦</span>
          Your conversations are waiting for you.
        </div>
      </div>

      <div className="auth-form-panel-new">
        <div className="auth-form-container-new">
          <div className="mobile-auth-logo-new">
            <Link to="/" className="auth-new-logo">
              <span className="auth-new-logo-mark">L</span>
              <span>LINKUP</span>
            </Link>
          </div>

          <div className="auth-heading-new">
            <span>WELCOME BACK</span>
            <h2>Log in to your account</h2>
            <p>Enter your details to continue to LINKUP.</p>
          </div>

          <form className="auth-form-new" onSubmit={handleSubmit}>
            <div className="auth-field-new">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field-new">
              <div className="auth-label-row-new">
                <label htmlFor="password">Password</label>

                <button type="button">
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <label className="auth-checkbox-new">
              <input type="checkbox" />
              <span>Remember me</span>
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
              {loading ? "Logging in..." : "Log in"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider-new">
            <span></span>
            <small>OR</small>
            <span></span>
          </div>

          <button
            type="button"
            className="google-button-new"
          >
            <span>G</span>
            Continue with Google
          </button>

          <p className="auth-switch-new">
            Don't have an account?
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
