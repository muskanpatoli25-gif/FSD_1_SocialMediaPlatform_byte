
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [profileUser, setProfileUser] = useState(user);

  // AuthContext mein user change ho to navbar update ho
  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  // Backend se logged-in user ka latest profile data lo
  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      if (!token) {
        setProfileUser(null);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const freshUser = response.data?.user;

        if (freshUser && isMounted) {
          setProfileUser(freshUser);
          localStorage.setItem(
            "linkup_user",
            JSON.stringify(freshUser)
          );
        }
      } catch (error) {
        console.error(
          "Unable to fetch navbar user:",
          error.response?.data || error.message
        );
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const userName =
    profileUser?.name ||
    profileUser?.username ||
    "LINKUP User";

  const username = profileUser?.username || "user";
  const profileImage = profileUser?.profileImage || "";
  const userInitial = userName.charAt(0).toUpperCase();

  const mainMenu = [
    { label: "Home", path: "/home", icon: "⌂" },
    { label: "Notifications", path: "/notifications", icon: "♡" },
    { label: "Messages", path: "/messages", icon: "✉" },
  ];

  const bottomMenu = [
    { label: "Profile", path: "/profile", icon: "○" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("linkup_token");
    localStorage.removeItem("linkup_user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <>
      <aside className="shared-sidebar">
        {/* Logo */}
        <Link to="/" className="shared-logo">
          <span className="shared-logo-mark">L</span>
          <span>LINKUP</span>
        </Link>

        {/* Main Menu */}
        <nav className="shared-nav">
          {mainMenu.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `shared-nav-link ${
                  isActive ? "shared-nav-link-active" : ""
                }`
              }
            >
              <span className="shared-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Create Post */}
        <Link to="/create-post" className="shared-create-button">
          <span>＋</span>
          <span>Create Post</span>
        </Link>

        {/* Bottom Menu */}
        <div className="shared-bottom-menu">
          {bottomMenu.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `shared-nav-link ${
                  isActive ? "shared-nav-link-active" : ""
                }`
              }
            >
              <span className="shared-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Logout */}
          <button
            type="button"
            className="shared-nav-link shared-logout-button"
            onClick={handleLogout}
          >
            <span className="shared-nav-icon">↪</span>
            <span>Logout</span>
          </button>

          {/* Logged-in User Profile */}
          <Link to="/profile" className="shared-user">
            <div className="shared-user-avatar">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  className="shared-user-avatar-image"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                userInitial
              )}
            </div>

            <div className="shared-user-info">
              <strong>{userName}</strong>
              <span>@{username}</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <nav className="shared-mobile-nav">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `shared-mobile-link ${
              isActive ? "shared-mobile-link-active" : ""
            }`
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `shared-mobile-link ${
              isActive ? "shared-mobile-link-active" : ""
            }`
          }
        >
          <span>♡</span>
          <small>notification</small>
        </NavLink>

        <Link to="/create-post" className="shared-mobile-create">
          ＋
        </Link>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `shared-mobile-link ${
              isActive ? "shared-mobile-link-active" : ""
            }`
          }
        >
          <span>✉</span>
          <small>Messages</small>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `shared-mobile-link ${
              isActive ? "shared-mobile-link-active" : ""
            }`
          }
        >
          <span>○</span>
          <small>Profile</small>
        </NavLink>
        <button
  type="button"
  className="shared-mobile-link shared-mobile-logout"
  onClick={handleLogout}
>
  <span>↪</span>
  <small>Logout</small>
</button>
      </nav>
    </>
  );
}

export default Navbar;
