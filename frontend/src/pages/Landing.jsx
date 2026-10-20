import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="landing-navbar">
        <Link to="/" className="landing-logo">
          <span className="landing-logo-mark">L</span>
          <span>LINKUP</span>
        </Link>

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-nav-actions">
          <Link to="/login" className="landing-login">
            Log in
          </Link>

          <Link to="/register" className="landing-signup">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-eyebrow">
              <span>✦</span>
              A SOCIAL SPACE FOR YOU
            </div>

            <h1>
              Connect.
              <br />
              <span>Share. Belong.</span>
            </h1>

            <p>
              LINKUP is a modern social platform where you can
              share ideas, discover meaningful conversations, and
              connect with people who share your interests.
            </p>

            <div className="landing-hero-actions">
              <Link to="/register" className="landing-primary-button">
                Create your account
                <span>→</span>
              </Link>

              <Link to="/login" className="landing-secondary-button">
                Sign in
              </Link>
            </div>

            <div className="landing-trust">
              <div className="landing-avatar-stack">
                <span>M</span>
                <span>S</span>
                <span>D</span>
                <span>+</span>
              </div>

              <div>
                <strong>Join the conversation</strong>
                <small>Connect with people and ideas that matter.</small>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="landing-visual">
            <div className="landing-orbit landing-orbit-one"></div>
            <div className="landing-orbit landing-orbit-two"></div>

            <div className="landing-main-card">
              <div className="landing-card-top">
                <div className="landing-card-user">
                  <div className="landing-card-avatar">S</div>

                  <div>
                    <strong>Sarah Mitchell</strong>
                    <span>@sarahm · 2m ago</span>
                  </div>
                </div>

                <span className="landing-card-menu">•••</span>
              </div>

              <p className="landing-card-text">
                The best ideas happen when different perspectives
                come together. Keep sharing what inspires you.
              </p>

              <span className="landing-card-tag">
                Technology
              </span>

              <div className="landing-card-actions">
                <span>♥ 248</span>
                <span>○ 32</span>
                <span>↗ Share</span>
              </div>
            </div>

            <div className="landing-floating-card landing-floating-one">
              <span className="floating-icon">✦</span>

              <div>
                <strong>Your interests</strong>
                <small>Technology · Design · AI</small>
              </div>
            </div>

            <div className="landing-floating-card landing-floating-two">
              <div className="floating-mini-avatar">M</div>

              <div>
                <strong>New connection</strong>
                <small>Someone shares your interests</small>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-features" id="features">
          <div className="landing-section-heading">
            <span>WHY LINKUP</span>

            <h2>
              A better way to
              <br />
              <strong>stay connected.</strong>
            </h2>

            <p>
              Everything you need to share, discover, and build
              meaningful connections in one simple space.
            </p>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <div className="feature-icon">◉</div>
              <span>01</span>

              <h3>Personalized Feed</h3>

              <p>
                Discover posts and conversations based on the
                topics and interests you engage with most.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon">♡</div>
              <span>02</span>

              <h3>Meaningful Connections</h3>

              <p>
                Connect with people, share perspectives, and
                participate in conversations that matter to you.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon">✦</div>
              <span>03</span>

              <h3>Your Own Space</h3>

              <p>
                Build your profile, share your ideas, and create
                a social space that reflects who you are.
              </p>
            </article>
          </div>
        </section>

        {/* About */}
        <section className="landing-about" id="about">
          <div className="landing-about-box">
            <div>
              <span className="landing-about-label">
                BUILT FOR CONNECTION
              </span>

              <h2>
                Your people.
                <br />
                Your ideas.
                <br />
                <strong>Your LINKUP.</strong>
              </h2>
            </div>

            <div className="landing-about-text">
              <p>
                We believe social platforms should feel personal,
                simple, and meaningful.
              </p>

              <p>
                LINKUP brings conversations, interests, and people
                together without unnecessary complexity.
              </p>

              <Link to="/register" className="landing-about-link">
                Join LINKUP →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <Link to="/" className="landing-logo">
          <span className="landing-logo-mark">L</span>
          <span>LINKUP</span>
        </Link>

        <p>© 2026 LINKUP. Connect with what matters.</p>

        <div>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <Link to="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
}

export default Landing;