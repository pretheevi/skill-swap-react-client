import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faHeart,
  faBolt,
  faShield,
  faUsers,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import './aboutUs.css';

const values = [
  { icon: faHeart,   color: '#FF6B8A', label: 'Built with love',      desc: 'Every pixel crafted with care for our community.' },
  { icon: faBolt,    color: '#FBBF24', label: 'Fast & reliable',       desc: 'Optimized for smooth, snappy experiences.' },
  { icon: faShield,  color: '#34D399', label: 'Privacy first',         desc: 'Your data stays yours. Always.' },
  { icon: faUsers,   color: '#5B8DEF', label: 'Community driven',      desc: 'Shaped by feedback from real users like you.' },
  { icon: faGlobe,   color: '#A78BFA', label: 'Open to everyone',      desc: 'Inclusive and accessible by design.' },
];

function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="ab-wrapper">

      {/* Header */}
      <div className="ab-header">
        <button className="ab-back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h1 className="ab-title">About Us</h1>
        <div className="ab-spacer" />
      </div>

      <div className="ab-content">

        {/* Hero */}
        <div className="ab-hero">
          <div className="ab-hero-blob" />
          <div className="ab-hero-inner">
            <div className="ab-logo-ring">
              <span className="ab-logo-emoji">✦</span>
            </div>
            <h2 className="ab-hero-title">Made for people<br />who love sharing</h2>
            <p className="ab-hero-sub">A space to express, connect, and inspire.</p>
          </div>
        </div>

        {/* Mission */}
        <div className="ab-section">
          <p className="ab-section-label">Our Mission</p>
          <p className="ab-mission-text">
            We believe everyone has a story worth sharing. Our platform gives creators
            the tools to express themselves authentically and connect with people who care.
          </p>
        </div>

        {/* Values */}
        <div className="ab-section">
          <p className="ab-section-label">What we stand for</p>
          <div className="ab-values">
            {values.map((v) => (
              <div className="ab-value-item" key={v.label}>
                <span className="ab-value-icon" style={{ background: `${v.color}18`, color: v.color }}>
                  <FontAwesomeIcon icon={v.icon} />
                </span>
                <div className="ab-value-text">
                  <p className="ab-value-label">{v.label}</p>
                  <p className="ab-value-desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version */}
        <div className="ab-version">
          <p className="ab-version-text">Version 1.0.0</p>
          <p className="ab-version-copy">© 2025 · All rights reserved</p>
        </div>

      </div>
    </div>
  );
}

export default AboutUs;