
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function CreatePost() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
const [mediaPreviews, setMediaPreviews] = useState([]);
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const displayName = user?.name || "User";
  const username = user?.username || "";
  const initial = displayName.charAt(0).toUpperCase();

const handleMediaChange = (event) => {
  const files = Array.from(event.target.files || []);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
  ];

  if (files.some((file) => !allowedTypes.includes(file.type))) {
    setError("Please select JPG, PNG, WEBP, GIF, MP4, or WEBM files.");
    event.target.value = "";
    return;
  }

  if (files.some((file) => file.size > 10 * 1024 * 1024)) {
    setError("Each media file must be 10 MB or smaller.");
    event.target.value = "";
    return;
  }

  if (files.length > 4) {
    setError("You can select up to 4 media files.");
    event.target.value = "";
    return;
  }

  setError("");
  setMediaFiles(files);

  setMediaPreviews(
    files.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }))
  );
};

  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Please log in before creating a post.");
      return;
    }

    if (!content.trim() && mediaFiles.length === 0) {
      setError("Please write something or add a photo/video.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("content", content.trim());
      formData.append("category", category);

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      await axios.post(
        "http://localhost:5000/api/posts",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Post published successfully!");

      setTimeout(() => {
        navigate("/home");
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to publish your post. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="app-shell">
      <Navbar />

      <main className="create-post-page">
        <div className="create-post-header">
          <div>
            <span className="section-label">SHARE SOMETHING</span>
            <h1>Create a post</h1>
            <p>
              Share your thoughts, ideas, and moments with the LINKUP community.
            </p>
          </div>

          <Link to="/home" className="create-back-button">
            ← Back to Home
          </Link>
        </div>

        <div className="create-post-layout">
          <section className="create-post-card">
            <div className="create-post-user">
              <div className="create-post-avatar">{initial}</div>

              <div>
                <strong>{displayName}</strong>
                <span>@{username}</span>
              </div>
            </div>

            <form className="create-post-form" onSubmit={handleSubmit}>
              <div className="create-post-field">
                <label htmlFor="post-content">What's on your mind?</label>

                <textarea
                  id="post-content"
                  name="content"
                  placeholder="Share something with your community..."
                  rows="7"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={5000}
                />

                <span className="field-hint">
                  {content.length}/5000 characters
                </span>
              </div>

              <div className="create-post-field">
                <label htmlFor="post-category">Category</label>

                <select
                  id="post-category"
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="technology">Technology</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>

              
<div className="create-media-box">
  <div className="create-media-icon">＋</div>

  <div>
    <strong>Add photos or videos</strong>
    <span>Up to 4 files, maximum 10 MB each.</span>
  </div>

  <label className="create-media-browse">
    Browse
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
      multiple
      hidden
      onChange={handleMediaChange}
    />
  </label>
</div>

{mediaPreviews.length > 0 && (
  <div className="create-media-previews">
    {mediaPreviews.map((media, index) => (
      <div className="create-media-preview" key={media.url}>
        {media.type.startsWith("image/") ? (
          <img src={media.url} alt={media.name} />
        ) : (
          <video src={media.url} controls />
        )}

        <button
          type="button"
          onClick={() => {
            URL.revokeObjectURL(media.url);

            setMediaFiles((previous) =>
              previous.filter((_, i) => i !== index)
            );

            setMediaPreviews((previous) =>
              previous.filter((_, i) => i !== index)
            );
          }}
        >
          Remove
        </button>

        <span>{media.name}</span>
      </div>
    ))}
  </div>
)}


              {error && <p role="alert">{error}</p>}
              {success && <p role="status">{success}</p>}

              <div className="create-post-actions">
                <button
                  type="button"
                  className="create-cancel-button"
                  onClick={() => navigate("/home")}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-submit-button"
                  disabled={saving}
                >
                  {saving ? "Publishing..." : "Publish Post"}
                  <span>→</span>
                </button>
              </div>
            </form>
          </section>

          <aside className="create-post-sidebar">
            <div className="create-tip-card">
              <span className="create-tip-icon">✦</span>

              <h3>Make it meaningful</h3>

              <p>
                Share something useful, interesting, or inspiring
                with your community.
              </p>
            </div>

            <div className="create-guidelines-card">
              <span className="section-label">POST GUIDELINES</span>

              <ul>
                <li>Be respectful to other members.</li>
                <li>Share relevant and meaningful content.</li>
                <li>Avoid harmful or misleading information.</li>
                <li>Keep the community welcoming.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CreatePost;
