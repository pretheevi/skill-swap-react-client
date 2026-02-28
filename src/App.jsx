import { useContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPlus,
  faShare,
  faSave,
  faHome,
  faGear,
  faDoorOpen,
} from '@fortawesome/free-solid-svg-icons';
import { faBell, faMessage, faHeart } from '@fortawesome/free-regular-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API from './components/api/api';

import './App.css';
import { AuthContext } from './context/AuthContext';
import { NavigateContext } from './context/NavigateContext';
import { FeedContext } from './context/FeedContext';
import Auth from './components/auth/auth';
import Feed from './components/feed';
import Chat from './components/chat/chat';
import Post from './components/posts/post';
import Explore from './components/explore';
import Profile from './components/profile/profile';
import Viewpost from './components/viewpost/viewpost';


function App() {
  const navigate = useNavigate();
  
  // State declarations
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [createPost, setCreatePost] = useState(false);

  // Fetch home feed - fetch once, cache
  const fetchHomeFeed = async (force = false) => {
    if (loaded && !force) return;

    try {
      setLoading(true);
      const response = await API.get('/skills');
      console.log('feed', response);
      setFeed(response.data);
      setLoaded(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh
  const refreshHomeFeed = async () => {
    await fetchHomeFeed(true);
  };

  // Update single skill locally
  const updateSkill = (skill_id, newData) => {
    setFeed((prev) =>
      prev.map((skill) => (skill.id === skill_id ? { ...skill, ...newData } : skill))
    );
  };

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await API.get('/tokenVerify');

        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };
    verifyToken();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/profile');
      console.log('User profile:', response.data);
      setUser(response.data);
    } catch (error) {
      console.log('Failed to fetch user profile:', error);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHomeFeed();
  }, [user]);

  return (
    <>
      <ToastContainer />
      <AuthContext.Provider value={{ user, setUser }}>
        <div className="container-fluid layout">
          {!isAuthenticated ? (
            <Auth setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <FeedContext.Provider
              value={{
                feed,
                setFeed,
                loading,
                fetchHomeFeed,
                refreshHomeFeed,
              }}
            >
              <div className="row m-0">
                {/* Desktop Sidebar */}
                <section className="bg-side-bar col-lg-3 d-none d-lg-flex">
                  <div className="dash-logo">
                    <img src="/logo.png" alt="logo" />
                    <h1>Skillswap</h1>
                  </div>

                  <div
                    className="dash-profile-card"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    <img
                      src={user?.avatar || '/avatar.jpg'}
                      alt="profile-avatar"
                      className="dash-profile-avatar"
                    />
                    <div className="text-center">
                      <h3 className="dash-profile-account-name">{user?.name}</h3>
                      {/* <p className="dash-profile-username">IceBearDev</p> */}
                    </div>
                    <div className="dash-profile-info-card">
                      <span className="profile-post-count">
                        <p id="posts">{user?.posts_count || 0}</p>
                        <label htmlFor="posts">Posts</label>
                      </span>
                      <span className="profile-followers-count">
                        <p id="posts">{user?.followers_count || 0}</p>
                        <label htmlFor="posts">Followers</label>
                      </span>
                      <span className="profile-following-count">
                        <p id="posts">{user?.following_count || 0}</p>
                        <label htmlFor="posts">Following</label>
                      </span>
                    </div>
                  </div>

                  <div className="dash-navbar-card">
                    <div
                      className="dash-navbar-item"
                      onClick={() => navigate('/feed')}
                    >
                      <FontAwesomeIcon icon={faHome} />
                      <p>Feed</p>
                    </div>
                    <div
                      className="dash-navbar-item"
                      onClick={() => navigate('/explore')}
                    >
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

                {/* Main Content Area */}
                <section className="bg-main-bar col-12 col-lg-9">
                  {/* Header */}

                  <Routes>
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    <Route
                      path='/feed'
                      element={
                        <>
                          <header className="main-header d-flex d-lg-flex">
                            <div className="main-header-logo d-flex d-lg-none">
                              <img src="/logo.png" alt="logo-image" />
                            </div>
                            <div className="da-actions d-flex justify-content-center align-items-center gap-2 ms-auto">
                              <FontAwesomeIcon icon={faBell} className="main-header-bell-icon" />
                              <div data-name="chat" onClick={() => navigate('/chat')}>
                                <FontAwesomeIcon icon={faMessage} className="main-header-message-icon" />
                              </div>
                              <button
                                className="main-header-create-post-btn d-flex justify-content-center align-items-center gap-2"
                                onClick={() => setCreatePost(true)}
                              >
                                <FontAwesomeIcon icon={faPlus} className="main-header-plus-icon" />
                                <span>Create Post</span>
                              </button>
                            </div>
                          </header>
                          <main className="uid main-feed-card">
                            <Feed />
                          </main>
                        </>
                      }
                    />

                    <Route
                      path='/chat'
                      element={
                        <div className="container-fluid da-chat">
                          <Chat />
                        </div>
                      }
                    />
                    <Route
                      path='/post'
                      element={
                        <div className="container-fluid da-post">
                          <Post />
                        </div>}
                    />

                    <Route
                      path='/profile/:user_id'
                      element={
                        <div className="container-fluid main-profile-container">
                          <Profile user={user} />
                        </div>}
                    />

                    <Route
                      path='/viewpost/:skill_id'
                      element={
                        <div className="container-fluid main-viewpost-container">
                          <Viewpost isHome={true} />
                        </div>}
                    />

                    <Route
                      path="/explore"
                      element={
                        <div className="container-fluid main-explore-container">
                          <Explore />
                        </div>
                      }
                    />
                  </Routes>

                  {createPost && (
                    <div className="container-fluid da-post">
                      <Post setCreatePost={setCreatePost} />
                    </div>)
                  }
                </section>
              </div>

              {/* Mobile Navigation */}
              <div className="row m-0 p-0">
                <section className="bg-sm-nav col-12 d-lg-none">
                  <div className="sm-nav">
                    <div className="sm-nav-action">
                      <FontAwesomeIcon icon={faHome} onClick={() => navigate('/feed')} />
                    </div>
                    <div className="sm-nav-action">
                      <FontAwesomeIcon icon={faSearch} onClick={() => navigate('explore')} />
                    </div>
                    <div className="sm-nav-action">
                      <img
                        src={user?.avatar || '/avatar.jpg'}
                        onClick={() => navigate(`/profile/${user?.id}`)}
                        alt="profile-avatar"
                        className="sm-navbar-avatar"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </FeedContext.Provider>
          )}
        </div>
      </AuthContext.Provider>
    </>
  );
}

export default App;