import { Link } from "react-router-dom";

function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-card-header">
        <div className="post-author">
          <div className="post-author-avatar">
            {post.author.charAt(0)}
          </div>

          <div>
            <strong>{post.author}</strong>
            <span>
              {post.username} · {post.time}
            </span>
          </div>
        </div>

        <span className="post-category">
          {post.category}
        </span>
      </div>

      <div className="post-card-content">
        <p>{post.content}</p>

        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="post-card-image"
          />
        )}
      </div>

      <div className="post-card-actions">
        <button type="button">
          ♡ {post.likes}
        </button>

        <Link to={`/post/${post.id}`}>
          ○ {post.comments}
        </Link>

        <button type="button">
          ↗ Share
        </button>
      </div>
    </article>
  );
}

export default PostCard;