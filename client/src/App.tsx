import { useState } from "react";
import "./App.css";

type Destination = {
  name: string;
  location: string;
  image: string;
  description: string;
  bestTime: string;
  activities: string[];
};

const destinations: Destination[] = [
  {
    name: "Manali",
    location: "Himachal Pradesh",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=85",
    description:
      "Manali is a beautiful Himalayan destination known for snow-covered mountains, adventure activities, peaceful valleys, and breathtaking landscapes.",
    bestTime: "October to June",
    activities: [
      "Snow Activities",
      "Trekking",
      "Paragliding",
      "Camping",
      "River Rafting",
    ],
  },
  {
    name: "Goa",
    location: "India",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=85",
    description:
      "Goa is famous for its beautiful beaches, vibrant nightlife, Portuguese architecture, delicious seafood, and relaxing tropical atmosphere.",
    bestTime: "November to February",
    activities: [
      "Beach Hopping",
      "Water Sports",
      "Nightlife",
      "Scuba Diving",
      "Local Food",
    ],
  },
  {
    name: "Jaipur",
    location: "Rajasthan",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=85",
    description:
      "Jaipur, also known as the Pink City, is famous for its magnificent forts, royal palaces, colorful markets, rich culture, and traditional Rajasthani food.",
    bestTime: "October to March",
    activities: [
      "Amber Fort",
      "City Palace",
      "Hawa Mahal",
      "Shopping",
      "Local Food",
    ],
  },
  {
    name: "Kerala",
    location: "God's Own Country",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=85",
    description:
      "Kerala is known for its peaceful backwaters, lush greenery, beautiful beaches, wildlife, traditional culture, and relaxing houseboat experiences.",
    bestTime: "September to March",
    activities: [
      "Houseboat",
      "Backwaters",
      "Wildlife",
      "Ayurveda",
      "Beach Visits",
    ],
  },
];

function App() {
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const scrollToSection = (sectionId: string) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          Travel<span>Boost</span>
        </div>

        <div className="nav-links">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("home");
            }}
          >
            Home
          </a>

          <a
            href="#destinations"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("destinations");
            }}
          >
            Explore
          </a>

          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("about");
            }}
          >
            About
          </a>
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

        {/* HERO VISUAL */}
        <div className="hero-card">
          <div className="floating-card card-one">
            📍 <span>Explore Places</span>
          </div>

          <div className="globe">🌍</div>

          <div className="floating-card card-two">
            ✈ <span>Plan Trips</span>
          </div>
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
          {destinations.map((destination) => (
            <div
              className="destination-card"
              key={destination.name}
              style={{
                backgroundImage: `url(${destination.image})`,
              }}
              onClick={() => setSelectedDestination(destination)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedDestination(destination);
                }
              }}
            >
              <div className="destination-overlay">
                <div>
                  <h3>{destination.name}</h3>
                  <p>{destination.location}</p>
                </div>

                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="about" className="features">
        <div className="feature">
          <div className="feature-icon">🗺️</div>

          <h3>Discover</h3>

          <p>
            Find amazing destinations and hidden gems.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">📅</div>

          <h3>Plan</h3>

          <p>
            Create your perfect travel itinerary effortlessly.
          </p>
        </div>

        <div className="feature">
          <div className="feature-icon">🚀</div>

          <h3>Experience</h3>

          <p>
            Make unforgettable memories wherever you go.
          </p>
        </div>
      </section>

      {/* DESTINATION MODAL */}
      {selectedDestination && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDestination(null)}
        >
          <div
            className="destination-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedDestination(null)}
              aria-label="Close destination details"
            >
              ×
            </button>

            {/* MODAL IMAGE */}
            <div
              className="modal-image"
              style={{
                backgroundImage: `url(${selectedDestination.image})`,
              }}
            />

            {/* MODAL CONTENT */}
            <div className="modal-content">
              <p className="modal-location">
                📍 {selectedDestination.location}
              </p>

              <h2>{selectedDestination.name}</h2>

              <p className="modal-description">
                {selectedDestination.description}
              </p>

              <div className="modal-info">
                <div className="info-box">
                  <span>Best Time to Visit</span>

                  <strong>
                    {selectedDestination.bestTime}
                  </strong>
                </div>

                <div className="info-box">
                  <span>Popular Activities</span>

                  <div className="activities">
                    {selectedDestination.activities.map(
                      (activity) => (
                        <span
                          className="activity-tag"
                          key={activity}
                        >
                          {activity}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <button
                className="plan-trip-btn"
                onClick={() => {
                  setSelectedDestination(null);
                  alert(
                    `Trip planning for ${selectedDestination.name} will be added soon!`
                  );
                }}
              >
                Plan a Trip →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;