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

  // State declarations
  const [redirect, setRedirect] = useState({
    login: true,
    register: false,
  });
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Wallpaper animation effect
  useEffect(() => {
    const root = wallpaperRef.current;
    if (!root) return;

    const bubble = root.querySelector('.interactive');
    if (!bubble) return;

    let curX = 0, curY = 0;
    let tgX = 0, tgY = 0;
    const rect = root.getBoundingClientRect();
    
    // Initialize at center
    tgX = rect.width / 2;
    tgY = rect.height / 2;

    const move = () => {
      // Smooth easing
      curX += (tgX - curX) / 15;
      curY += (tgY - curY) / 15;
      
      // Apply transform - remove the -50% offset since it's in CSS
      bubble.style.transform = `translate(${curX}px, ${curY}px)`;
      
      raf = requestAnimationFrame(move);
    };

    const onMove = (e) => {
      const rect = root.getBoundingClientRect();
      // Get mouse position relative to the container
      tgX = e.clientX - rect.left;
      tgY = e.clientY - rect.top;
    };

    const onLeave = () => {
      // Return bubble to center when mouse leaves
      const rect = root.getBoundingClientRect();
      tgX = rect.width / 2;
      tgY = rect.height / 2;
    };

    let raf = requestAnimationFrame(move);
    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRedirect = (name) => {
    setRedirect({
      login: false,
      register: false,
      [name]: true,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      email: form.email,
      password: form.password,
    };

    try {
      const response = await API.post('/login', payload);
      console.log(response);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast.success(response.data.message)
      props.setIsAuthenticated(true);
    } catch (error) {
      console.log(error.response);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      console.log('password mismatch');
      toast.error('Passwords do not match');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
    };
    
    try {
      const response = await API.post('/register', payload);
      console.log(response);
      toast.success('Registration successful! Please login.');
      handleRedirect('login');
    } catch (error) {
      console.log(error.response);
      toast.error(error.response.data.message);
    } finally {
      setLoading(true);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row auth-row m-0">
        {/* Left side - Wallpaper */}
        <div className="col-6 auth-card d-none d-lg-block">
          <div className="auth-wallpaper" ref={wallpaperRef}>
            <svg xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="goo-auth">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                    result="goo"
                  />
                  <feBlend in="SourceGraphic" in2="goo" />
                </filter>
              </defs>
            </svg>

            <div className="auth-gradients">
              <div className="g1"></div>
              <div className="g2"></div>
              <div className="g3"></div>
              <div className="g4"></div>
              <div className="g5"></div>
              <div className="interactive"></div>
            </div>

            <div className="auth-content-overlap">
              <div className="star-container">
                <FontAwesomeIcon icon={faStar} className="faStar" />
              </div>
              <div className="text-container">
                <p>Skill swap everyday</p>
                <h1>
                  Share your skills with world, get inspire from others achievements and learn.
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Forms */}
        <div className="col-12 col-lg-6 auth-card">
          {/* Register form */}
          <form
            className={`auth-form register ${redirect.register ? 'show' : ''}`}
            onSubmit={handleRegisterSubmit}
          >
            <h1 className="auth-heading">Create an account</h1>
            <p className="auth-subheading">
              Join our community of learners and educators
            </p>

            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                type="text"
                id="reg-username"
                placeholder="Enter your username"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Your email</label>
              <input
                type="email"
                id="reg-email"
                placeholder="Enter your email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                placeholder="Enter your password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password">Confirm password</label>
              <input
                type="password"
                id="reg-confirm-password"
                placeholder="Confirm your password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-btn">
              <button type="submit" className="btn btn-primary">
                Sign Up
              </button>
            </div>

            <div className="form-redirect">
              <p>
                Already have an account?{' '}
                <span onClick={() => handleRedirect('login')}>Log in</span>
              </p>
            </div>
          </form>

          {/* Login form */}
          <form
            className={`auth-form login ${redirect.login ? 'show' : ''}`}
            onSubmit={handleLoginSubmit}
          >
            <h1 className="auth-heading">Login</h1>

            <div className="form-group">
              <label htmlFor="login-email">Your email</label>
              <input
                type="email"
                id="login-email"
                placeholder="Enter your email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                placeholder="Enter your password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-btn">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>

            <div className="form-redirect">
              <p>
                Don't have an account?{' '}
                <span onClick={() => handleRedirect('register')}>Sign up</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;