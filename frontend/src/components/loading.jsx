function Loading({ text = "Loading..." }) {
  return (
    <div className="loading-wrapper">
      <div className="loading-spinner"></div>
      <p>{text}</p>
    </div>
  );
}

export default Loading;