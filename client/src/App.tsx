import "./App.css";

function App() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div
          className="logo"
          onClick={() => scrollToSection("home")}
          style={{ cursor: "pointer" }}
        >
          Travel<span>Boost</span>
        </div>

        <div className="nav-links">
          <button onClick={() => scrollToSection("home")}>
            Home
          </button>

          <button onClick={() => scrollToSection("destinations")}>
            Explore
          </button>

          <button onClick={() => scrollToSection("about")}>
            About
          </button>
        </div>

        <button
          className="login-btn"
          onClick={() => scrollToSection("destinations")}
        >
          Get Started
        </button>
      </nav>

      {/* HERO SECTION */}
      <main id="home" className="hero">
        <div className="hero-content">
          <p className="tag">✈ PLAN • EXPLORE • EXPERIENCE</p>

          <h1>
            Discover the world.
            <br />
            <span>One journey at a time.</span>
          </h1>

          <p className="description">
            TravelBoost helps you discover amazing destinations, plan
            unforgettable trips, and make every journey easier.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => scrollToSection("destinations")}
            >
              Start Exploring →
            </button>

            <button
              className="secondary-btn"
              onClick={() => scrollToSection("about")}
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-card">
         <button
  type="button"
  className="floating-card card-two clickable"
  onClick={() => scrollToSection("about")}
>
  ✈ <span>Plan Trips</span>
</button>
          <div className="globe">🌍</div>

          <button
  type="button"
  className="floating-card card-one clickable"
  onClick={() => scrollToSection("destinations")}
>
  📍 <span>Explore Places</span>
</button>
        </div>
      </main>

      {/* POPULAR DESTINATIONS */}
      <section id="destinations" className="destinations">
        <div className="section-heading">
          <p>EXPLORE INDIA</p>
          <h2>Popular Destinations</h2>
          <span>
            Discover places worth adding to your next adventure.
          </span>
        </div>

        <div className="destination-grid">

          <div className="destination-card manali">
            <div className="destination-overlay">
              <div>
                <h3>Manali</h3>
                <p>Himachal Pradesh</p>
              </div>

              <button
                className="destination-btn"
                onClick={() => alert("Manali details coming soon!")}
              >
                →
              </button>
            </div>
          </div>

          <div className="destination-card goa">
            <div className="destination-overlay">
              <div>
                <h3>Goa</h3>
                <p>India</p>
              </div>

              <button
                className="destination-btn"
                onClick={() => alert("Goa details coming soon!")}
              >
                →
              </button>
            </div>
          </div>

          <div className="destination-card jaipur">
            <div className="destination-overlay">
              <div>
                <h3>Jaipur</h3>
                <p>Rajasthan</p>
              </div>

              <button
                className="destination-btn"
                onClick={() => alert("Jaipur details coming soon!")}
              >
                →
              </button>
            </div>
          </div>

          <div className="destination-card kerala">
            <div className="destination-overlay">
              <div>
                <h3>Kerala</h3>
                <p>God's Own Country</p>
              </div>

              <button
                className="destination-btn"
                onClick={() => alert("Kerala details coming soon!")}
              >
                →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="about" className="features">

        <div
          className="feature clickable"
          onClick={() => scrollToSection("destinations")}
        >
          <div className="feature-icon">🗺️</div>
          <h3>Discover</h3>
          <p>Find amazing destinations and hidden gems.</p>
        </div>

        <div className="feature clickable">
          <div className="feature-icon">📅</div>
          <h3>Plan</h3>
          <p>Create your perfect travel itinerary effortlessly.</p>
        </div>

        <div className="feature clickable">
          <div className="feature-icon">🚀</div>
          <h3>Experience</h3>
          <p>Make unforgettable memories wherever you go.</p>
        </div>

      </section>
    </div>
  );
}

export default App;