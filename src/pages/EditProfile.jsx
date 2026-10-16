
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api/auth";

function EditProfile() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    profileImage: "",
    interests: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!active) return;

        const profile = response.data.user;

        setFormData({
          name: profile.name || "",
          username: profile.username || "",
          bio: profile.bio || "",
          location: profile.location || "",
          website: profile.website || "",
          profileImage: profile.profileImage || "",
          interests: profile.interests || [],
        });
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      setError("Please log in to edit your profile.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // Resize and compress the selected image before saving it.
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    // Avoid processing unusually large original files.
    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxDimension = 400;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          setError("Unable to process this image.");
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedImage = canvas.toDataURL("image/jpeg", 0.75);

        // Keep the image small enough for a profile field.
        if (compressedImage.length > 700000) {
          setError("This image could not be compressed enough. Try another image.");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          profileImage: compressedImage,
        }));

        setMessage("Image selected. Save changes to apply it.");
      };

      image.onerror = () => {
        setError("Unable to open this image. Please try another one.");
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const normalizedWebsite = formData.website.trim();

      if (
        normalizedWebsite &&
        !/^https?:\/\/.+/i.test(normalizedWebsite)
      ) {
        setError("Website must start with https:// or http://");
        setSaving(false);
        return;
      }

      const response = await axios.put(
        `${API_URL}/me`,
        {
          name: formData.name,
          username: formData.username,
          bio: formData.bio,
          location: formData.location,
          website: normalizedWebsite,
          profileImage: formData.profileImage,
          interests: formData.interests,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data.user;

      // Keep the existing AuthContext login signature.
      login(token, updatedUser);

      setFormData((prev) => ({
        ...prev,
        name: updatedUser.name || "",
        username: updatedUser.username || "",
        bio: updatedUser.bio || "",
        location: updatedUser.location || "",
        website: updatedUser.website || "",
        profileImage: updatedUser.profileImage || "",
        interests: updatedUser.interests || [],
      }));

      setMessage("Profile updated successfully!");

      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const displayName = formData.name || "Your name";
  const displayUsername = formData.username
    ? `@${formData.username.replace(/^@/, "")}`
    : "@username";

  const avatarContent = (
    <span>
      {formData.profileImage ? (
        <img
          src={formData.profileImage}
          alt="Profile preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
            display: "block",
          }}
        />
      ) : (
        displayName.charAt(0).toUpperCase()
      )}
    </span>
  );

  return (
    <div className="app-shell">
      <Navbar />

      <main className="edit-profile-page">
        <div className="edit-profile-header">
          <div>
            <span className="section-label">ACCOUNT SETTINGS</span>
            <h1>Edit Profile</h1>
            <p>
              Update your profile information and how people see you.
            </p>
          </div>

          <Link to="/profile" className="edit-back-button">
            ← Back to Profile
          </Link>
        </div>

        {loading ? (
          <p>Loading your profile...</p>
        ) : (
          <div className="edit-profile-layout">
            <section className="edit-profile-card">
              <div className="edit-profile-card-heading">
                <h2>Profile information</h2>
                <p>Keep your information up to date.</p>
              </div>

              <div className="edit-avatar-section">
                <div className="edit-avatar">
                  {avatarContent}
                </div>

                <div>
                  <strong>Profile picture</strong>
                  <span>JPG, PNG or WEBP. Maximum 10MB original file.</span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    hidden
                  />

                  <button
                    type="button"
                    className="change-photo-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change photo
                  </button>

                  {formData.profileImage && (
                    <button
                      type="button"
                      className="change-photo-button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          profileImage: "",
                        }));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                        setMessage("Profile photo will be removed when you save.");
                        setError("");
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <form
                className="edit-profile-form"
                onSubmit={handleSubmit}
              >
                <div className="edit-form-grid">
                  <div className="edit-field">
                    <label htmlFor="full-name">Full name</label>
                    <input
                      id="full-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="edit-field">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="edit-field">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="5"
                    value={formData.bio}
                    onChange={handleChange}
                  />
                  <span className="field-hint">
                    Tell people a little about yourself.
                  </span>
                </div>

                <div className="edit-form-grid">
                  <div className="edit-field">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Hyderabad, Pakistan"
                    />
                  </div>

                  <div className="edit-field">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                {error && <p role="alert">{error}</p>}
                {message && <p role="status">{message}</p>}

                <div className="edit-profile-actions">
                  <Link to="/profile" className="edit-cancel-button">
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="edit-save-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                    <span>✓</span>
                  </button>
                </div>
              </form>
            </section>

            <aside className="edit-profile-sidebar">
              <div className="edit-side-card">
                <span className="section-label">PROFILE PREVIEW</span>

                <div className="preview-user">
                  <div className="preview-avatar">
                    {avatarContent}
                  </div>

                  <div>
                    <strong>{displayName}</strong>
                    <span>{displayUsername}</span>
                  </div>
                </div>

                <p>{formData.bio || "Your bio will appear here."}</p>

                {formData.location && (
                  <p>📍 {formData.location}</p>
                )}

                {formData.website && (
                  <p>
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {formData.website}
                    </a>
                  </p>
                )}
              </div>

              <div className="edit-side-card">
                <span className="section-label">TIP</span>
                <h3>Make your profile stand out</h3>
                <p>
                  A clear profile picture, short bio, and relevant
                  information help people understand who you are.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default EditProfile;
