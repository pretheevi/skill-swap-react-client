import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faHome,
  faGear,
  faDoorOpen,
} from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import API from './components/api/api';
import './App.css';
import { AuthContext } from './context/AuthContext';
import { FeedContext } from './context/FeedContext';

import AppLoader from './components/AppLoader/AppLoader';
import Auth from './components/auth/auth';
import FeedLayout from './components/FeedLayout/feedLayout';
import Chat from './components/chat/chat';
import Post from './components/posts/post';
import Explore from './components/explore';
import Profile from './components/profile/profile';
import FollowUnfollow from './components/followUnfollow';
import Viewpost from './components/viewpost/viewpost';
import EditSkill from './components/editSkill/editSkill';


// ── guards ────────────────────────────────────────────────
function PrivateRoute({ children, isAuthenticated }) {
  return isAuthenticated
    ? children
    : <Navigate to="/auth" replace />;
}

function PublicRoute({ children, isAuthenticated }) {
  return !isAuthenticated
    ? children
    : <Navigate to="/feed" replace />;
}


// ── app ───────────────────────────────────────────────────
function App() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(true);   // ← new: token check in progress
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);

  const [createPost, setCreatePost] = useState(false);

  // ── token verify on mount ──────────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setVerifying(false);
        return;
      }
      try {
        await API.get('/tokenVerify');
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setVerifying(false);   // ← done either way
      }
    };
    verifyToken();
  }, []);

  // ── fetch profile after auth ───────────────────────────
  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/profile');
      setUser(response.data);
    } catch (error) {
      console.log('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchUserProfile();
  }, [isAuthenticated]);

  // ── show skeleton while verifying token ───────────────
  if (verifying) return <AppLoader />;

  // ── main render ────────────────────────────────────────
  return (
    <>
      <ToastContainer />
      <AuthContext.Provider value={{ user, setUser }}>
        <Routes>

          {/* public route — auth page */}
          <Route
            path="/auth"
            element={
              <PublicRoute isAuthenticated={isAuthenticated}>
                <Auth setIsAuthenticated={setIsAuthenticated} />
              </PublicRoute>
            }
          />

          {/* private routes — app */}
          <Route
            path="/*"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <FeedContext.Provider value={{ feed, setFeed }}>
                  <div className="container-fluid layout">
                    <div className="row m-0">

                      {/* desktop sidebar */}
                      <section className="bg-side-bar col-lg-3 d-none d-lg-flex">
                        <div className="dash-logo">
                          <img src="/logo.png" alt="logo" />
                          <h1>Skillswap</h1>
                        </div>

                        <div
                          className="dash-profile-card"
                          onClick={() => navigate(`/feed/profile/${user?.id}`)}
                        >
                          <img
                            src={user?.avatar || '/avatar.jpg'}
                            alt="profile-avatar"
                            className="dash-profile-avatar"
                          />
                          <div className="text-center">
                            <h3 className="dash-profile-account-name">{user?.name}</h3>
                          </div>
                          <div className="dash-profile-info-card">
                            <span className="profile-post-count">
                              <p>{user?.posts_count || 0}</p>
                              <label>Posts</label>
                            </span>
                            <span className="profile-followers-count">
                              <p>{user?.followers_count || 0}</p>
                              <label>Followers</label>
                            </span>
                            <span className="profile-following-count">
                              <p>{user?.following_count || 0}</p>
                              <label>Following</label>
                            </span>
                          </div>
                        </div>

                        <div className="dash-navbar-card">
                          <div className="dash-navbar-item" onClick={() => navigate('/feed')}>
                            <FontAwesomeIcon icon={faHome} />
                            <p>Feed</p>
                          </div>
                          <div className="dash-navbar-item" onClick={() => navigate('/feed/explore')}>
                            <FontAwesomeIcon icon={faSearch} />
                            <p>Explore</p>
                          </div>
                          <div className="dash-navbar-item">
                            <FontAwesomeIcon icon={faGear} />
                            <p>Settings</p>
                          </div>
                          <div className="dash-navbar-item mt-auto" onClick={() => {
                            localStorage.removeItem('token');
                            window.location.reload();
                          }}>
                            <FontAwesomeIcon icon={faDoorOpen} />
                            <p>Logout</p>
                          </div>
                        </div>
                      </section>

                      {/* main content */}
                      <section className="bg-main-bar col-12 col-lg-9">
                        <Routes>
                          <Route path="/" element={<Navigate to="/feed" replace />} />

                          <Route path="/feed" element={<FeedLayout setCreatePost={setCreatePost} />}>
                            <Route path="/feed/chat" element={
                              <div className="container-fluid da-chat"><Chat /></div>
                            } />
                            <Route path="/feed/post" element={
                              <div className="container-fluid da-post"><Post /></div>
                            } />
                            <Route path="/feed/profile/:user_id" element={
                              <div className="container-fluid main-profile-container">
                                <Profile user={user} />
                              </div>
                            } />
                            <Route path="/feed/viewpost/:skill_id" element={
                              <div className="container-fluid main-viewpost-container">
                                <Viewpost isHome={false} />
                              </div>
                            } />
                            <Route path="/feed/explore" element={
                              <div className="container-fluid main-explore-container">
                                <Explore />
                              </div>
                            } />
                            <Route path="/feed/followUnfollow/:user_id" element={
                              <div className="container-fluid main-followUnfollow">
                                <FollowUnfollow />
                              </div>
                            } />
                            <Route path="/feed/editSkill/:skill_id" element={
                              <div className="container-fluid main-editSkill-container">
                                <EditSkill />
                              </div>
                            } />
                          </Route>
                        </Routes>

                        {createPost && (
                          <div className="container-fluid da-post">
                            <Post setCreatePost={setCreatePost} />
                          </div>
                        )}
                      </section>
                    </div>

                    {/* mobile nav */}
                    <div className="row m-0 p-0">
                      <section className="bg-sm-nav col-12 d-lg-none">
                        <div className="sm-nav">
                          <div className="sm-nav-action">
                            <FontAwesomeIcon icon={faHome} onClick={() => navigate('/feed')} />
                          </div>
                          <div className="sm-nav-action">
                            <FontAwesomeIcon icon={faSearch} onClick={() => navigate('/feed/explore')} />
                          </div>
                          <div className="sm-nav-action">
                            <img
                              src={user?.avatar || '/avatar.jpg'}
                              onClick={() => navigate(`/feed/profile/${user?.id}`)}
                              alt="profile-avatar"
                              className="sm-navbar-avatar"
                            />
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </FeedContext.Provider>
              </PrivateRoute>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/feed" : "/auth"} replace />} />

        </Routes>
      </AuthContext.Provider>
    </>
  );
}

export default App;