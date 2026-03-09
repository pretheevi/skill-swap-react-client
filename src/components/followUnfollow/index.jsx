import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useState } from "react";
import API from '../api/api.js';
import { toast } from 'react-toastify';
import { AuthContext } from "../../context/AuthContext";
import './followUnfollow.css';

function FollowUnfollow() {
  const navigate = useNavigate();
  const { user_id } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const { user } = useContext(AuthContext);
  const loggedUser = user;
  const [follow, setFollow] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchFollowData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/profile/${tab}/byId/${user_id}`);
      console.log(response.data);
      setFollow(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onFollow = async (is_following, user_id) => {
    if (is_following) return;
    try {
      const response = await API.post(`/follow/${user_id}`);
      setFollow(prev =>
        prev.map(f => f.id === user_id ? { ...f, is_following: 1 } : f)
      );
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error.response);
    }
  };

  useEffect(() => {
    fetchFollowData();
  }, [user_id, tab]);

  const filtered = follow.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* tabs */}
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
          onChange={e => setSearch(e.target.value)}
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
                <button className={`flw-action-btn ${f.is_following ? "message" : "follow"}`} onClick={() => onFollow(f.is_following, f.id)}>
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