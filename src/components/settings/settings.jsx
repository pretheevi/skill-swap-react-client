import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faUserPen,
  faPalette,
  faCircleInfo,
  faFileContract,
  faArrowRightFromBracket,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import './settings.css';
import { useTheme } from '../../context/ThemeContext';
const initialState = {
  activeSection: null,
  showLogoutConfirm: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'SHOW_LOGOUT':
      return { ...state, showLogoutConfirm: true };
    case 'HIDE_LOGOUT':
      return { ...state, showLogoutConfirm: false };
    default:
      return state;
  }
}

const settingsItems = [
  {
    id: 'profile',
    label: 'Edit Profile',
    description: 'Update your photo and personal info',
    icon: faUserPen,
    color: '#5B8DEF',
    group: 'account',
  },
  {
    id: 'theme',
    label: 'Appearance',
    description: 'Switch between light and dark mode',
    icon: faPalette,
    color: '#A78BFA',
    group: 'account',
  },
  {
    id: 'about',
    label: 'About Us',
    description: 'Learn more about our mission',
    icon: faCircleInfo,
    color: '#34D399',
    group: 'info',
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    description: 'Read our usage policies',
    icon: faFileContract,
    color: '#FBBF24',
    group: 'info',
  },
];

function Settings() {
  const navigate = useNavigate();
  const { theme, dispatch: dispatchTheme } = useTheme();
  const isDark = theme === 'dark';
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleItemClick = (id) => {
    if (id === 'theme') {
      dispatchTheme({ type: 'TOGGLE' })
      return;
    }
    dispatch({ type: 'SET_SECTION', payload: id });
  };


  return (
    <div className={`st-wrapper ${isDark ? 'theme-dark' : 'theme-light'}`}>

      {/* Header */}
      <div className="st-header">
        <button className="st-back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h1 className="st-title">Settings</h1>
        <div className="st-header-spacer" />
      </div>

      {/* Settings List */}
      <div className="st-content">

        <div className="st-group">
          <p className="st-group-label">Account</p>
          {settingsItems.filter(i => i.group === 'account').map((item) => (
            <button
              key={item.id}
              className="st-item"
              onClick={() => handleItemClick(item.id)}
            >
              <span className="st-item-icon" style={{ background: `${item.color}18`, color: item.color }}>
                <FontAwesomeIcon icon={item.id === 'theme' ? (isDark ? faSun : faMoon) : item.icon} />
              </span>
              <span className="st-item-text">
                <span className="st-item-label">{item.label}</span>
                <span className="st-item-desc">
                  {item.id === 'theme'
                    ? `Currently ${isDark ? 'dark' : 'light'} mode`
                    : item.description}
                </span>
              </span>
              {item.id === 'theme' ? (
                <span className={`st-toggle ${isDark ? 'on' : ''}`}>
                  <span className="st-toggle-thumb" />
                </span>
              ) : (
                <FontAwesomeIcon icon={faChevronRight} className="st-chevron" />
              )}
            </button>
          ))}
        </div>

        <div className="st-group">
          <p className="st-group-label">Info</p>
          {settingsItems.filter(i => i.group === 'info').map((item) => (
            <button
              key={item.id}
              className="st-item"
              onClick={() => handleItemClick(item.id)}
            >
              <span className="st-item-icon" style={{ background: `${item.color}18`, color: item.color }}>
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span className="st-item-text">
                <span className="st-item-label">{item.label}</span>
                <span className="st-item-desc">{item.description}</span>
              </span>
              <FontAwesomeIcon icon={faChevronRight} className="st-chevron" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="st-group">
          <button
            className="st-item st-logout"
            onClick={() => dispatch({ type: 'SHOW_LOGOUT' })}
          >
            <span className="st-item-icon" style={{ background: '#FF4D4F18', color: '#FF4D4F' }}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </span>
            <span className="st-item-text">
              <span className="st-item-label">Log Out</span>
              <span className="st-item-desc">Sign out of your account</span>
            </span>
          </button>
        </div>

      </div>

      {/* Logout Confirm Modal */}
      {state.showLogoutConfirm && (
        <div className="st-overlay" onClick={() => dispatch({ type: 'HIDE_LOGOUT' })}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-icon">
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </div>
            <h2 className="st-modal-title">Log out?</h2>
            <p className="st-modal-desc">You can always log back in at any time.</p>
            <button
              className="st-modal-confirm"
              onClick={() => {
                dispatch({ type: 'HIDE_LOGOUT' });
                navigate('/login');
              }}
            >
              Log Out
            </button>
            <button
              className="st-modal-cancel"
              onClick={() => dispatch({ type: 'HIDE_LOGOUT' })}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;