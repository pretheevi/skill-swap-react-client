import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useMemo, useReducer } from "react";
import { toast } from 'react-toastify';
import { AuthContext } from "../../context/AuthContext";
import API from '../api/api.js';
import './followUnfollow.css';

const initialState = {
  follow: [],
  search: "",
  loading: true,
  followInProgress: false,
};

const followReducer = (state, action) => {
  switch (action.type) {
    case "SET_FOLLOW":
      return { ...state, follow: action.payload, loading: false };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_SEARCH":
      return { ...state, search: action.payload };

    case "SET_FOLLOW_PROGRESS":
      return { ...state, followInProgress: action.payload };

    case "UPDATE_FOLLOW":
      return {
        ...state,
        followInProgress: false,
        follow: state.follow.map(f =>
          f.id === action.payload ? { ...f, is_following: 1 } : f
        ),
      };

    default:
      return state;
  }
};

function FollowUnfollow() {
  const navigate = useNavigate();
  const { user_id } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const { setUser } = useContext(AuthContext); // ✅ removed unused `user` / `loggedUser`
  const [state, dispatch] = useReducer(followReducer, initialState);
  const { follow, search, loading, followInProgress } = state;

  const fetchFollowData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await API.get(`/profile/${tab}/byId/${user_id}`);
      dispatch({ type: "SET_FOLLOW", payload: response.data });
    } catch (error) {
      console.log(error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const onFollow = async (is_following, userId) => {
    if (followInProgress || is_following) return;
    dispatch({ type: "SET_FOLLOW_PROGRESS", payload: true });
    try {
      await API.post(`/follow/${userId}`);
      dispatch({ type: "UPDATE_FOLLOW", payload: userId });
      setUser(prev => ({ ...prev, following_count: prev.following_count + 1 }));
    } catch (error) {
      toast.error(error.response.data.message);
      dispatch({ type: "SET_FOLLOW_PROGRESS", payload: false });
    }
  };

  // useMemo — only re-filters when follow list or search changes
  const filtered = useMemo(() =>
    follow.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()))
  , [follow, search]);

  useEffect(() => { fetchFollowData(); }, [user_id, tab]);

  return (
    <div className="row flw-wrapper">

      {/* header */}
      <div className="flw-header">
        <div className="flw-top-row">
          <h1 className="flw-username">
            {tab === "followers" ? "Followers" : "Following"}
          </h1>
          <button className="flw-close-btn" onClick={() => navigate(`/feed/profile/${user_id}`)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="flw-tabs">
          <button
            className={`flw-tab ${tab === "followers" ? "active" : ""}`}
            onClick={() => navigate(`/feed/followUnfollow/${user_id}?tab=followers`)}
          >
            Followers
          </button>
          <button
            className={`flw-tab ${tab === "following" ? "active" : ""}`}
            onClick={() => navigate(`/feed/followUnfollow/${user_id}?tab=following`)}
          >
            Following
          </button>
        </div>
      </div>

      {/* search */}
      <div className="flw-search-wrap">
        <FontAwesomeIcon icon={faSearch} />
        <input
          className="flw-search-input"
          type="text"
          placeholder="Search"
          value={search}
          onChange={e => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
        />
      </div>

      {/* body */}
      <div className="flw-body">
        {loading ? (
          <ul className="flw-list">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flw-skeleton">
                <div className="sk-circle" />
                <div className="sk-lines">
                  <div className="sk-line short" />
                  <div className="sk-line shorter" />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="flw-empty">
            <p>No {tab} found</p>
          </div>
        ) : (
          <ul className="flw-list">
            {filtered.map(f => (
              <li key={f.id} className="flw-item">
                <img
                  className="flw-avatar"
                  src={f.avatar || '/avatar.jpg'}
                  alt={f.name}
                />
                <div className="flw-info" onClick={() => navigate(`/feed/profile/${f.id}`)}>
                  <p className="flw-name">{f.name}</p>
                  <p className="flw-handle">@{f.name}</p>
                </div>
                <button
                  className={`flw-action-btn ${f.is_following ? "message" : "follow"}`}
                  onClick={() => {
                    if (f.is_following) {
                      navigate(`/feed/chat?from=message&userId=${f.id}&name=${encodeURIComponent(f.name)}&avatar=${encodeURIComponent(f.avatar)}`)
                    } else {
                      onFollow(f.is_following, f.id)
                    }
                    }}
                  disabled={followInProgress} //  prevents spam clicks
                >
                  {f.is_following ? "Message" : "Follow"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FollowUnfollow;