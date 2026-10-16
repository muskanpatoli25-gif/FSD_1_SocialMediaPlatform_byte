import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { token, user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [followStates, setFollowStates] = useState({});
  const [followLoading, setFollowLoading] = useState({});
  const [followErrors, setFollowErrors] = useState({});
  const [activeFeed, setActiveFeed] = useState("for-you");
const [selectedCategory, setSelectedCategory] = useState("");

  const currentUserId = String(user?._id || user?.id || "");
  
const categories = [
  "technology",
  "design",
  "business",
  "education",
  "entertainment",
  "lifestyle",
];

const yourInterests = useMemo(() => {
  const categoryLikes = {};

  posts.forEach((post) => {
    const category = String(post.category || "").toLowerCase();

    if (!categories.includes(category)) return;

    const likes = Array.isArray(post.likes) ? post.likes : [];

    const userLiked = currentUserId
      ? likes.some(
          (id) => String(id?._id || id) === currentUserId
        )
      : false;

    if (userLiked) {
      categoryLikes[category] =
        (categoryLikes[category] || 0) + 1;
    }
  });

  const ranked = Object.entries(categoryLikes)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  const remaining = categories.filter(
    (category) => !ranked.includes(category)
  );

  return [...ranked, ...remaining].slice(0, 5);
}, [posts, currentUserId]);


const visiblePosts = useMemo(() => {
  let result = [...posts];

  if (selectedCategory) {
    result = result.filter(
      (post) =>
        String(post.category || "").toLowerCase() ===
        selectedCategory
    );
  }

  if (activeFeed === "following") {
    result = result.filter((post) => {
      const author =
        post.author && typeof post.author === "object"
          ? post.author
          : {};

      const authorId = String(
        author._id || author.id || post.author || ""
      );

      return followStates[authorId] === true;
    });
  }

  if (activeFeed === "for-you" && !selectedCategory) {
    const categoryScores = {};

    posts.forEach((post) => {
      const category = String(post.category || "").toLowerCase();

      if (!categories.includes(category)) return;

      // Sirf current user ke apne likes count karein
      if (likedPosts[post._id]) {
        categoryScores[category] =
          (categoryScores[category] || 0) + 1;
      }
    });

    const maxScore = Math.max(
      0,
      ...Object.values(categoryScores)
    );

    if (maxScore > 0) {
      // Har category ki posts ko user ke interest score ke
      // mutabiq weight dein, na ke post ke total likes ke mutabiq.
      result.sort((a, b) => {
        const categoryA = String(a.category || "").toLowerCase();
        const categoryB = String(b.category || "").toLowerCase();

        const scoreA = categoryScores[categoryA] || 0;
        const scoreB = categoryScores[categoryB] || 0;

        if (scoreA !== scoreB) return scoreB - scoreA;

        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      });

      return result;
    }
  }

  result.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return result;
}, [
  posts,
  activeFeed,
  selectedCategory,
  followStates,
  likedPosts,
]);


  // Load posts
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/posts"
        );

        if (!isMounted) return;

        const fetchedPosts = Array.isArray(response.data.posts)
          ? response.data.posts
          : [];

        setPosts(fetchedPosts);

        const initialLikedPosts = {};

        fetchedPosts.forEach((post) => {
          const likes = Array.isArray(post.likes) ? post.likes : [];

          initialLikedPosts[post._id] = Boolean(
            currentUserId &&
              likes.some(
                (id) => String(id?._id || id) === currentUserId
              )
          );
        });

        setLikedPosts(initialLikedPosts);
        setError("");
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load posts. Please check that the backend is running."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [user?._id, user?.id]);

  // NEW: Load follow status for post authors
  useEffect(() => {
    if (!token || !currentUserId || posts.length === 0) return;

    let cancelled = false;

    const loadFollowStates = async () => {
      const authorIds = [
        ...new Set(
          posts
            .map((post) => {
              const author =
                post.author && typeof post.author === "object"
                  ? post.author
                  : null;

              return String(
                author?._id || author?.id || post.author || ""
              );
            })
            .filter((id) => id && id !== currentUserId)
        ),
      ];

      const results = await Promise.all(
        authorIds.map(async (authorId) => {
          try {
            const response = await axios.get(
              `http://localhost:5000/api/users/${authorId}/profile`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            return [
              authorId,
              Boolean(response.data.isFollowing),
            ];
          } catch {
            return [authorId, false];
          }
        })
      );

      if (!cancelled) {
        setFollowStates((current) => ({
          ...current,
          ...Object.fromEntries(results),
        }));
      }
    };

    loadFollowStates();

    return () => {
      cancelled = true;
    };
  }, [posts, token, currentUserId]);

  const getTimeAgo = (date) => {
    if (!date) return "Recently";

    const timestamp = new Date(date).getTime();

    if (Number.isNaN(timestamp)) return "Recently";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 1000)
    );

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Follow or unfollow a user
  const handleFollow = async (authorId) => {
    if (!token) {
      setFollowErrors((current) => ({
        ...current,
        [authorId]: "Please log in to follow users.",
      }));
      return;
    }

    if (!authorId || authorId === currentUserId) return;
    if (followLoading[authorId]) return;

    setFollowLoading((current) => ({
      ...current,
      [authorId]: true,
    }));

    setFollowErrors((current) => ({
      ...current,
      [authorId]: "",
    }));

    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/${authorId}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFollowStates((current) => ({
        ...current,
        [authorId]: Boolean(response.data.following),
      }));
    } catch (err) {
      setFollowErrors((current) => ({
        ...current,
        [authorId]:
          err.response?.data?.message ||
          "Unable to update follow status.",
      }));
    } finally {
      setFollowLoading((current) => ({
        ...current,
        [authorId]: false,
      }));
    }
  };

  // Delete your own post
  const handleDeletePost = async (postId) => {
    if (!token) {
      setDeleteError("Please log in to delete your post.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(postId);
    setDeleteError("");

    try {
      await axios.delete(
        `http://localhost:5000/api/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPosts((currentPosts) =>
        currentPosts.filter(
          (post) => String(post._id) !== String(postId)
        )
      );
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          "Unable to delete post. Please try again."
      );
    } finally {
      setDeletingId("");
    }
  };

  // Like or unlike a post
  const handleLike = async (postId) => {
    if (!token) {
      setLikeError("Please log in to like a post.");
      return;
    }

    setLikeError("");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/posts/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLikedPosts((current) => ({
        ...current,
        [postId]: response.data.liked,
      }));

      setPosts((currentPosts) =>
  currentPosts.map((post) => {
    if (post._id !== postId) return post;

    const currentLikes = Array.isArray(post.likes)
      ? post.likes
      : [];

    const updatedLikes = response.data.liked
      ? [...currentLikes, currentUserId]
      : currentLikes.filter(
          (id) => String(id?._id || id) !== currentUserId
        );

    return {
      ...post,
      likes: updatedLikes,
    };
  })
);
    } catch (err) {
      setLikeError(
        err.response?.data?.message ||
          "Unable to update like. Please try again."
      );
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs((current) => ({
      ...current,
      [postId]: value,
    }));
  };

  // Add a comment
  const handleComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();

    if (!token) {
      setCommentErrors((current) => ({
        ...current,
        [postId]: "Please log in to comment.",
      }));
      return;
    }

    if (!text) {
      setCommentErrors((current) => ({
        ...current,
        [postId]: "Please write a comment first.",
      }));
      return;
    }

    if (text.length > 1000) {
      setCommentErrors((current) => ({
        ...current,
        [postId]: "Comment cannot exceed 1000 characters.",
      }));
      return;
    }

    setCommentLoading((current) => ({
      ...current,
      [postId]: true,
    }));

    setCommentErrors((current) => ({
      ...current,
      [postId]: "",
    }));

    try {
      const response = await axios.post(
        `http://localhost:5000/api/posts/${postId}/comments`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newComment = response.data.comment;

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: [...(post.comments || []), newComment],
              }
            : post
        )
      );

      setCommentInputs((current) => ({
        ...current,
        [postId]: "",
      }));

      setExpandedComments((current) => ({
        ...current,
        [postId]: true,
      }));
    } catch (err) {
      setCommentErrors((current) => ({
        ...current,
        [postId]:
          err.response?.data?.message ||
          "Unable to add comment. Please try again.",
      }));
    } finally {
      setCommentLoading((current) => ({
        ...current,
        [postId]: false,
      }));
    }
  };

  // Show or hide comments
  const handleToggleComments = async (postId) => {
    const shouldOpen = !expandedComments[postId];

    setExpandedComments((current) => ({
      ...current,
      [postId]: shouldOpen,
    }));

    if (!shouldOpen) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/posts/${postId}/comments`
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: Array.isArray(response.data.comments)
                  ? response.data.comments
                  : [],
              }
            : post
        )
      );
    } catch (err) {
      setCommentErrors((current) => ({
        ...current,
        [postId]:
          err.response?.data?.message || "Unable to load comments.",
      }));
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="home-page">
        <div className="home-main">
          <header className="home-header">
            <div>
              <span className="section-label">YOUR FEED</span>
              <h1>Home</h1>
              <p>Your personalized feed</p>
            </div>

            <Link to="/create-post" className="home-header-button">
              + Create Post
            </Link>
          </header>

         
<div className="feed-tabs">
  {[
    { id: "for-you", label: "For You" },
    { id: "following", label: "Following" },
    { id: "latest", label: "Latest" },
  ].map((tab) => (
    <button
      key={tab.id}
      type="button"
      className={`feed-tab ${
        activeFeed === tab.id ? "active" : ""
      }`}
      onClick={() => {
        setActiveFeed(tab.id);
        setSelectedCategory("");
      }}
    >
      {tab.label}
    </button>
  ))}
</div>


          

          <Link to="/create-post" className="quick-post">
            <div className="quick-avatar">
              {(user?.name || "M").charAt(0).toUpperCase()}
            </div>
            <span>What's on your mind?</span>
            <button type="button">Post</button>
          </Link>

          {likeError && (
            <p role="alert" className="feed-error">
              {likeError}
            </p>
          )}

          {deleteError && (
            <p role="alert" className="feed-error">
              {deleteError}
            </p>
          )}

          <div className="feed-list">
            {loading && <p>Loading posts...</p>}

            {!loading && error && <p role="alert">{error}</p>}

           
{!loading && !error && visiblePosts.length === 0 && (
  <p>
    {selectedCategory
      ? `No posts found in ${selectedCategory}.`
      : activeFeed === "following"
        ? "No posts from followed users yet."
        : "No posts available yet. Be the first to share!"}
  </p>
)}

            {!loading &&
              !error &&
              visiblePosts.map((post) => {
                const author =
                  post.author && typeof post.author === "object"
                    ? post.author
                    : {};

                const name = author.name || "LINKUP User";
                const username = author.username
                  ? `@${author.username}`
                  : "@user";
                const profileImage = author.profileImage || "";
                const category = post.category || "General";
                const postId = post._id;

                const authorId = String(
                  author._id || author.id || post.author || ""
                );

                const isOwnPost =
                  Boolean(currentUserId) &&
                  authorId === currentUserId;

                const likes = Array.isArray(post.likes)
                  ? post.likes.length
                  : typeof post.likes === "number"
                    ? post.likes
                    : 0;

                const comments = Array.isArray(post.comments)
                  ? post.comments.length
                  : 0;

                return (
                  <article className="feed-post" key={postId}>
                    <div className="feed-post-header">
                      {/* NEW: Clickable author profile */}
                      <div className="post-user">
                        <Link
                          to={
                            authorId
                              ? `/profile/${authorId}`
                              : "/profile"
                          }
                          className="post-author-profile"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            color: "inherit",
                            textDecoration: "none",
                            minWidth: 0,
                          }}
                        >
                          <div
                            className="post-user-avatar"
                            style={{
                              width: "44px",
                              height: "44px",
                              minWidth: "44px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt={`${name}'s profile`}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <span>
                                {name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div>
                            <strong>{name}</strong>
                            <span>
                              {username} · {getTimeAgo(post.createdAt)}
                            </span>
                          </div>
                        </Link>

                        {/* NEW: Follow button for other users */}
                        {!isOwnPost && authorId && (
                          <button
                            type="button"
                            onClick={() => handleFollow(authorId)}
                            disabled={Boolean(followLoading[authorId])}
                            style={{
                              marginLeft: "auto",
                              padding: "7px 12px",
                              borderRadius: "20px",
                              border: "1px solid #8e3a68",
                              background: followStates[authorId]
                                ? "transparent"
                                : "#8e3a68",
                              color: followStates[authorId]
                                ? "#8e3a68"
                                : "#ffffff",
                              cursor: followLoading[authorId]
                                ? "wait"
                                : "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {followLoading[authorId]
                              ? "Please wait..."
                              : followStates[authorId]
                                ? "Following ✓"
                                : "Follow +"}
                          </button>
                        )}
                      </div>

                      {followErrors[authorId] && (
                        <p role="alert" style={{ color: "#c62828" }}>
                          {followErrors[authorId]}
                        </p>
                      )}

                      {isOwnPost && (
                        <button
                          className="post-menu"
                          type="button"
                          onClick={() => handleDeletePost(postId)}
                          disabled={deletingId === postId}
                          title="Delete your post"
                          aria-label="Delete your post"
                          style={{
                            color: "#c62828",
                            background: "transparent",
                            border: "1px solid #e5b8b8",
                            borderRadius: "8px",
                            padding: "7px 10px",
                            cursor:
                              deletingId === postId ? "wait" : "pointer",
                          }}
                        >
                          {deletingId === postId
                            ? "Deleting..."
                            : "🗑 Delete"}
                        </button>
                      )}
                    </div>

                    <Link
                      to={`/post/${postId}`}
                      className="feed-post-content"
                    >
                      <p>{post.content}</p>

                      
{(Array.isArray(post.media) && post.media.length > 0) ? (
  <div
    className="post-media-gallery"
    style={{
      display: "grid",
      gridTemplateColumns:
        post.media.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr",
      gap: "8px",
      marginTop: "12px",
    }}
  >
    {post.media.map((media, index) => {
      const mediaSrc = media.url.startsWith("http")
        ? media.url
        : `http://localhost:5000${media.url}`;

      return (
        <div key={media._id || media.url || index}>
          {media.type === "video" ? (
            <video
              src={mediaSrc}
              controls
              preload="metadata"
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "12px",
                display: "block",
              }}
            />
          ) : (
            <img
              src={mediaSrc}
              alt="Post attachment"
              loading="lazy"
              onError={(event) => {
                console.error("Unable to load post image:", mediaSrc);
              }}
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "12px",
                display: "block",
              }}
            />
          )}
        </div>
      );
    })}
  </div>
) : post.mediaUrl ? (
  <img
    src={
      post.mediaUrl.startsWith("http")
        ? post.mediaUrl
        : `http://localhost:5000${post.mediaUrl}`
    }
    alt="Post attachment"
    style={{
      width: "100%",
      maxHeight: "400px",
      objectFit: "contain",
      borderRadius: "12px",
      marginTop: "12px",
    }}
  />
) : null}

                    </Link>

                    <div className="post-category">
                      {category.charAt(0).toUpperCase() +
                        category.slice(1)}
                    </div>

                    <div className="feed-post-actions">
                      <button
                        type="button"
                        className={`feed-action ${
                          likedPosts[postId] ? "liked" : ""
                        }`}
                        onClick={() => handleLike(postId)}
                        aria-label={
                          likedPosts[postId] ? "Unlike post" : "Like post"
                        }
                      >
                        <span>{likedPosts[postId] ? "♥" : "♡"}</span>
                        {likes}
                      </button>

                      <button
                        type="button"
                        className="feed-action"
                        onClick={() => handleToggleComments(postId)}
                      >
                        <span>○</span>
                        {comments}
                        <span>
                          {expandedComments[postId] ? "Hide" : "Comments"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="feed-action share-action"
                        onClick={() => {
                          const textToShare = post.content || "";

                          if (navigator.share) {
                            navigator
                              .share({
                                title: `Post by ${name}`,
                                text: textToShare,
                              })
                              .catch(() => {});
                          } else if (navigator.clipboard) {
                            navigator.clipboard
                              .writeText(textToShare)
                              .catch(() => {});
                          }
                        }}
                      >
                        <span>↗</span>
                        Share
                      </button>
                    </div>

                    {expandedComments[postId] && (
                      <div className="post-comments">
                        <div className="comments-list">
                          {Array.isArray(post.comments) &&
                          post.comments.length > 0 ? (
                            post.comments.map((comment, index) => {
                              const commentUser = comment.user || {};
                              const commentName =
                                commentUser.name || "LINKUP User";

                              return (
                                <div
                                  className="post-comment"
                                  key={comment._id || index}
                                >
                                  <div className="comment-avatar">
                                    {commentUser.profileImage ? (
                                      <img
                                        src={commentUser.profileImage}
                                        alt={commentName}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          borderRadius: "50%",
                                        }}
                                      />
                                    ) : (
                                      commentName.charAt(0).toUpperCase()
                                    )}
                                  </div>

                                  <div className="comment-body">
                                    <strong>{commentName}</strong>
                                    <p>{comment.text}</p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="no-comments">
                              No comments yet. Start the conversation!
                            </p>
                          )}
                        </div>

                        {commentErrors[postId] && (
                          <p className="comment-error" role="alert">
                            {commentErrors[postId]}
                          </p>
                        )}

                        <form
                          className="comment-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleComment(postId);
                          }}
                        >
                          <input
                            type="text"
                            value={commentInputs[postId] || ""}
                            onChange={(event) =>
                              handleCommentChange(
                                postId,
                                event.target.value
                              )
                            }
                            placeholder="Write a comment..."
                            maxLength={1000}
                            aria-label="Write a comment"
                          />

                          <button
                            type="submit"
                            disabled={Boolean(commentLoading[postId])}
                          >
                            {commentLoading[postId] ? "Posting..." : "Send"}
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </div>

        <aside className="home-right-sidebar">
          
<section className="side-card">
  <div className="side-card-header">
    <h3>Your Interests</h3>
    {selectedCategory && (
      <button
        type="button"
        onClick={() => setSelectedCategory("")}
      >
        Clear
      </button>
    )}
  </div>

  <p className="interests-description">
    Explore posts by category.
  </p>

  <div className="interest-tags">
    {yourInterests.map((category) => (
      <button
        type="button"
        key={category}
        className={`interest-tag ${
          selectedCategory === category ? "selected" : ""
        }`}
        onClick={() =>
          setSelectedCategory((current) =>
            current === category ? "" : category
          )
        }
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </button>
    ))}
  </div>
</section>


          <div className="home-footer">
            <span>About</span>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Help</span>
            <p>© 2026 LINKUP</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Home;
