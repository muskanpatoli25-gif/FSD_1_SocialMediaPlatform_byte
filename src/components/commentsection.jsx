function CommentSection({ comments = [] }) {
  return (
    <section className="comment-section">
      <div className="comment-section-header">
        <h3>Comments</h3>
        <span>{comments.length}</span>
      </div>

      <form className="comment-form">
        <input
          type="text"
          placeholder="Write a comment..."
        />

        <button type="submit">
          Post
        </button>
      </form>

      <div className="comment-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <span>○</span>
            <p>No comments yet. Be the first to comment.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="comment-item"
            >
              <div className="comment-avatar">
                {comment.author.charAt(0)}
              </div>

              <div className="comment-content">
                <div className="comment-top">
                  <strong>{comment.author}</strong>
                  <span>{comment.time}</span>
                </div>

                <p>{comment.text}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default CommentSection;