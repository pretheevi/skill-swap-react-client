import { useContext, useEffect, useReducer } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext.js';
import API from '../api/api.js';
import './profile.css';

const initialState = {
  profileUser: null,
  posts: [],
  followInProgress: false,
};

const profileReducer = (state, action) => {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profileUser: action.payload };

    case "SET_POSTS":
      return {
        ...state,
        posts: action.payload,
        profileUser: { ...state.profileUser, skill_count: action.payload.length }
      };

    case "SET_FOLLOW_PROGRESS":
      return { ...state, followInProgress: action.payload };

    case "TOGGLE_FOLLOW":
      return {
        ...state,
        followInProgress: false,
        profileUser: { ...state.profileUser, is_following: action.payload }
      };

    default:
      return state;
  }
};

function Profile() {
  const navigate = useNavigate();
  const { user_id } = useParams();

  // single useContext call instead of two
  const { user: loggedUser, setUser } = useContext(AuthContext);
  const [state, dispatch] = useReducer(profileReducer, initialState);
  const { profileUser, posts, followInProgress } = state;

  const isOwnProfile = profileUser && loggedUser && profileUser.id === loggedUser.id;

  const getUserProfile = async () => {
    try {
      const response = await API.get(`/profileById/${user_id}`);
      if (response.data) dispatch({ type: "SET_PROFILE", payload: response.data });
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const getAllPost = async () => {
    try {
      const response = await API.get(`/my-skillsById/${profileUser.id}`);
      dispatch({ type: "SET_POSTS", payload: response.data });
    } catch (error) {
      console.log(error);
    }
  };

  const onFollowToggle = async (is_following, userId) => {
    if (followInProgress) return;
    dispatch({ type: "SET_FOLLOW_PROGRESS", payload: true });
    try {
      if (is_following) {
        await API.delete(`/follow/${userId}`);
        dispatch({ type: "TOGGLE_FOLLOW", payload: false });
        setUser(prev => ({ ...prev, following_count: prev.following_count - 1 }));
      } else {
        await API.post(`/follow/${userId}`);
        dispatch({ type: "TOGGLE_FOLLOW", payload: true });
        setUser(prev => ({ ...prev, following_count: prev.following_count + 1 }));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
      dispatch({ type: "SET_FOLLOW_PROGRESS", payload: false });
    }
  };

  useEffect(() => { getUserProfile(); }, [user_id]);
  useEffect(() => { if (profileUser?.id) getAllPost(); }, [profileUser?.id]);

  return (
    <div className="row prf-wrapper">

      {/* ── profile header ── */}
      <div className="col-12 prf-container">

        <div className="prf-header-row">
          <div className="prf-avatar-card">
            <img src={profileUser?.avatar || '/avatar.jpg'} alt="avatar" />
          </div>

          <div className="prf-info-card">
            <div className="prf-info-top-row">
              <h1 className="prf-info-account-name">{profileUser?.name || '—'}</h1>
              {isOwnProfile && (
                <div className="prf-info-icons d-lg-none">
                  <FontAwesomeIcon icon={faGear} onClick={() => navigate("/feed/settings")} />
                </div>
              )}
            </div>

            <div className="prf-count-card">
              <span className="prf-count-item">
                <h1>{profileUser?.skill_count || 0}</h1>
                <p>posts</p>
              </span>
              <span className="prf-count-item"
                onClick={() => navigate(`/feed/followUnfollow/${profileUser?.id}?tab=followers`)}
              >
                <h1>{profileUser?.followers_count || 0}</h1>
                <p>followers</p>
              </span>
              <span className="prf-count-item"
                onClick={() => navigate(`/feed/followUnfollow/${profileUser?.id}?tab=following`)}
              >
                <h1>{profileUser?.following_count || 0}</h1>
                <p>following</p>
              </span>
            </div>
          </div>
        </div>

        {profileUser?.bio && (
          <div className="prf-bio-card">
            <p className="prf-bio">{profileUser.bio}</p>
          </div>
        )}

        {!isOwnProfile && profileUser && (
          <div className="btn-card">
            <button className="message-btn"
              onClick={() => navigate(`/feed/chat?from=message&userId=${profileUser.id}&name=${encodeURIComponent(profileUser.name)}&avatar=${encodeURIComponent(profileUser.avatar)}`)}
            >
              Message
            </button>
            <button
              className={`follow-btn ${profileUser?.is_following ? 'following' : ''}`}
              onClick={() => onFollowToggle(profileUser.is_following, profileUser.id)}
              disabled={followInProgress}
            >
              {profileUser?.is_following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>

      {/* ── post grid ── */}
      <div className="col-12 prf-feed-container">
        <div className="prf-feed-masonry">
          {posts.map((card) => (
            <article
              key={card.skill_id}
              className="prf-post-card"
              onClick={() => navigate(`/feed/viewpost/${card.skill_id}?isHome=false`)}
            >
              <div className="prf-post-card-media">
                <div id={`carousel-${card.skill_id}`} className="carousel slide" data-bs-ride="false">
                  <div className="carousel-inner">
                    {card.media.map((item, index) => (
                      <div key={item.media_id} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                        {item.media_type === 'image'
                          ? <img src={item.media_url} alt="" />
                          : <video src={item.media_url} />
                        }
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