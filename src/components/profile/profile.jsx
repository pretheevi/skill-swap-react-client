import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faShare,
  faSave,
  faGear,
  faDoorOpen,
  faTimes,
  faHeart as faHeartSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faMessage, faHeart } from '@fortawesome/free-regular-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './profile.css';
import './follow.css';
import API from '../api/api.js';


import { AuthContext } from '../../context/AuthContext.js';
import { toast } from 'react-toastify';


function Profile() {
  // navigater
  const navigate = useNavigate();

  // Route parameter
  const { user_id } = useParams();

  // Context
  const loggedUser = useContext(AuthContext).user;
  const [profileUser, setPorfileUser] = useState(null);

  // State declarations
  const [post, setPost] = useState([]);
  const [showFollow, setShowFollow] = useState('');
  const [followerList, setFollowerList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  const RATIO_TO_SPAN = {
    '1:1': 12,
    '2:3': 15,
  };

  // Fetch user posts
  const getAllPost = async () => {
    try {
      const response = await API.get(`/my-skillsById/${profileUser.id}`);
      console.log(response);
      setPost(response.data);
      setPorfileUser(prev => ({...prev, skill_count: response.data.length}))
    } catch (error) {
      console.log(error);
    }
  };

  // Update the getFollowList function to properly convert is_following to boolean
  const getFollowList = async (type) => {
    try {
      const response = await API.get(`/profile/${type}/byId/${profileUser.id}`);
      console.log('follow list', response);

      // Convert is_following from 1/0 to boolean true/false
      const processedData = response.data.map(item => ({
        ...item,
        is_following: item.is_following === 1 // Convert 1 to true, 0 to false
      }));

      if (type === 'followers') {
        setFollowerList(processedData);
      } else {
        setFollowingList(processedData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleFollowAction = async (userId, isCurrentlyFollowing) => {
    console.log('Follow action triggered for userId:', userId, 'Currently following:', isCurrentlyFollowing);

    // Optimistically update the UI first
    if (showFollow === 'followers') {
      setFollowerList(prev =>
        prev.map(item =>
          item.id === userId
            ? { ...item, is_following: !isCurrentlyFollowing }
            : item
        )
      );
    } else if (showFollow === 'following') {
      setFollowingList(prev =>
        prev.map(item =>
          item.id === userId
            ? { ...item, is_following: !isCurrentlyFollowing }
            : item
        )
      );
    }

    try {
      if (isCurrentlyFollowing) {
        await API.delete(`/follow/${userId}`);
      } else {
        await API.post(`/follow/${userId}`);
      }
      console.log('Follow/unfollow API call successful');

      // Refresh the counts in the user object
      try {
        const updatedUserResponse = await API.get('/profile'); // Adjust endpoint as needed
        console.log('updated user response', updatedUserResponse);
        const {followers_count, following_count} = updatedUserResponse.data;
        if (updatedUserResponse.data) {
          setPorfileUser(prev => (
          {
            ...prev, 
            followers_count: followers_count, 
            following_count: following_count
          }
          ))
        }
      } catch (error) {
        console.log('Error refreshing user data:', error);
      }

    } catch (error) {
      console.log('FULL ERROR:', error);
      console.log('RESPONSE:', error?.response);
      console.log('DATA:', error?.response?.data);

      // Revert the optimistic update on error
      if (showFollow === 'followers') {
        setFollowerList(prev =>
          prev.map(item =>
            item.id === userId
              ? { ...item, is_following: isCurrentlyFollowing }
              : item
          )
        );
      } else if (showFollow === 'following') {
        setFollowingList(prev =>
          prev.map(item =>
            item.id === userId
              ? { ...item, is_following: isCurrentlyFollowing }
              : item
          )
        );
      }
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await API.get(`/profileById/${user_id}`);
      console.log('user profile response', response);
      if (response.data) {
        setPorfileUser(response.data);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const profileRedirect = (profileId) => {
    if (loggedUser.id !== profileId) {
      navigate(`/profile/${profileId}`);
    } else {
      navigate(`/profile/${loggedUser.id}`);
    }
    setShowFollow('');
  }

  useEffect(() => {
    getUserProfile();
  }, [user_id]); 

  // Effects
  useEffect(() => {
    if (profileUser?.id) {
      getAllPost();
    }
  }, [profileUser?.id]); 

  // Add useEffect to refresh data when showFollow changes
  useEffect(() => {
    if (showFollow) {
      getFollowList(showFollow);
    }
  }, [showFollow]);

  return (
    <>
      <div className="row prf-wrapper">
        {/* Profile Header Section */}
        <div className="col-12 prf-container">
          <div className="prf-card">
            <div className="prf-avatar-card">
              <img
                src={profileUser?.avatar || '/avatar.jpg'}
                alt="prf-avatar"
              />
            </div>

            <div className="prf-info-card">
              <div className="d-flex justify-content-between">
                <div>
                  <h1 className="prf-info-account-name">{profileUser?.name}</h1>
                </div>
                {profileUser && profileUser.id === loggedUser.id &&
                 <div className="d-flex gap-3 d-lg-none">
                  <FontAwesomeIcon icon={faGear} />
                  <FontAwesomeIcon icon={faDoorOpen} onClick={() => {
                    localStorage.removeItem('token')
                    window.location.reload()
                  }} />
                </div>}
              </div>

              <div className="prf-count-card">
                <span className="prf-count-item">
                  <h1>{profileUser?.skill_count || 0}</h1>
                  <p>posts</p>
                </span>
                <span className="prf-count-item"
                  onClick={() => setShowFollow('followers')}>
                  <h1>{profileUser?.followers_count || 0}</h1>
                  <p>followers</p>
                </span>
                <span className="prf-count-item"
                  onClick={() => setShowFollow('following')}>
                  <h1>{profileUser?.following_count || 0}</h1>
                  <p>following</p>
                </span>
              </div>
            </div>
          </div>

          <div className="prf-bio-card">
            <p className="prf-bio">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Qui, praesentium rem neque,
              nemo vero accusantium ad consequuntur laboriosam molestias quis incidunt beatae ipsam
              odio at ipsum voluptas numquam provident rerum.
            </p>
          </div>

          {profileUser && profileUser.id !== loggedUser.id && <div className="btn-card">
            <button className="message-btn">message</button>
            <button className="follow-btn">follow</button>
          </div>}
        </div>

        {/* Feed Section */}
        <div className="col-12 prf-feed-container">
          <main className="uid prf-feed-card">
            <div className="prf-feed-masonry">
              {post.length > 0 &&
                post.map((card) => (
                  <article
                    key={card.skill_id}
                    className="card prf-card"
                    onClick={() => navigate(`/viewpost/${card.skill_id}?isHome=false`)}
                    style={{ gridRow: `span ${RATIO_TO_SPAN[card.media_ratio]}` }}
                  >
                    <main className="card-media prf-card-media">
                      <div
                        id={`carousel-${card.user_id}`}
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
                                <video src={item.media_url} controls />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </main>
                  </article>
                ))}
            </div>
          </main>
        </div>
      </div>

      {showFollow
        && showFollow.length > 0
        && <div className="row prf-followers-wrapper">
          <div className="prf-follow-list-container col-10 col-md-6 col-lg-5 mx-auto">
            <div className="prf-followers-header-card">
              <div className='prf-follow-header'>
                <h1>{showFollow}</h1>
                <button onClick={() => setShowFollow('')}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className='prf-follow-search-card'>
                <input type="text" placeholder={`Search ${showFollow}`} />
                <button>
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </div>
            </div>
            <div className='prf-follow-list-card'>
              <ul>
                {showFollow === 'followers' ? (
                  followerList.map((follower) => (
                    <li key={follower.id} className='prf-follow-list-item'>
                      <img src={follower.avatar || '/avatar.jpg'} alt="" />
                      <h1 onClick={() => profileRedirect(follower.id)}>{follower.name}</h1>
                      <button type='button'
                        onClick={() => handleFollowAction(follower.id, follower.is_following)}>
                        {follower.is_following ? 'Unfollow' : 'Follow Back'}
                      </button>
                    </li>
                  ))
                ) : (
                  followingList.map((following) => (
                    <li key={following.id} className='prf-follow-list-item'>
                      <img src={following.avatar || '/avatar.jpg'} alt="" />
                      <h1 onClick={() => profileRedirect(following.id)}>{following.name}</h1>
                      <button type='button'
                        onClick={() => handleFollowAction(following.id, following.is_following)}>
                        {following.is_following ? 'Unfollow' : 'Follow Back'}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>}
    </>
  );
}

export default Profile;