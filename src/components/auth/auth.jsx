import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import API from '../api/api';
import { toast } from 'react-toastify';
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
    <div className="auth-bg-container">
      <div className="wallpaper-container">
        <div className="wallpaper-card">
          <h1 className='wallpp-h1 lg-heading'>Where Conversations Matter.</h1>
          <h1 className='wallpp-h1 lg-heading'>Not Just Numbers.</h1>
          <p className='wallpp-p'>
            A social experience built for authentic connections,
            thoughtful discussions, and lasting communities.
          </p>
        </div>
      </div>
      <div className="auth-continer">
        <div className="auth-card">
          {/* register form */}
          {redirect.register && <form
            className="auth-form"
            onSubmit={handleRegisterSubmit}
          >
            <div>
              <h1 className="auth-heading lg-heading">Create account</h1>
              <p className="auth-subheading mt-3">Join a community of learners and educators</p>
            </div>
            <div className="form-group">
              <label className="label"  htmlFor="reg-username">Username</label>
              <input
                type="text"
                id="reg-username"
                className='input'
                placeholder="Your username"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="label"  htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                className='input'
                placeholder="you@example.com"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>
            <div className='d-flex gap-2'>
              <div className="form-group flex-grow-1">
                <label className="label"  htmlFor="reg-password">Password</label>
                <input
                  type="password"
                  id="reg-password"
                  className='input'
                  placeholder="Create a password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group flex-grow-1">
                <label className="label"  htmlFor="reg-confirm-password">Confirm password</label>
                <input
                  type="password"
                  id="reg-confirm-password"
                  className='input'
                  placeholder="Repeat your password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="form-btn">
              <button type="submit" disabled={loading} className='bttn'>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Creating account...
                  </>
                ) : 'Sign Up'}
              </button>
            </div>
            
            <div>
              <div className="form-divider text-secondary"><span>already a member?</span></div>
              <div className="form-redirect mt-3">
                <p className='link'>
                  <span onClick={() => handleRedirect('login')}>Log in to your account</span>
                </p>
              </div>
            </div>
          </form>}
          {/* login form */}
          {redirect.login && <form
            className="auth-form"
            onSubmit={handleLoginSubmit}
          >
            <div>
              <h1 className="auth-heading lg-heading">Welcome back</h1>
              <p className="auth-subheading">Log in to your Skillswap account</p>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                className='input'
                placeholder="you@example.com"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                className='input'
                placeholder="Your password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-btn">
              <button type="submit" disabled={loading} className='bttn'>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Logging in...
                  </>
                ) : 'Log In'}
              </button>
            </div>

            <div>
              <div className="form-divider text-secondary"><span>new here?</span></div>
              <div className="form-redirect mt-3">
                <p className='link'>
                  <span onClick={() => handleRedirect('register')}>Create an account</span>
                </p>
              </div>       
            </div>
          </form>}
        </div>
      </div>
    </div>
  );
}

export default Auth;
