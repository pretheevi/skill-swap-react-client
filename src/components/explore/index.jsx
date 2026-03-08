import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserPlus, 
  faUserMinus,
  faTimes,
  faArrowLeft 
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import API from '../api/api';
import { AuthContext } from '../../context/AuthContext';
import './explore.css';


function Explore() {
  const navigation = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Search handler with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.warning('Please enter at least 2 characters');
      return;
    } 
    
    setIsSearching(true);
    
    try {
      const response = await API.get(`/searchUser?username=${encodeURIComponent(searchQuery)}`);
      const resultUsers = response.data.users || [];
      setSearchResults(resultUsers);
      
      // Save to recent searches
      const updatedSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5);
      
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

const handleFollowAction = async (userId, isCurrentlyFollowing) => {
    console.log('========== FOLLOW ACTION STARTED ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', userId);
    console.log('Currently Following:', isCurrentlyFollowing);
    console.log('Current search results count:', searchResults.length);
    
    // Find the user in current results for logging
    const targetUser = searchResults.find(u => u.id === userId);
    console.log('Target user details:', targetUser ? {
      name: targetUser.name,
      username: targetUser.username,
      currentFollowStatus: targetUser.is_following
    } : 'User not found in results');
    
    // Store original state for rollback in case of error
    const originalResults = [...searchResults];
    console.log('Original results saved for rollback');
    
    // Optimistically update UI
    console.log('Optimistically updating UI - toggling follow status');
    setSearchResults(prev => {
      const newResults = prev.map(u =>
        u.id === userId ? { ...u, is_following: !isCurrentlyFollowing } : u
      );
      
      // Log the updated user
      const updatedUser = newResults.find(u => u.id === userId);
      console.log('Optimistic update complete. New status:', updatedUser?.is_following);
      
      return newResults;
    });

    try {
      console.log(`Making API call to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} endpoint...`);
      console.log('Request URL:', `/api/${isCurrentlyFollowing ? 'unfollow' : 'follow'}/${userId}`);
      
      const startTime = Date.now();
      
      if (isCurrentlyFollowing) {
        await API.delete(`/follow/${userId}`);
        setUser(prev => ({
          ...prev,
          following_count: prev.following_count - 1
        }));
        console.log('✅ Unfollow API call successful');
      } else {
        await API.post(`/follow/${userId}`);
        setUser(prev => ({
          ...prev,
          following_count: prev.following_count + 1
        }));
        console.log('✅ Follow API call successful');
      }
      
      const endTime = Date.now();
      console.log(`API call completed in ${endTime - startTime}ms`);
      
      toast.success(`User ${isCurrentlyFollowing ? 'unfollowed' : 'followed'} successfully`);
      console.log('Toast notification sent');
      
    } catch (error) {
      console.log('❌ API call failed!');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      console.log('Error headers:', error.response?.headers);
      
      // Rollback on error
      console.log('Rolling back optimistic update...');
      setSearchResults(originalResults);
      console.log('Rollback complete - restored original results');
      
      toast.error(error.response?.data?.error || 'Action failed');
      console.log('Error toast sent');
      
    } finally {
      console.log('========== FOLLOW ACTION COMPLETED ==========');
      console.log('Final search results count:', searchResults.length);
      
      // Log final status of the target user
      const finalUser = searchResults.find(u => u.id === userId);
      console.log('Final status for user:', finalUser ? {
        id: finalUser.id,
        name: finalUser.name,
        is_following: finalUser.is_following
      } : 'User not found in results');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeRecentSearch = (query) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
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

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="explore-section">
          <h2 className="explore-section-title">Recent Searches</h2>
          <div className="explore-recent-list">
            {recentSearches.map((query, index) => (
              <div key={index} className="explore-recent-item">
                <span 
                  className="explore-recent-query"
                  onClick={() => setSearchQuery(query)}
                >
                  <FontAwesomeIcon icon={faSearch} className="recent-search-icon" />
                  {query.slice(0, 50) + '...'}
                </span>
                <FontAwesomeIcon
                  icon={faTimes}
                  className="explore-recent-remove"
                  onClick={() => removeRecentSearch(query)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="explore-section">
          <h2 className="explore-section-title">
            Search Results ({searchResults.length})
          </h2>
          <div className="explore-results-grid">
            {searchResults.map((user) => (
              <div key={user.id} className="explore-user-card">
                <img
                  src={user.avatar || '/avatar.jpg'}
                  alt={user.name}
                  className="explore-user-avatar"
                  onError={(e) => {
                    e.target.src = '/avatar.jpg';
                  }}
                />
                
                <div className="explore-user-info">
                  <h3 className="explore-user-name">{user.name}</h3>
                  <p className="explore-user-username"
                  onClick={() => navigation(`/profile/${user.id}`)}
                  >
                    @{user.name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                </div>

                <button
                  className={`explore-follow-btn ${user.is_following ? 'unfollow' : 'follow'}`}
                  onClick={() => handleFollowAction(user.id, user.is_following)}
                >
                  <FontAwesomeIcon 
                    icon={user.is_following ? faUserMinus : faUserPlus} 
                  />
                  <span>
                    {user.is_following ? 'Unfollow' : 'Follow'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State for Search */}
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