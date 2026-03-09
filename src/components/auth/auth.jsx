import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import API from '../api/api';
import { toast } from 'react-toastify';
import './wallpaper.css';
import './auth.css';

function Auth(props) {
  const { setUser } = useContext(AuthContext);
  const wallpaperRef = useRef(null);

  const [redirect, setRedirect] = useState({ login: true, register: false });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // ── wallpaper mouse tracking ──────────────────────────
  useEffect(() => {
    const root = wallpaperRef.current;
    if (!root) return;
    const bubble = root.querySelector('.interactive');
    if (!bubble) return;

    let curX = 0, curY = 0, tgX = 0, tgY = 0, raf;
    const rect = root.getBoundingClientRect();
    tgX = rect.width / 2;
    tgY = rect.height / 2;

    const move = () => {
      curX += (tgX - curX) / 15;
      curY += (tgY - curY) / 15;
      bubble.style.transform = `translate(${curX}px, ${curY}px)`;
      raf = requestAnimationFrame(move);
    };

    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      tgX = e.clientX - r.left;
      tgY = e.clientY - r.top;
    };

    const onLeave = () => {
      const r = root.getBoundingClientRect();
      tgX = r.width / 2;
      tgY = r.height / 2;
    };

    raf = requestAnimationFrame(move);
    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // ── handlers ─────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRedirect = (name) => {
    setRedirect({ login: false, register: false, [name]: true });
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/login', {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast.success(response.data.message);
      props.setIsAuthenticated(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await API.post('/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success('Registration successful! Please login.');
      handleRedirect('login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row auth-row m-0">

        {/* ── left: animated wallpaper ── */}
        <div className="col-6 auth-card d-none d-lg-block">
          <div className="auth-wallpaper" ref={wallpaperRef}>
            <svg xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="goo-auth">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                  <feColorMatrix
                    in="blur" mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                    result="goo"
                  />
                  <feBlend in="SourceGraphic" in2="goo" />
                </filter>
              </defs>
            </svg>

            <div className="auth-gradients">
              <div className="g1" />
              <div className="g2" />
              <div className="g3" />
              <div className="g4" />
              <div className="g5" />
              <div className="interactive" />
            </div>

            <div className="auth-content-overlap">
              <div className="star-container">
                <FontAwesomeIcon icon={faStar} className="faStar" />
                <span className="auth-brand-name">Skillswap</span>
              </div>
              <div className="text-container">
                <p>Skill swap everyday</p>
                <h1>Share your skills with the world. Get inspired. Learn from others.</h1>
              </div>
            </div>
          </div>
        </div>

        {/* ── right: forms ── */}
        <div className="col-12 col-lg-6 auth-card">

          {/* register form */}
          <form
            className={`auth-form register ${redirect.register ? 'show' : ''}`}
            onSubmit={handleRegisterSubmit}
          >
            <h1 className="auth-heading">Create account</h1>
            <p className="auth-subheading">Join a community of learners and educators</p>

            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                type="text"
                id="reg-username"
                placeholder="Your username"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                placeholder="you@example.com"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                placeholder="Create a password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password">Confirm password</label>
              <input
                type="password"
                id="reg-confirm-password"
                placeholder="Repeat your password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-btn">
              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Creating account...
                  </>
                ) : 'Sign Up'}
              </button>
            </div>

            <div className="form-divider"><span>already a member?</span></div>

            <div className="form-redirect">
              <p>
                <span onClick={() => handleRedirect('login')}>Log in to your account</span>
              </p>
            </div>
          </form>

          {/* login form */}
          <form
            className={`auth-form login ${redirect.login ? 'show' : ''}`}
            onSubmit={handleLoginSubmit}
          >
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-subheading">Log in to your Skillswap account</p>

            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                placeholder="you@example.com"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                placeholder="Your password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-btn">
              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Logging in...
                  </>
                ) : 'Log In'}
              </button>
            </div>

            <div className="form-divider"><span>new here?</span></div>

            <div className="form-redirect">
              <p>
                <span onClick={() => handleRedirect('register')}>Create an account</span>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

export default Auth;