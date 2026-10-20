import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";

const API = API_URL + "/api/messages";
const LONG_PRESS_DELAY = 500;

function Chat() {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
const [showChatMenu, setShowChatMenu] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messageSelectionMode, setMessageSelectionMode] = useState(false);
  const [deletingMessages, setDeletingMessages] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);

  const { token, user: currentUser } = useAuth();
  const bottomRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const touchStartedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadConversation() {
      setLoading(true);
      setError("");

      try {
        if (!token) throw new Error("Please log in again.");

        const response = await fetch(`${API}/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load chat.");
        }

        if (active) {
          setUser(data.user);
          setMessages(data.messages || []);
          setSelectedMessages([]);
          setMessageSelectionMode(false);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }loadConversation();

    return () => {
      active = false;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [userId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleMessageSelection(messageId) {
    setSelectedMessages((previous) =>
      previous.includes(messageId)
        ? previous.filter((id) => id !== messageId)
        : [...previous, messageId]
    );
  }

  function selectMessage(messageId) {
    setMessageSelectionMode(true);
    toggleMessageSelection(messageId);
  }

  function cancelSelection() {
    setMessageSelectionMode(false);
    setSelectedMessages([]);
  }

  function handleMessageTouchStart(messageId) {
    touchStartedRef.current = true;
    longPressTriggeredRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      selectMessage(messageId);
    }, LONG_PRESS_DELAY);
  }

  function handleMessageTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleMessageClick(messageId) {
    // Prevent the synthetic click after a long press from toggling twice.
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (messageSelectionMode) {
      toggleMessageSelection(messageId);
    }
  }

  function handleMessageContextMenu(event, messageId) {
    event.preventDefault();

    // On touch devices, the long-press handler already handled this gesture.
    if (touchStartedRef.current) {
      touchStartedRef.current = false;
      return;
    }

    selectMessage(messageId);
  }

  async function handleSend(event) {
    event.preventDefault();

    const text = content.trim();
    if (!text || sending) return;

    if (!token) {
      setError("Please log in again.");
      return;
    }
setSending(true);
    setError("");

    try {
      const response = await fetch(`${API}/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send message.");
      }

      setMessages((previous) => [...previous, data.data]);
      setContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    const confirmed = window.confirm(
      "Clear this chat from your account? The other person will keep their chat history."
    );

    if (!confirmed || clearingChat) return;

    try {
      setClearingChat(true);
      setError("");

      const response = await fetch(`${API}/${userId}/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to clear chat.");
      }
      setMessages([]);
      cancelSelection();
      setShowChatMenu(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setClearingChat(false);
    }
  }

  async function deleteSelectedMessages() {
    if (!selectedMessages.length || deletingMessages) return;

    const idsToDelete = [...selectedMessages];
    const confirmed = window.confirm(
      `Delete ${idsToDelete.length} selected message(s) from your chat history? The other person will keep their copies.`
    );

    if (!confirmed) return;

    setDeletingMessages(true);
    setError("");

    try {
      const response = await fetch(`${API}/messages/bulk`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIds: idsToDelete }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete selected messages.");
      }

      setMessages((previous) =>
        previous.filter((message) => !idsToDelete.includes(message._id))
      );
      cancelSelection();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingMessages(false);
    }
  }

  function getSenderId(message) {
    return String(message.sender?._id || message.sender || "");
  }

  const currentUserId = String(
    currentUser?._id || currentUser?.id || ""
  );

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link to="/messages" className="chat-back" aria-label="Back to messages">
          ←
        </Link>
        <Link
          to={
            user?._id || user?.id
              ? `/profile/${user._id || user.id}`
              : "/profile"
          }
          className="chat-user-avatar"
          aria-label={`Open ${user?.name || "user"}'s profile`}
          title="View profile"
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={`${user?.name || "User"}'s profile`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            user?.name?.charAt(0)?.toUpperCase() || "U"
          )}
        </Link>

        <Link
          to={
            user?._id || user?.id
              ? `/profile/${user._id || user.id}`
              : "/profile"
          }
          className="chat-user-info"
          style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}
        >
          <h2>{user?.name || "Conversation"}</h2>
          <p>{user?.username ? `@${user.username}` : "LINKUP member"}</p>
        </Link>

        <div className="chat-menu-wrapper">
          <button
            type="button"
            className="chat-menu-button"
            aria-label="Chat options"
            title="Chat options"
            onClick={() => setShowChatMenu((previous) => !previous)}
          >
            ⋮
          </button>

          {showChatMenu && (
            <div className="chat-dropdown-menu">
              <button type="button" onClick={clearChat} disabled={clearingChat}>
                <span>🗑</span> {clearingChat ? "Clearing..." : "Clear chat"}
              </button>
            </div>
          )}
        </div>
      </header>

      {messageSelectionMode && (
        <div className="message-selection-toolbar">
          <span>{selectedMessages.length} selected</span>
          <button
            type="button"
            className="message-delete-selected-button"
            disabled={!selectedMessages.length || deletingMessages}
            onClick={deleteSelectedMessages}
          >
            {deletingMessages ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            className="message-selection-cancel-button"
            disabled={deletingMessages}
            onClick={cancelSelection}
          >
            Cancel
          </button>
        </div>
      )}
            <main className="chat-messages">
        {loading ? (
          <p className="chat-status">Loading conversation...</p>
        ) : error && messages.length === 0 ? (
          <p className="chat-error">{error}</p>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">✉</div>
            <h3>Start the conversation</h3>
            <p>Send your first message to {user?.name || "this user"}.</p>
          </div>
        ) : (
          messages.map((message) => {
            const senderId = getSenderId(message);
            const isMine =
              currentUserId !== "" && senderId === currentUserId;
            const isSelected = selectedMessages.includes(message._id);

            return (
              <div
                key={message._id}
                className={`chat-message-row ${isMine ? "mine" : "theirs"} ${
                  isSelected ? "message-selected" : ""
                }`}
                onTouchStart={() => handleMessageTouchStart(message._id)}
                onTouchEnd={handleMessageTouchEnd}
                onTouchMove={handleMessageTouchEnd}
                onContextMenu={(event) =>
                  handleMessageContextMenu(event, message._id)
                }
                onClick={() => handleMessageClick(message._id)}
                aria-pressed={isSelected}
                style={{
                  cursor: messageSelectionMode ? "pointer" : "default",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
              >
                <div className={`chat-bubble ${isMine ? "mine" : "theirs"}`}>
                  <p>{message.content}</p>
                  <span>
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {error && messages.length > 0 && (
          <p className="chat-error">{error}</p>
        )}

        <div ref={bottomRef} />
      </main>

      <form className="chat-composer" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Write a message..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={5000}
          disabled={loading || !user}
        />

        <button
          type="submit"
          disabled={!content.trim() || sending || loading || !user}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default Chat;
