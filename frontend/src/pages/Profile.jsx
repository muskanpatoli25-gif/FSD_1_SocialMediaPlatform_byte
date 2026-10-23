
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";

const API = API_URL + "/api";

function Profile() {
  const { token, user: authUser } = useAuth();
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState("");

  const currentUserId = String(
  authUser?._id || authUser?.id || authUser?.user?._id || ""
);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      let profileData;
      let ownProfile = false;

      if (userId) {
        const response = await axios.get(
          `${API}/users/${userId}/profile`,
          { headers }
        );

        profileData = response.data.user;
        ownProfile =
  String(profileData?._id || profileData?.id || "") === currentUserId;
        setFollowing(Boolean(response.data.isFollowing));
        setFollowersCount(response.data.followersCount || 0);
        setFollowingCount(response.data.followingCount || 0);
      } else {
        const response = await axios.get(`${API}/auth/me`, { headers });

        profileData = response.data.user;
        ownProfile = true;
        setFollowersCount(profileData.followers?.length || 0);
        setFollowingCount(profileData.following?.length || 0);
        setFollowing(false);
      }

      setProfile(profileData);
      setIsOwnProfile(ownProfile);

      const postsResponse = await axios.get(`${API}/posts`);
      const allPosts = postsResponse.data.posts || [];
      const viewedUserId = String(
        profileData?._id || profileData?.id || ""
      );

      setPosts(
        allPosts.filter((post) => {
          const authorId =
            typeof post.author === "object"
              ? post.author?._id || post.author?.id
              : post.author;

          return String(authorId || "") === viewedUserId;
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load this profile."
      );
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollow = async () => {
    if (!profile || isOwnProfile || followLoading) return;

    setFollowLoading(true);
    setFollowError("");

    try {
      const response = await axios.post(
        `${API}/users/${profile._id}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFollowing(Boolean(response.data.following));
      setFollowersCount(response.data.followersCount || 0);
    } catch (err) {
      setFollowError(
        err.response?.data?.message ||
          "Unable to update follow status. Please try again."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(postId);
    setDeleteError("");

    try {
      await axios.delete(`${API}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts((current) =>
        current.filter(
          (post) => String(post._id || post.id) !== String(postId)
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

  const displayName = profile?.name || "User";
  const username = profile?.username || "";
  const initial = displayName.charAt(0).toUpperCase();
  const profileImage = profile?.profileImage || "";
  const location = profile?.location || "";
  const website = profile?.website || "";

  const getWebsiteUrl = (value) => {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "Recently";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recently";

    const difference = Date.now() - date.getTime();
    const minutes = Math.floor(difference / 60000);
    const hours = Math.floor(difference / 3600000);
    const days = Math.floor(difference / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="profile-page">
          <article className="profile-post-card">Loading profile...</article>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="profile-page">
          <article className="profile-post-card">
            <p role="alert">{error || "Profile not found."}</p>
            <Link to="/home">Back to Home</Link>
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="profile-page">
        <section className="profile-header-card">
          <div className="profile-cover"></div>

          <div className="profile-main-info">
            <div className="profile-avatar-large">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${displayName}'s profile`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                    display: "block",
                  }}
                />
              ) : (
                initial
              )}
            </div>

            <div className="profile-details">
              <div className="profile-name-row">
                <div>
                  <h1>{displayName}</h1>
                  <span>{username ? `@${username}` : ""}</span>
                </div>

                {isOwnProfile ? (
                  <Link
                    to="/edit-profile"
                    className="profile-edit-button"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="profile-edit-button"
                  >
                    {followLoading
                      ? "Please wait..."
                      : following
                        ? "Following ✓"
                        : "Follow +"}
                  </button>
                )}
              </div>

              <p className="profile-bio">
                {profile.bio || "No bio added yet."}
              </p>

              <div className="profile-meta">
                {location && <span>⌖ {location}</span>}

                {website && (
                  <span>
                    ↗{" "}
                    <a
                      href={getWebsiteUrl(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {website}
                    </a>
                  </span>
                )}

                <span>
                  ◷ Joined{" "}
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "recently"}
                </span>
              </div>

              {error && <p role="alert">{error}</p>}
              {followError && (
                <p role="alert" style={{ color: "#c62828" }}>
                  {followError}
                </p>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>

            <div className="profile-stat">
              <strong>{followersCount}</strong>
              <span>Followers</span>
            </div>

            <div className="profile-stat">
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>
          </div>
        </section>

        <section className="profile-content">
          <div className="profile-posts">
            <div className="profile-section-heading">
              <div>
                <span className="section-label">
                  {isOwnProfile ? "YOUR ACTIVITY" : "USER ACTIVITY"}
                </span>
                <h2>{isOwnProfile ? "Your Posts" : `${displayName}'s Posts`}</h2>
              </div>

              {isOwnProfile && (
                <Link
                  to="/create-post"
                  className="profile-create-button"
                >
                  + Create Post
                </Link>
              )}
            </div>

            {deleteError && (
              <p role="alert" style={{ color: "#c62828" }}>
                {deleteError}
              </p>
            )}

            <div className="profile-post-list">
              {posts.length === 0 ? (
                <article className="profile-post-card">
                  <p>
                    {isOwnProfile
                      ? "You haven't created any posts yet. Share your first idea with LINKUP!"
                      : "This user hasn't shared any posts yet."}
                  </p>

                  {isOwnProfile && (
                    <Link
                      to="/create-post"
                      className="profile-side-link"
                    >
                      Create your first post →
                    </Link>
                  )}
                </article>
              ) : (
                posts.map((post) => {
                  const postId = post._id || post.id;
                  const postAuthor =
                    typeof post.author === "object" ? post.author : profile;
                  const postAuthorName = postAuthor?.name || displayName;
                  const postAuthorUsername =
                    postAuthor?.username || username;
                  const postAuthorImage =
                    postAuthor?.profileImage || "";
                  const likeCount = Array.isArray(post.likes)
                    ? post.likes.length
                    : Number(post.likes) || 0;
                  const commentCount = Array.isArray(post.comments)
                    ? post.comments.length
                    : Number(post.comments) || 0;

                  return (
                    <article key={postId} className="profile-post-card">
                      <div className="profile-post-top">
                        <div className="profile-post-user">
                          <div className="profile-post-avatar">
                            {postAuthorImage ? (
                              <img
                                src={postAuthorImage}
                                alt={postAuthorName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  display: "block",
                                }}
                              />
                            ) : (
                              postAuthorName.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div>
                            <strong>{postAuthorName}</strong>
                            <span>
                              @{postAuthorUsername} · {formatTime(post.createdAt)}
                            </span>
                          </div>
                        </div>

                        <span className="profile-post-category">
                          {post.category || "General"}
                        </span>
                      </div>

                      <p className="profile-post-content">{post.content}</p>

                    
{(Array.isArray(post.media) && post.media.length > 0) ? (
  <div
    className="profile-post-media"
    style={{
      display: "grid",
      gridTemplateColumns:
        post.media.length > 1
          ? "repeat(2, minmax(0, 1fr))"
          : "1fr",
      gap: "8px",
      marginTop: "12px",
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
    maxHeight: post.media.length > 1 ? "300px" : "520px",
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
              loading="lazy"
             style={{
  display: "block",
  maxWidth: "100%",
  maxHeight: post.media.length > 1 ? "300px" : "520px",
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
  maxHeight: "520px",
  width: "auto",
  height: "auto",
  margin: "12px auto 0",
  borderRadius: "12px",
}}
  />
) : null}


                      <div className="profile-post-actions">
                        <span>♡ {likeCount}</span>
                        <span>○ {commentCount}</span>
                        <Link to={`/post/${postId}`}>View Post →</Link>

                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(postId)}
                            disabled={deletingId === postId}
                            style={{
                              color: "#c62828",
                              border: "1px solid #e5b8b8",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              cursor:
                                deletingId === postId ? "wait" : "pointer",
                              background: "transparent",
                              marginLeft: "auto",
                            }}
                          >
                            {deletingId === postId
                              ? "Deleting..."
                              : "🗑 Delete"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <aside className="profile-sidebar">
            <div className="profile-side-card">
              <span className="section-label">
                {isOwnProfile ? "ABOUT YOU" : "ABOUT"}
              </span>
              <h3>{isOwnProfile ? "Your LINKUP profile" : displayName}</h3>
              <p>
                {profile.bio ||
                  "This user hasn't added a bio yet."}
              </p>

              {isOwnProfile && (
                <Link
                  to="/edit-profile"
                  className="profile-side-link"
                >
                  Update your profile →
                </Link>
              )}
            </div>

            <div className="profile-side-card">
              <span className="section-label">INTERESTS</span>

              <div className="profile-interest-list">
                {(profile.interests?.length
                  ? profile.interests
                  : ["No interests added"]
                ).map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Profile;
