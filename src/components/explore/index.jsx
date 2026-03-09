import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faUserPlus,
  faUserMinus,
  faTimes,
  faArrowLeft,
  faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import API from '../api/api';
import { AuthContext } from '../../context/AuthContext';
import './explore.css';

const RECENT_KEY = 'recentProfiles';

function Explore() {
  const navigation = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentProfiles, setRecentProfiles] = useState([]);

  // load recent profiles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_KEY);
    if (saved) setRecentProfiles(JSON.parse(saved).slice(0, 8));
  }, []);

  // debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim().length >= 2) handleSearch();
      else if (searchQuery.trim().length === 0) setSearchResults([]);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const response = await API.get(`/searchUser?username=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // save profile to recent and navigate
  const handleProfileClick = (profileUser) => {
    const profile = {
      id: profileUser.id,
      name: profileUser.name,
      avatar: profileUser.avatar || null,
    };

    const updated = [
      profile,
      ...recentProfiles.filter(p => p.id !== profile.id),
    ].slice(0, 8);

    setRecentProfiles(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    navigation(`/feed/profile/${profile.id}`);
  };

  const removeRecentProfile = (e, id) => {
    e.stopPropagation();
    const updated = recentProfiles.filter(p => p.id !== id);
    setRecentProfiles(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const handleFollowAction = async (userId, isCurrentlyFollowing) => {
    const originalResults = [...searchResults];

    setSearchResults(prev =>
      prev.map(u => u.id === userId ? { ...u, is_following: !isCurrentlyFollowing } : u)
    );

    try {
      if (isCurrentlyFollowing) {
        await API.delete(`/follow/${userId}`);
        setUser(prev => ({ ...prev, following_count: prev.following_count - 1 }));
      } else {
        await API.post(`/follow/${userId}`);
        setUser(prev => ({ ...prev, following_count: prev.following_count + 1 }));
      }
      toast.success(`User ${isCurrentlyFollowing ? 'unfollowed' : 'followed'} successfully`);
    } catch (error) {
      setSearchResults(originalResults);
      toast.error(error.response?.data?.error || 'Action failed');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="explore-container">

      {/* Header */}
      <div className="explore-header">
        <FontAwesomeIcon
          icon={faArrowLeft}
          className="explore-back-icon"
          onClick={() => navigation('/feed')}
        />
        <h1 className="explore-title">Explore</h1>
      </div>

      {/* Search Bar */}
      <div className="explore-search-wrapper">
        <div className="explore-search-box">
          <FontAwesomeIcon icon={faSearch} className="explore-search-icon" />
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery && (
            <FontAwesomeIcon
              icon={faTimes}
              className="explore-clear-icon"
              onClick={clearSearch}
            />
          )}
        </div>
      </div>

      {/* Recent Profiles */}
      {!searchQuery && recentProfiles.length > 0 && (
        <div className="explore-section">
          <div className="explore-section-header">
            <h2 className="explore-section-title">
              <FontAwesomeIcon icon={faClockRotateLeft} />
              Recent
            </h2>
          </div>
          <div className="explore-recent-profiles">
            {recentProfiles.map((profile) => (
              <div
                key={profile.id}
                className="explore-recent-profile"
                onClick={() => handleProfileClick(profile)}
              >
                <div className="explore-recent-avatar-wrap">
                  <img
                    src={profile.avatar || '/avatar.jpg'}
                    alt={profile.name}
                    className="explore-recent-avatar"
                    onError={(e) => { e.target.src = '/avatar.jpg'; }}
                  />
                  <button
                    className="explore-recent-remove-btn"
                    onClick={(e) => removeRecentProfile(e, profile.id)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <p className="explore-recent-name">
                  {profile.name.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="explore-section">
          <h2 className="explore-section-title">Results · {searchResults.length}</h2>
          <div className="explore-results-grid">
            {searchResults.map((u) => (
              <div key={u.id} className="explore-user-card">
                <img
                  src={u.avatar || '/avatar.jpg'}
                  alt={u.name}
                  className="explore-user-avatar"
                  onClick={() => handleProfileClick(u)}
                  onError={(e) => { e.target.src = '/avatar.jpg'; }}
                />
                <div className="explore-user-info" onClick={() => handleProfileClick(u)}>
                  <h3 className="explore-user-name">{u.name}</h3>
                  <p className="explore-user-username">
                    @{u.name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                </div>
                <button
                  className={`explore-follow-btn ${u.is_following ? 'unfollow' : 'follow'}`}
                  onClick={() => handleFollowAction(u.id, u.is_following)}
                >
                  <FontAwesomeIcon icon={u.is_following ? faUserMinus : faUserPlus} />
                  <span>{u.is_following ? 'Unfollow' : 'Follow'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="explore-section">
          <p className="explore-loading-text">Searching...</p>
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="explore-empty-state">
          <div className="explore-empty-icon">
            <FontAwesomeIcon icon={faSearch} />
          </div>
          <h3>No users found</h3>
          <p>Try searching with a different name</p>
        </div>
      )}

    </div>
  );
}

export default Explore;