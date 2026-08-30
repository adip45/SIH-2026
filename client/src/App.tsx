import { useState } from "react";
import "./App.css";

type Destination = {
  id: string;
  name: string;
  location: string;
  image: string;
  description: string;
  bestTime: string;
  duration: string;
  highlights: string[];
};

const destinations: Destination[] = [
  {
    id: "manali",
    name: "Manali",
    location: "Himachal Pradesh",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    description:
      "Manali is a beautiful Himalayan destination known for snow-covered mountains, pine forests, rivers, adventure sports, and breathtaking views.",
    bestTime: "October to June",
    duration: "3–5 Days",
    highlights: [
      "Solang Valley",
      "Rohtang Pass",
      "Old Manali",
      "Hadimba Temple",
    ],
  },
  {
    id: "goa",
    name: "Goa",
    location: "India",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    description:
      "Goa is famous for beautiful beaches, vibrant nightlife, Portuguese heritage, delicious seafood, water sports, and relaxed coastal experiences.",
    bestTime: "November to February",
    duration: "3–6 Days",
    highlights: [
      "Baga Beach",
      "Fort Aguada",
      "Dudhsagar Falls",
      "Old Goa",
    ],
  },
  {
    id: "jaipur",
    name: "Jaipur",
    location: "Rajasthan",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    description:
      "Jaipur, the Pink City of India, is known for magnificent forts, royal palaces, colorful markets, traditional food, and rich Rajasthani culture.",
    bestTime: "October to March",
    duration: "2–4 Days",
    highlights: [
      "Amber Fort",
      "Hawa Mahal",
      "City Palace",
      "Jal Mahal",
    ],
  },
  {
    id: "kerala",
    name: "Kerala",
    location: "God's Own Country",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    description:
      "Kerala offers peaceful backwaters, tropical beaches, lush greenery, wildlife, hill stations, and unforgettable cultural experiences.",
    bestTime: "September to March",
    duration: "5–7 Days",
    highlights: [
      "Alleppey Backwaters",
      "Munnar",
      "Kochi",
      "Wayanad",
    ],
  },
];

function App() {
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openDestination = (destination: Destination) => {
    setSelectedDestination(destination);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goBack = () => {
    setSelectedDestination(null);

    setTimeout(() => {
      document.getElementById("destinations")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  };

  /* ================= DESTINATION DETAILS PAGE ================= */

  if (selectedDestination) {
    return (
      <div className="app">
        <nav className="navbar">
          <button
            className="logo logo-button"
            onClick={goBack}
            aria-label="Back to home"
          >
            Travel<span>Boost</span>
          </button>

          <div className="nav-links">
            <button onClick={goBack}>Explore</button>
          </div>

          <button className="login-btn" onClick={goBack}>
            ← Back
          </button>
        </nav>

        <main className="destination-page">
          <section
            className="destination-hero"
            style={{
              backgroundImage: `linear-gradient(
                90deg,
                rgba(7, 19, 33, 0.92),
                rgba(7, 19, 33, 0.45)
              ), url(${selectedDestination.image})`,
            }}
          >
            <button className="back-link" onClick={goBack}>
              ← Back to destinations
            </button>

            <div className="destination-hero-content">
              <p className="tag">
                ✈ EXPLORE • DISCOVER • EXPERIENCE
              </p>

              <h1>{selectedDestination.name}</h1>

              <p className="destination-location">
                📍 {selectedDestination.location}
              </p>
            </div>
          </section>

          <section className="destination-details">
            <div className="details-intro">
              <p className="section-label">
                ABOUT THIS DESTINATION
              </p>

              <h2>
                Discover the beauty of {selectedDestination.name}
              </h2>

              <p className="destination-description">
                {selectedDestination.description}
              </p>
            </div>

            <div className="destination-info-grid">
              <div className="info-card">
                <div className="info-icon">📅</div>

                <p>Best Time</p>

                <h3>{selectedDestination.bestTime}</h3>
              </div>

              <div className="info-card">
                <div className="info-icon">🕒</div>

                <p>Recommended Stay</p>

                <h3>{selectedDestination.duration}</h3>
              </div>

              <div className="info-card">
                <div className="info-icon">⭐</div>

                <p>TravelBoost Pick</p>

                <h3>Highly Recommended</h3>
              </div>
            </div>

            <div className="experiences-section">
              <p className="section-label">
                TOP EXPERIENCES
              </p>

              <h2>Things you shouldn't miss</h2>

              <div className="highlights-grid">
                {selectedDestination.highlights.map(
                  (highlight, index) => (
                    <div
                      className="highlight-card"
                      key={highlight}
                    >
                      <span className="highlight-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>{highlight}</h3>

                      <span className="highlight-arrow">
                        →
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="destination-action">
              <div>
                <p className="section-label">
                  READY TO EXPLORE?
                </p>

                <h2>
                  Start planning your {selectedDestination.name} trip
                </h2>

                <p>
                  Discover places, experiences and travel ideas
                  for your next adventure.
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={goBack}
              >
                Explore More →
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ================= HOME PAGE ================= */

  return (
    <div className="app">
      {/* NAVBAR */}

      <nav className="navbar">
        <button
          className="logo logo-button"
          onClick={() => scrollToSection("home")}
        >
          Travel<span>Boost</span>
        </button>

        <div className="nav-links">
          <button onClick={() => scrollToSection("home")}>
            Home
          </button>

          <button
            onClick={() =>
              scrollToSection("destinations")
            }
          >
            Explore
          </button>

          <button onClick={() => scrollToSection("about")}>
            About
          </button>
        </div>

        <button
          className="login-btn"
          onClick={() =>
            scrollToSection("destinations")
          }
        >
          Get Started
        </button>
      </nav>

      {/* HERO */}

      <main id="home" className="hero">
        <div className="hero-content">
          <p className="tag">
            ✈ PLAN • EXPLORE • EXPERIENCE
          </p>

          <h1>
            Discover the world.
            <br />

            <span>One journey at a time.</span>
          </h1>

          <p className="description">
            TravelBoost helps you discover amazing destinations,
            plan unforgettable trips, and make every journey easier.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() =>
                scrollToSection("destinations")
              }
            >
              Start Exploring →
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                scrollToSection("about")
              }
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-card">
          <button
            type="button"
            className="floating-card card-two"
            onClick={() => scrollToSection("about")}
          >
            ✈ <span>Plan Trips</span>
          </button>

          <div className="globe">🌍</div>

          <button
            type="button"
            className="floating-card card-one"
            onClick={() =>
              scrollToSection("destinations")
            }
          >
            📍 <span>Explore Places</span>
          </button>
        </div>
      </main>

      {/* DESTINATIONS */}

      <section
        id="destinations"
        className="destinations"
      >
        <div className="section-heading">
          <p>EXPLORE INDIA</p>

          <h2>Popular Destinations</h2>

          <span>
            Discover places worth adding to your next adventure.
          </span>
        </div>

        <div className="destination-grid">
          {destinations.map((destination) => (
            <button
              key={destination.id}
              className="destination-card"
              style={{
                backgroundImage: `url(${destination.image})`,
              }}
              onClick={() =>
                openDestination(destination)
              }
            >
              <div className="destination-overlay">
                <div>
                  <h3>{destination.name}</h3>

                  <p>{destination.location}</p>
                </div>

                <span className="destination-btn">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURES */}

      <section id="about" className="features">
        <div
          className="feature clickable"
          onClick={() =>
            scrollToSection("destinations")
          }
        >
          <div className="feature-icon">🗺️</div>

          <h3>Discover</h3>

          <p>
            Find amazing destinations and hidden gems.
          </p>
        </div>

        <div className="feature clickable">
          <div className="feature-icon">📅</div>

          <h3>Plan</h3>

          <p>
            Create your perfect travel itinerary effortlessly.
          </p>
        </div>

        <div className="feature clickable">
          <div className="feature-icon">🚀</div>

          <h3>Experience</h3>

          <p>
            Make unforgettable memories wherever you go.
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;