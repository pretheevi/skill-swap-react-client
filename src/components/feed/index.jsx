import React, { useContext, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faShare,
  faSave,
  faHeart as faHeartSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faBell, faMessage, faHeart } from '@fortawesome/free-regular-svg-icons';
import { FeedContext } from '../../context/FeedContext';
import API from '../api/api';

import './feed.css';

function Feed() {
  const navigate = useNavigate();
  const { feed, setFeed } = useContext(FeedContext);

  const RATIO_TO_SPAN = {
    '1:1': 20,
    '2:3': 25,
  };

  const [heartBeatId, setHeartBeatId] = useState(null);
  const handleSkillLike = async (skill_id) => {
    try {
      const response = await API.post(`/${skill_id}/like/toggle`);
      console.log(response.data)
      const { likeCount, liked } = response.data.data;
      console.log(likeCount, liked);
      setFeed(feed => 
        feed.map(skill => 
          skill.skill_id === skill_id
            ? {...skill, like_count: likeCount, user_liked: liked}
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
  }

  return (
    <>
      <div className="feed-masonry">
        {feed.length > 0 &&
          feed.map((card) => (
            <article
              key={card.skill_id}
              className="card"
              style={{ gridRow: `span ${RATIO_TO_SPAN[card.media_ratio]}` }}
            >
              <header className="card-header" 
              onClick={() => navigate(`/profile/${card.user_id}`)}>
                <img
                  src={card.user_avatar || '/avatar.jpg'}
                  alt="profile"
                  className="avatar"
                />
                <div>
                  <h6 className="m-0">{card.user_name}</h6>
                  <small>somthing</small>
                </div>
              </header>

              <main className="card-media">
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
                </div>
              </main>

              <footer className="card-footer">
                <div className="card-actions">
                  <div onClick={() => handleSkillLike(card.skill_id)}>
                    {card.user_liked
                      ? (<FontAwesomeIcon 
                        className={`viw-cmt-like-btn
                          ${card.user_liked ? 'liked' : ''}
                          ${heartBeatId === card.skill_id ? 'heart-beat-once' : ''}
                        `}
                        icon={faHeartSolid} />)
                      : (<FontAwesomeIcon 
                        icon={faHeart} />)
                    }
                    <span>{card.like_count}</span>
                  </div>
                  <div
                    onClick={() => navigate(`/viewpost/${card.skill_id}?isHome=false`)}>
                    <FontAwesomeIcon icon={faMessage} />
                    <span>{card.comment_count}</span>
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faShare} />
                  </div>
                  <div className="ms-auto">
                    <FontAwesomeIcon icon={faSave} />
                  </div>
                </div>
                <div className="card-description">
                  {card.skill_description.slice(0, 50) + '...'}
                </div>
              </footer>
            </article>
          ))}
      </div>
    </>
  )
}

export default Feed;