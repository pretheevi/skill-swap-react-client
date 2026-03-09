import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './profile.css';
import API from '../api/api.js';
import { AuthContext } from '../../context/AuthContext.js';

function Profile() {
  const navigate = useNavigate();
  const { user_id } = useParams();
  const loggedUser = useContext(AuthContext).user;

  const [profileUser, setProfileUser] = useState(null);
  const [post, setPost] = useState([]);

  const isOwnProfile = profileUser && loggedUser && profileUser.id === loggedUser.id;

  const getUserProfile = async () => {
    try {
      const response = await API.get(`/profileById/${user_id}`);
      if (response.data) setProfileUser(response.data);
      console.log(response.data);
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const getAllPost = async () => {
    try {
      const response = await API.get(`/my-skillsById/${profileUser.id}`);
      setPost(response.data);
      setProfileUser(prev => ({ ...prev, skill_count: response.data.length }));
    } catch (error) {
      console.log(error);
    }
  };

  const onFollowToggle = async (is_following, user_id) => {
    try{
      let response;
      if (is_following) {
        response = await API.delete(`/follow/${user_id}`);
        setProfileUser(prev => ({...prev, is_following: false}))
      } else {
        response = await API.post(`/follow/${user_id}`);
        setProfileUser(prev => ({...prev, is_following: true}))
      }
      console.log(response);
    } catch(error) {
      console.log(error);
    }
  }

  useEffect(() => { getUserProfile(); }, [user_id]);
  useEffect(() => { if (profileUser?.id) getAllPost(); }, [profileUser?.id]);

  return (
    <div className="row prf-wrapper">

      {/* ── profile header ── */}
      <div className="col-12 prf-container">

        {/* top row: avatar + info */}
        <div className="prf-header-row">

          <div className="prf-avatar-card">
            <img src={profileUser?.avatar || '/avatar.jpg'} alt="avatar" />
          </div>

          <div className="prf-info-card">
            <div className="prf-info-top-row">
              <h1 className="prf-info-account-name">{profileUser?.name || '—'}</h1>
              {isOwnProfile && (
                <div className="prf-info-icons d-lg-none">
                  <FontAwesomeIcon icon={faGear} />
                  <FontAwesomeIcon
                    icon={faDoorOpen}
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.reload();
                    }}
                  />
                </div>
              )}
            </div>

            {/* stats */}
            <div className="prf-count-card">
              <span className="prf-count-item">
                <h1>{profileUser?.skill_count || 0}</h1>
                <p>posts</p>
              </span>
              <span
                className="prf-count-item"
                onClick={() => navigate(`/feed/followUnfollow/${profileUser?.id}?tab=followers`)}
              >
                <h1>{profileUser?.followers_count || 0}</h1>
                <p>followers</p>
              </span>
              <span
                className="prf-count-item"
                onClick={() => navigate(`/feed/followUnfollow/${profileUser?.id}?tab=following`)}
              >
                <h1>{profileUser?.following_count || 0}</h1>
                <p>following</p>
              </span>
            </div>
          </div>
        </div>

        {/* bio — full width below avatar+info row */}
        {profileUser?.bio && (
          <div className="prf-bio-card">
            <p className="prf-bio">{profileUser.bio}</p>
          </div>
        )}

        {/* action buttons — only on other profiles */}
        {!isOwnProfile && profileUser && (
          <div className="btn-card">
            <button className="message-btn">Message</button>
            <button className={`follow-btn ${profileUser?.is_following ? 'following' : ''}`}
              onClick={() => onFollowToggle(profileUser.is_following, profileUser.id)}
            >
              {profileUser?.is_following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      {/* ── post grid ── */}
      <div className="col-12 prf-feed-container">
        <div className="prf-feed-masonry">
          {post.map((card) => (
            <article
              key={card.skill_id}
              className="prf-post-card"
              onClick={() => navigate(`/feed/viewpost/${card.skill_id}?isHome=false`)}
            >
              <div className="prf-post-card-media">
                <div
                  id={`carousel-${card.skill_id}`}
                  className="carousel slide"
                  data-bs-ride="false"
                >
                  <div className="carousel-inner">
                    {card.media.map((item, index) => (
                      <div
                        key={item.media_id}
                        className={`carousel-item ${index === 0 ? 'active' : ''}`}
                      >
                        {item.media_type === 'image' ? (
                          <img src={item.media_url} alt="" />
                        ) : (
                          <video src={item.media_url} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Profile;