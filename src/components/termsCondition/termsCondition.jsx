import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import './termsCondition.css';

const sections = [
  {
    id: 1,
    title: 'Acceptance of Terms',
    body: `By accessing or using this app, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, please do not use our service. We reserve the right to update these terms at any time, and continued use of the app constitutes acceptance of any changes.`,
  },
  {
    id: 2,
    title: 'User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use. We reserve the right to terminate accounts that violate our community guidelines.`,
  },
  {
    id: 3,
    title: 'Content & Conduct',
    body: `You retain ownership of content you post, but grant us a non-exclusive license to display it within the platform. You agree not to post content that is harmful, offensive, or violates the rights of others. We may remove content that violates these guidelines without prior notice.`,
  },
  {
    id: 4,
    title: 'Privacy & Data',
    body: `We collect and process personal data as described in our Privacy Policy. By using the app you consent to such processing. We implement industry-standard security measures to protect your information, but cannot guarantee absolute security.`,
  },
  {
    id: 5,
    title: 'Intellectual Property',
    body: `All platform content, design, and code are owned by or licensed to us and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    id: 6,
    title: 'Limitation of Liability',
    body: `To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app. Our total liability shall not exceed the amount you paid us in the past twelve months, if any.`,
  },
];

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE':
      return {
        ...state,
        openId: state.openId === action.payload ? null : action.payload,
      };
    default:
      return state;
  }
}

function TermsAndcondition() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, { openId: null });

  return (
    <div className="tc-wrapper">

      {/* Header */}
      <div className="tc-header">
        <button className="tc-back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h1 className="tc-title">Terms & Conditions</h1>
        <div className="tc-spacer" />
      </div>

      <div className="tc-content">

        {/* Intro */}
        <div className="tc-intro">
          <p className="tc-intro-date">Last updated: January 2025</p>
          <p className="tc-intro-text">
            Please read these terms carefully before using our platform.
            They govern your access and use of all features and services.
          </p>
        </div>

        {/* Accordion */}
        <div className="tc-accordion">
          {sections.map((sec, i) => {
            const isOpen = state.openId === sec.id;
            return (
              <div
                key={sec.id}
                className={`tc-item ${isOpen ? 'open' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <button
                  className="tc-item-header"
                  onClick={() => dispatch({ type: 'TOGGLE', payload: sec.id })}
                >
                  <span className="tc-item-num">{String(sec.id).padStart(2, '0')}</span>
                  <span className="tc-item-title">{sec.title}</span>
                  <span className={`tc-item-chevron ${isOpen ? 'rotated' : ''}`}>
                    <FontAwesomeIcon icon={faChevronDown} />
                  </span>
                </button>
                <div className="tc-item-body">
                  <p className="tc-item-text">{sec.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="tc-footer-note">
          <p>Questions? Contact us at <span className="tc-link">support@yourapp.com</span></p>
        </div>

      </div>
    </div>
  );
}

export default TermsAndcondition;