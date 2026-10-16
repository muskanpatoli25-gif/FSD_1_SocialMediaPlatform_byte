
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000/api/messages";
const USERS_API = "http://localhost:5000/api/users";

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token } = useAuth();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
const [selectedChats, setSelectedChats] = useState([]);
const [deleteBusy, setDeleteBusy] = useState(false);
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load conversations."
          );
        }

        if (active) {
          setConversations(data.conversations || []);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConversations();

    return () => {
      active = false;
    };
  }, [token]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter(({ user, lastMessage }) => {
      const name = user?.name || "";
      const username = user?.username || "";
      const message = lastMessage?.content || "";

      return (
        name.toLowerCase().includes(query) ||
        username.toLowerCase().includes(query) ||
        message.toLowerCase().includes(query)
      );
    });
  }, [conversations, search]);

  function formatTime(date) {
    if (!date) return "";

    const messageDate = new Date(date);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  async function searchUsers(event) {
    event.preventDefault();

    const query = userQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchError("Type at least 2 characters.");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError("");

      const response = await fetch(
        `${USERS_API}/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to search users."
        );
      }

      setSearchResults(data.users || []);

      if (!data.users?.length) {
        setSearchError(
          "No users found. Try another name or username."
        );
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  function startConversation(userId) {
    navigate(`/messages/${userId}`);
  }
  function toggleChatSelection(userId) {
    setSelectedChats((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    );
  }

  function startChatSelection(userId) {
    setSelectionMode(true);
    setSelectedChats((previous) =>
      previous.includes(userId) ? previous : [...previous, userId]
    );
  }

  function startConversationLongPress(userId) {
    longPressTriggered.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      startChatSelection(userId);
    }, 550);
  }

  function cancelConversationLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

async function deleteSelectedChats() {
  if (!selectedChats.length || deleteBusy) return;

  const confirmed = window.confirm(
    `Remove ${selectedChats.length} selected conversation(s) from your inbox? The other user will keep their chat history.`
  );

  if (!confirmed) return;

  try {
    setDeleteBusy(true);
    setError("");

    const response = await fetch(`${API}/conversations/bulk`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds: selectedChats }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to delete conversations.");
    }

    setConversations((previous) =>
      previous.filter(
        ({ user }) => !selectedChats.includes(String(user?._id))
      )
    );

    setSelectedChats([]);
    setSelectionMode(false);
  } catch (err) {
    setError(err.message);
  } finally {
    setDeleteBusy(false);
  }
}

  return (
    <div className="app-shell">
      <Navbar />

      <main className="messages-page">
        <div className="messages-header">
          <div>
            <span className="section-label">STAY CONNECTED</span>
            <h1>Messages</h1>
            <p>
              Connect and chat with your LINKUP community.
            </p>
          </div>
        </div>

        <section className="messages-layout">
          <aside className="conversation-panel">
            <div className="conversation-header">
              <h2>Inbox</h2>
              {selectionMode && (
                <div
                  className="inbox-selection-actions"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "8px",
                    flexShrink: 0,
                    marginLeft: "auto",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
                    {selectedChats.length}
                  </span>
                  <button
                    type="button"
                    className="conversation-delete-button"
                    onClick={deleteSelectedChats}
                    disabled={!selectedChats.length || deleteBusy}
                    aria-label={deleteBusy ? "Deleting conversations" : "Delete selected conversations"}
                    title={deleteBusy ? "Deleting..." : "Delete selected conversations"}
                    style={{
                      width: "36px",
                      height: "36px",
                      minWidth: "36px",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="m19 6-1 14H6L5 6" />
                      <path d="M10 11v5M14 11v5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedChats([]);
                    }}
                    disabled={deleteBusy}
                    aria-label="Cancel selection"
                    title="Cancel selection"
                    style={{
                      width: "36px",
                      height: "36px",
                      minWidth: "36px",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              
<button
  type="button"
  className="new-message-icon"
  aria-label={showSearch ? "Close new message" : "New message"}
  title={showSearch ? "Close" : "New message"}
  onClick={() => {
    setShowSearch((previous) => !previous);
    setUserQuery("");
    setSearchResults([]);
    setSearchError("");
  }}
>
  {showSearch ? "×" : "+"}
</button>

            </div>

            <div className="message-search">
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {showSearch && (
              <section className="new-message-search">
                <h3>Start a conversation</h3>

                <form onSubmit={searchUsers}>
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={userQuery}
                    onChange={(event) =>
                      setUserQuery(event.target.value)
                    }
                    minLength={2}
                  />

                  <button
                    type="submit"
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Searching..." : "Search"}
                  </button>
                </form>

                {searchError && <p>{searchError}</p>}

                <div className="user-search-results">
                  {searchResults.map((user) => (
                    <button
                      type="button"
                      key={user._id}
                      className="search-user-item"
                      onClick={() =>
                        startConversation(user._id)
                      }
                    >
                      <div className="conversation-avatar" style={{ overflow: "hidden", padding: 0, flexShrink: 0 }}>
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name || "Profile"}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          user.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>

                      <div>
                        <strong>{user.name}</strong>
                        <p>@{user.username}</p>
                      </div>

                      <span>Message →</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="conversation-list">
              {loading ? (
                <p className="conversation-status">
                  Loading conversations...
                </p>
              ) : error ? (
                <p className="conversation-status">{error}</p>
              ) : filteredConversations.length === 0 ? (
                <div className="conversation-empty">
                  <span>✉</span>
                  <h3>No conversations yet</h3>
                  <p>
                    {search
                      ? "Try another search."
                      : "When you exchange messages, they will appear here."}
                  </p>
                </div>
              ) : (
                filteredConversations.map(
                  ({ user, lastMessage }) => {
                    const userId = user?._id;

                    if (!userId) return null;

                    return (
                      <div
                        key={userId}
                        className={`conversation-item-wrapper ${
                          selectedChats.includes(String(userId)) ? "selected" : ""
                        }`}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          startChatSelection(String(userId));
                        }}
                        onTouchStart={() => startConversationLongPress(String(userId))}
                        onTouchEnd={cancelConversationLongPress}
                        onTouchMove={cancelConversationLongPress}
                        onTouchCancel={cancelConversationLongPress}
                      >
                        <Link
                          to={`/messages/${userId}`}
                          className="conversation-item"
                          onClick={(event) => {
                            if (longPressTriggered.current) {
                              event.preventDefault();
                              longPressTriggered.current = false;
                              return;
                            }

                            if (selectionMode) {
                              event.preventDefault();
                              toggleChatSelection(String(userId));
                            }
                          }}
                        >
                          <div className="conversation-avatar" style={{ overflow: "hidden", padding: 0, flexShrink: 0 }}>
                            {user?.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.name || "Profile"}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                              />
                            ) : (
                              user?.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>

                          <div className="conversation-info">
                            <div className="conversation-top">
                              <strong>{user?.name || "LINKUP User"}</strong>
                              <span>{formatTime(lastMessage?.createdAt)}</span>
                            </div>

                            <p>{lastMessage?.content || "Start a conversation"}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Messages;
