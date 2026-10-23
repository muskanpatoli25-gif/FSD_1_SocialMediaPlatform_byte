
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";

function PostDetails() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchPost = async () => {
      setLoading(true);
      setError("");

      try {
        const [postResponse, commentsResponse] = await Promise.all([
          axios.get(API_URL + "/api/posts"),
          axios.get(
            `${API_URL}/api/posts/${id}/comments`
          ),
        ]);

        if (!active) return;

        const posts = postResponse.data.posts || [];
        const foundPost = posts.find(
          (item) => String(item._id) === String(id)
        );

        if (!foundPost) {
          setError("Post not found.");
          return;
        }

        foundPost.comments = commentsResponse.data.comments || [];
        setPost(foundPost);

        const userId = String(user?._id || user?.id || "");
        const likes = Array.isArray(foundPost.likes)
          ? foundPost.likes
          : [];

        setLiked(
          Boolean(
            userId &&
              likes.some(
                (likeId) =>
                  String(likeId?._id || likeId) === userId
              )
          )
        );
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load this post. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPost();

    return () => {
      active = false;
    };
  }, [id, user?._id, user?.id]);

  const getTimeAgo = (date) => {
    if (!date) return "Recently";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    );

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const handleLike = async () => {
    if (!token) {
      setError("Please log in to like this post.");
      return;
    }

    if (likeLoading) return;

    setLikeLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLiked(response.data.liked);

      setPost((current) => ({
        ...current,
        likes: response.data.likes,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update like."
      );
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();

    if (!token) {
      setCommentError("Please log in to comment.");
      return;
    }

    const text = commentText.trim();

    if (!text) {
      setCommentError("Please write a comment first.");
      return;
    }

    setSubmitting(true);
    setCommentError("");

    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${id}/comments`,
        { text },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newComment = response.data.comment;

      // Add the saved comment to the list immediately.
      setPost((current) => ({
        ...current,
        comments: [...(current.comments || []), newComment],
      }));

      setCommentText("");
    } catch (err) {
      setCommentError(
        err.response?.data?.message ||
          "Unable to add comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="post-details-page">
          <p>Loading post...</p>
        </main>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="post-details-page">
          <p role="alert">{error}</p>
          <Link to="/home" className="post-back-button">
            ← Back to Home
          </Link>
        </main>
      </div>
    );
  }

  if (!post) return null;

  const author =
  post.author && typeof post.author === "object"
    ? post.author
    : {};

const authorId = String(author._id || author.id || "");

const authorName = author.name || "LINKUP User";
const authorImage = author.profileImage || "";
const username = author.username || "user";
const category = post.category || "General";

  const likesCount = Array.isArray(post.likes)
    ? post.likes.length
    : typeof post.likes === "number"
      ? post.likes
      : 0;

  const comments = Array.isArray(post.comments) ? post.comments : [];

  return (
    <div className="app-shell">
      <Navbar />

      <main className="post-details-page">
        <div className="post-details-header">
          <div>
            <span className="section-label">POST DETAILS</span>
            <h1>Conversation</h1>
          </div>

          <Link to="/home" className="post-back-button">
            ← Back to Home
          </Link>
        </div>

        <div className="post-details-layout">
          <section>
            <article className="post-details-card">
              <div className="post-details-author">
               <div className="post-details-avatar">
  {authorImage ? (
    <img src={authorImage} alt={authorName} />
  ) : (
    authorName.charAt(0).toUpperCase()
  )}
</div>

                <div className="post-details-author-info">
                  <strong>{authorName}</strong>
                  <span>
                    @{username} · {getTimeAgo(post.createdAt)}
                  </span>
                </div>

                <span className="post-details-category">
                  {category.charAt(0).toUpperCase() +
                    category.slice(1)}
                </span>
              </div>

              <div className="post-details-content">
                <p>{post.content}</p>

               
{(Array.isArray(post.media) && post.media.length > 0) ? (
  <div
    className="post-details-media"
    style={{
      display: "grid",
      gridTemplateColumns:
        post.media.length > 1
          ? "repeat(2, minmax(0, 1fr))"
          : "1fr",
      gap: "10px",
      marginTop: "14px",
    }}
  >
    {post.media.map((media, index) => {
      const mediaSrc = media.url.startsWith("http")
        ? media.url
        : `${API_URL}${media.url}`;

      return (
        <div key={media._id || media.url || index}>
          {media.type === "video" ? (
           <video
  src={mediaSrc}
  controls
  preload="metadata"
  playsInline
  style={{
    display: "block",
    maxWidth: "100%",
    maxHeight: post.media.length > 1 ? "300px" : "600px",
    width: "auto",
    height: "auto",
    margin: "0 auto",
    borderRadius: "12px",
    background: "#000",
  }}
/>
          ) : (
            <img
              src={mediaSrc}
              alt="Post attachment"
             style={{
  display: "block",
  maxWidth: "100%",
  maxHeight: post.media.length > 1 ? "300px" : "600px",
  width: "auto",
  height: "auto",
  margin: "0 auto",
  borderRadius: "12px",
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
        : `${API_URL}${post.mediaUrl}`
    }
    alt="Post attachment"
   style={{
  display: "block",
  maxWidth: "100%",
  maxHeight: "600px",
  width: "auto",
  height: "auto",
  margin: "14px auto 0",
  borderRadius: "12px",
}}
  />
) : null}

              </div>

              <div className="post-details-actions">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={liked ? "liked" : ""}
                >
                  {liked ? "♥" : "♡"}{" "}
                  <span>{likesCount}</span> Likes
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("post-comments")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  ○ <span>{comments.length}</span> Comments
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Post by ${authorName}`,
                        text: post.content || "",
                      }).catch(() => {});
                    } else if (navigator.clipboard) {
                      navigator.clipboard
                        .writeText(post.content || "")
                        .catch(() => {});
                    }
                  }}
                >
                  ↗ Share
                </button>
              </div>

              {error && <p role="alert">{error}</p>}
            </article>

            <section
              className="comments-section"
              id="post-comments"
            >
              <div className="comments-heading">
                <div>
                  <span className="section-label">DISCUSSION</span>
                  <h2>Comments</h2>
                </div>

                <span className="comments-count">
                  {comments.length} comments
                </span>
              </div>

              <form
                className="comment-form-card"
                onSubmit={handleComment}
              >
               <div className="comment-avatar">
  {user?.profileImage ? (
    <img src={user.profileImage} alt={user?.name || "You"} />
  ) : (
    (user?.name || "M").charAt(0).toUpperCase()
  )}
</div>

                <div className="comment-input-wrapper">
                  <textarea
                    placeholder="Write a comment..."
                    rows={3}
                    maxLength={1000}
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(event.target.value)
                    }
                  />

                  <div className="comment-submit-row">
                    <span>Be respectful and constructive.</span>

                    <button type="submit" disabled={submitting}>
                      {submitting ? "Posting..." : "Comment →"}
                    </button>
                  </div>

                  {commentError && (
                    <p role="alert">{commentError}</p>
                  )}
                </div>
              </form>

              {comments.length === 0 && (
                <p>No comments yet. Start the conversation!</p>
              )}

              {comments.map((comment, index) => {
                const commentUser = comment.user || {};
                const commentName = commentUser.name || "LINKUP User";

                return (
                  <article
                    className="comment-card"
                    key={comment._id || index}
                  >
                   <div className="comment-avatar">
  {commentUser.profileImage ? (
    <img src={commentUser.profileImage} alt={commentName} />
  ) : (
    commentName.charAt(0).toUpperCase()
  )}
</div>

                    <div className="comment-content">
                      <div className="comment-user-row">
                        <div>
                          <strong>{commentName}</strong>
                          <span>
                            @{commentUser.username || "user"} ·{" "}
                            {getTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p>{comment.text}</p>
                    </div>
                  </article>
                );
              })}
            </section>
          </section>

          <aside className="post-details-sidebar">
            <div className="post-side-card">
              <span className="section-label">ABOUT THIS POST</span>

              <div className="post-side-stat">
                <strong>{likesCount}</strong>
                <span>Likes</span>
              </div>

              <div className="post-side-stat">
                <strong>{comments.length}</strong>
                <span>Comments</span>
              </div>

              <div className="post-side-stat">
                <strong>{getTimeAgo(post.createdAt)}</strong>
                <span>Published</span>
              </div>
            </div>

            <div className="post-side-card">
              <span className="section-label">CATEGORY</span>

              <div className="post-category-large">
                {category.charAt(0).toUpperCase() +
                  category.slice(1)}
              </div>

              <p>
                Posts in this category can influence your personalized
                Echo Chamber feed.
              </p>
            </div>

            <div className="post-side-card">
              <span className="section-label">AUTHOR</span>

              <div className="post-side-user">
                <div className="post-side-avatar">
  {authorImage ? (
    <img src={authorImage} alt={authorName} />
  ) : (
    authorName.charAt(0).toUpperCase()
  )}
</div>

                <div>
                  <strong>{authorName}</strong>
                  <span>@{username}</span>
                </div>
              </div>

              {authorId && (
  <Link
    to={`/profile/${authorId}`}
    className="view-profile-link"
  >
    View Profile →
  </Link>
)}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default PostDetails;