import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import API_URL from "../api";


const API = API_URL + "";

function Icon({ type, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "message":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "like":
      return (
        <svg {...common}>
          <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />
        </svg>
      );
    case "comment":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-4-.9L3 20l1.3-4.2a8 8 0 0 1-1.3-4.3 8.5 8.5 0 0 1 9-8.1 8.4 8.4 0 0 1 9 8.1Z" />
        </svg>
      );
    case "new_post":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5m0-8h.01" />
        </svg>
      );
  }
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);

  const token = localStorage.getItem("linkup_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchNotifications = async () => {
    try {
      setError("");
      const response = await axios.get(`${API}/api/notifications`, {
        headers,
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError(
        err.response?.data?.message ||
          "Notifications load nahi ho sakin. Please login again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const allSelected =
    notifications.length > 0 &&
    notifications.every((item) => selectedIds.includes(item._id));

  const toggleSelected = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((itemId) => itemId !== id)
        : [...previous, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      allSelected ? [] : notifications.map((item) => item._id)
    );
  };

  const markAllAsRead = async () => {
    if (busy || unreadCount === 0) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await axios.patch(
        `${API}/api/notifications/read-all`,
        {},
        { headers }
      );

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, read: true }))
      );
      setUnreadCount(0);
      setNotice("All notifications marked as read.");
    } catch (err) {
      console.error("Mark all as read error:", err);
      setError(
        err.response?.data?.message ||
          "Notifications update nahi ho sakin."
      );
    } finally {
      setBusy(false);
    }
  };

  const markOneAsRead = async (notification) => {
    if (notification.read) return;

    try {
      await axios.patch(
        `${API}/api/notifications/${notification._id}/read`,
        {},
        { headers }
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, read: true }
            : item
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error("Mark notification as read error:", err);
    }
  };

  const deleteOne = async (id) => {
    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await axios.delete(`${API}/api/notifications/${id}`, {
        headers,
      });

      const deleted = notifications.find((item) => item._id === id);

      setNotifications((previous) =>
        previous.filter((item) => item._id !== id)
      );
      setSelectedIds((previous) => previous.filter((itemId) => itemId !== id));

      if (deleted && !deleted.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setNotice("Notification deleted.");
    } catch (err) {
      console.error("Delete notification error:", err);
      setError(
        err.response?.data?.message || "Notification delete nahi hui."
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (busy || selectedIds.length === 0) return;

    if (!window.confirm(`Delete ${selectedIds.length} selected notification(s)?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await axios.delete(`${API}/api/notifications/bulk`, {
        headers,
        data: { ids: selectedIds },
      });

      const selectedSet = new Set(selectedIds);
      const unreadDeleted = notifications.filter(
        (item) => selectedSet.has(item._id) && !item.read
      ).length;

      setNotifications((previous) =>
        previous.filter((item) => !selectedSet.has(item._id))
      );
      setUnreadCount((count) => Math.max(0, count - unreadDeleted));
      setSelectedIds([]);
      setNotice("Selected notifications deleted.");
    } catch (err) {
      console.error("Delete selected notifications error:", err);
      setError(
        err.response?.data?.message ||
          "Selected notifications delete nahi huin."
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    if (busy || notifications.length === 0) return;

    if (!window.confirm("Are you sure you want to delete ALL notifications?")) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await axios.delete(`${API}/api/notifications/all`, { headers });

      setNotifications([]);
      setSelectedIds([]);
      setUnreadCount(0);
      setNotice("All notifications deleted.");
    } catch (err) {
      console.error("Delete all notifications error:", err);
      setError(
        err.response?.data?.message ||
          "Notifications delete nahi ho sakin."
      );
    } finally {
      setBusy(false);
    }
  };

  const getAction = (type) => {
    switch (type) {
      case "new_post":
        return "published a new post.";
      case "like":
        return "liked your post.";
      case "comment":
        return "commented on your post.";
      case "message":
        return "sent you a message.";
      default:
        return "interacted with you.";
    }
  };

  const getDestination = (notification) => {
    if (notification.type === "message") {
      return "/messages";
    }

    if (notification.post?._id) {
      return `/post/${notification.post._id}`;
    }

    return "/notifications";
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="notifications-page">
        <div className="notifications-header">
          <div>
            <span className="section-label">STAY UPDATED</span>
            <h1>Notifications</h1>
            <p>See what's happening around your LINKUP account.</p>
          </div>

          <button
            type="button"
            className="mark-read-button"
            onClick={markAllAsRead}
            disabled={busy || unreadCount === 0 || loading}
          >
            <Icon type="check" size={16} />
            Mark all as read
          </button>
        </div>

        {error && (
          <p className="notification-status" role="alert">
            {error}
          </p>
        )}

        {notice && (
          <p className="notification-notice" role="status">
            {notice}
          </p>
        )}

        <section className="notifications-card">
          <div className="notifications-card-header">
            <h2>Recent activity</h2>
            <span>{unreadCount} unread</span>
          </div>

          {!loading && notifications.length > 0 && (
            <div className="notification-toolbar">
              <button
  type="button"
  className="notification-select-all"
  onClick={() => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds([]);
    } else {
      setSelectionMode(true);
    }
  }}
  disabled={busy}
>
  {selectionMode ? "Cancel selection" : "Select notifications"}
</button>

{selectionMode && (
  <label>
    <input
      type="checkbox"
      checked={allSelected}
      onChange={toggleSelectAll}
      disabled={busy}
    />
    Select all
  </label>
)}

              <div className="notification-toolbar-actions">
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={busy || selectedIds.length === 0}
                >
                  <Icon type="trash" size={16} />
                  Delete selected ({selectedIds.length})
                </button>

                <button
                  type="button"
                  className="notification-delete-all"
                  onClick={deleteAll}
                  disabled={busy}
                >
                  <Icon type="trash" size={16} />
                  Delete all
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="notification-status">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="notification-status">
              <p>No notifications yet.</p>
              <span>When someone interacts with you, it will appear here.</span>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => {
                const sender = notification.sender;
                console.log("Notification sender:", sender);
console.log("Profile image:", sender?.profileImage);
                const senderName =
                  sender?.name || sender?.username || "Someone";
                const initial = senderName.charAt(0).toUpperCase();

                return (
                  <div
                    key={notification._id}
                    className={`notification-item ${
                      notification.read ? "" : "notification-unread"
                    }`}
                  >
                    {selectionMode && (
  <input
    className="notification-checkbox"
    type="checkbox"
    aria-label={`Select notification from ${senderName}`}
    checked={selectedIds.includes(notification._id)}
    onChange={() => toggleSelected(notification._id)}
    disabled={busy}
  />
)}

                    <div className="notification-avatar">
                      {sender?.profileImage ? (
                       <img
  src={
    sender.profileImage.startsWith("data:image/") ||
    sender.profileImage.startsWith("http://") ||
    sender.profileImage.startsWith("https://")
      ? sender.profileImage
      : `${API}${sender.profileImage}`
  }
  alt={senderName}
  onError={(e) => {
    console.error("Profile image failed to load:", e.currentTarget.src);
  }}
/>
                      ) : (
                        initial
                      )}
                    </div>

                    <Link
                      to={getDestination(notification)}
                      onClick={() => markOneAsRead(notification)}
                      className="notification-content"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <p>
                        <strong>{senderName}</strong>{" "}
                        {notification.message || getAction(notification.type)}
                      </p>
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </Link>

                    <span
                      className={`notification-icon notification-${notification.type}`}
                      title={notification.type}
                      aria-label={notification.type}
                    >
                      <Icon
                        type={
                          ["message", "like", "comment", "new_post"].includes(
                            notification.type
                          )
                            ? notification.type
                            : "info"
                        }
                        size={19}
                      />
                    </span>

                    <button
                      type="button"
                      className="notification-delete-button"
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={() => deleteOne(notification._id)}
                      disabled={busy}
                    >
                      <Icon type="trash" size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {!loading && notifications.length > 0 && (
          <div className="notifications-empty-note">
            <span>✦</span>
            You're all caught up for now.
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;