import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShare,
  faSave,
  faHeart as faHeartSolid,
  faComment,
  faEllipsis,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart, faComment as faCommentReg, faBookmark } from '@fortawesome/free-regular-svg-icons';
import { FeedContext } from '../../context/FeedContext';
import API from '../api/api';
import './feed.css';

const RATIO_TO_SPAN = {
  '1:1': 20,
  '2:3': 25,
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60)       return 'just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000)  return `${Math.floor(diff / 604800)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Feed() {
  const navigate = useNavigate();
  const { feed, setFeed } = useContext(FeedContext);  // ← feed comes from context
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [heartBeatId, setHeartBeatId] = useState(null);
  const loadingRef = useRef(false);
  const feedRef = useRef(null);
  const pageRef = useRef(1);

  const fetchFeed = async (pageNum = 1) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await API.get(`/skills?page=${pageNum}&limit=10`);
      const newData = response.data;
      if (pageNum === 1) {
        setFeed(newData);
      } else {
        setFeed(prev => {
          const existingIds = new Set(prev.map(s => s.skill_id));
          const unique = newData.filter(s => !existingIds.has(s.skill_id));
          console.log('feed next unique', unique)
          return [...prev, ...unique];
        });
      }
      setHasMore(newData.length === 10);
    } catch (error) {
      console.log(error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(1);
  }, []);

  useEffect(() => {
    // attach to the PARENT that actually scrolls, not the masonry grid
    const el = feedRef.current?.parentElement;
    if (!el) return;

    const handleScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
      if (nearBottom && !loadingRef.current) {
        pageRef.current += 1;
        fetchFeed(pageRef.current);
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []); // empty deps — no stale closure since we use refs



  const handleSkillLike = async (skill_id) => {
    try {
      const response = await API.post(`/${skill_id}/like/toggle`);
      const { likeCount, liked } = response.data.data;
      setFeed(feed =>
        feed.map(skill =>
          skill.skill_id === skill_id
            ? { ...skill, like_count: likeCount, user_liked: liked }
            : skill
        )
      );
      if (liked) {
        setHeartBeatId(skill_id);
        setTimeout(() => setHeartBeatId(null), 400);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="feed-masonry" ref={feedRef}>
      {feed.length > 0 && feed.map((card) => (
        <article
          key={card.skill_id}
          className="card"
          style={{ gridRow: `span ${RATIO_TO_SPAN[card.media_ratio]}` }}
        >
          {/* ── card header ── */}
          <header
            className="card-header"
            onClick={() => navigate(`/feed/profile/${card.user_id}`)}
          >
            <img
              src={card.user_avatar || '/avatar.jpg'}
              alt="profile"
              className="avatar"
              onError={(e) => { e.target.src = '/avatar.jpg'; }}
            />
            <div className="card-header-info">
              <h6 className="card-username">{card.user_name}</h6>
              <span className="card-time">{timeAgo(card.updated_at)}</span>
            </div>
            <FontAwesomeIcon icon={faEllipsis} className="card-more-icon" />
          </header>

          {/* ── media ── */}
          <main className="card-media">
            <div
              id={`carousel-${card.skill_id}`}
              className="carousel slide"
              data-bs-ride="false"
            >
              <div
                className="carousel-inner"
                onClick={() => navigate(`/feed/viewpost/${card.skill_id}?isHome=false`)}
              >
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

              {card.media.length > 1 && (
                <>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target={`#carousel-${card.skill_id}`}
                    data-bs-slide="prev"
                  >
                    <span className="carousel-control-prev-icon" />
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target={`#carousel-${card.skill_id}`}
                    data-bs-slide="next"
                  >
                    <span className="carousel-control-next-icon" />
                  </button>
                </>
              )}

              {/* dot indicators */}
              {card.media.length > 1 && (
                <div className="carousel-indicators card-indicators">
                  {card.media.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      data-bs-target={`#carousel-${card.skill_id}`}
                      data-bs-slide-to={i}
                      className={i === 0 ? 'active' : ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ── footer ── */}
          <footer className="card-footer">
            <div className="card-actions">
              {/* like */}
              <button
                className="card-action-btn"
                onClick={() => handleSkillLike(card.skill_id)}
              >
                <FontAwesomeIcon
                  className={`card-heart
                    ${card.user_liked ? 'liked' : ''}
                    ${heartBeatId === card.skill_id ? 'heart-beat-once' : ''}
                  `}
                  icon={card.user_liked ? faHeartSolid : faHeart}
                />
                <span>{card.like_count || 0}</span>
              </button>

              {/* comment */}
              <button
                className="card-action-btn"
                onClick={() => navigate(`/feed/viewpost/${card.skill_id}?isHome=false`)}
              >
                <FontAwesomeIcon icon={faCommentReg} />
                <span>{card.comment_count || 0}</span>
              </button>

              {/* share */}
              <button className="card-action-btn">
                <FontAwesomeIcon icon={faShare} />
              </button>

              {/* save — pushed to right */}
              <button className="card-action-btn card-action-save">
                <FontAwesomeIcon icon={faBookmark} />
              </button>
            </div>

            {/* description */}
            {card.skill_description && (
              <p className="card-description">
                <span className="card-desc-author">{card.user_name} </span>
                {card.skill_description.length > 80
                  ? card.skill_description.slice(0, 80) + '…'
                  : card.skill_description}
              </p>
            )}
          </footer>
        </article>
      ))}
    </div>
  );
}

export default Feed;