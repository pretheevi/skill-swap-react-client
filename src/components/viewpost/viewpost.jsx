import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShare,
  faSave,
  faStar,
  faPaperPlane,
  faTimes,
  faArrowLeft,
  faHeart as faHeartSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faMessage, faHeart } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';

import API from '../api/api';
import Loader from '../loader/loader';
import './viewpost.css';
import './viwcmt.css';

function Viewpost(props) {
  const { skill_id } = useParams();
  const [searchParams] = useSearchParams();
  const isHome = searchParams.get("isHome") === "true";

  const navigate = useNavigate();

  // Context
  const { user } = useContext(AuthContext);

  // State declarations
  const [post, setPost] = useState(null);
  const [allComments, setAllComments] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const textareaRef = useRef(null);

  const handleCommentInput = (e) => {
    const { value } = e.target;
    
    if (value.length >= 2000) {
      toast.warning('Comment limit reached');
      return;
    }
    
    setComment(value);
    
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 300) + 'px';
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    const tempComment = {
      tempId: Date.now(), // 👈 frontend identity
      id: null,           // 👈 backend identity (not yet)
      user_name: user.name,
      user_avatar: user.avatar,
      text: comment,
      like_count: 0,
      user_liked: false,
      isTemp: true,
    };

    // Optimistic update
    setAllComments(prev => [tempComment, ...prev]);

    // Update comment count
    setPost(prev => ({
      ...prev,
      comment_count: (prev?.comment_count || 0) + 1,
    }));

    const commentText = comment;

    // Clear textarea
    setComment('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const payload = {
        skill_id: post?.skill_id || skill_id,
        text: commentText,
      };

      const response = await API.post('/comment', payload);
      console.log('Comment posted:', response.data);

      // Replace temp comment with real one
      setAllComments(prev =>
        prev.map(c =>
          c.tempId === tempComment.tempId
            ? {
                ...response.data,
                tempId: c.tempId, // 👈 keep frontend key stable
                isTemp: false
              }
            : c
        )
      );

    } catch (error) {
      console.log('Error posting comment:', error);
      toast.error(error.response?.data?.message || 'Error posting comment');

      // Rollback if failed
      setAllComments(prev => prev.filter(c => c.id !== tempComment.id));
      setPost(prev => ({ 
        ...prev, 
        comment_count: Math.max(0, (prev?.comment_count || 0) - 1) 
      }));
    }
  };

  const handleFetchComments = async () => {
    const postId = post?.skill_id || skill_id;
    if (!postId) return;
    
    setIsLoading(true);
    try {
      const response = await API.get(`/comments/${postId}`);
      console.log('Fetched comments:', response.data);
      setAllComments(response.data || []);
    } catch (error) {
      console.log('Error fetching comments:', error);
      toast.error('Failed to load comments');
      setAllComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComment = (id) => {
    setExpandedComments(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [heartBeatId, setHeartBeatId] = useState(null);
  const handleLikeComment = async (commentId, currentlyLiked) => {
    try {
      const payload = { comment_id: commentId };
      const response = await API.post('/commentlike/toggle', payload);
      console.log('user liked a comment', response.data);
      const { like_count, liked } = response.data;
      
      setAllComments(prev => 
        prev.map(c => 
          c.id === commentId 
            ? { ...c, like_count: like_count, user_liked: liked } 
            : c
        )
      );

      if (liked) {
        setHeartBeatId(commentId);
        setTimeout(() => setHeartBeatId(null), 400);
      }

    } catch (error) {
      console.log('Error liking comment:', error);
      toast.error(error.response?.data?.message || 'Error liking comment');
    }
  };

    const [skillHeartBeatId, setSkillHeartBeatId] = useState(null);
    const handleSkillLike = async (skill_id) => {
      try {
        const response = await API.post(`/${skill_id}/like/toggle`);
        console.log(response.data)
        const { likeCount, liked } = response.data.data;
        console.log(likeCount, liked);
        setPost(prev => ({...prev, like_count: likeCount, user_liked: liked}));
        
        if (liked) {
          setSkillHeartBeatId(skill_id);
          setTimeout(() => setSkillHeartBeatId(null), 400);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      }
    }

  const [postLoading, setPostLoading] = useState(false);
  const getPostDetails = async () => {
    const id = skill_id || props.post?.skill_id;
    if (!id) return;
    
    try {
      setPostLoading(true);
      const response = await API.get(`/skills/${id}`);
      console.log('Post details:', response.data);
      setPost(response.data);
      setPostLoading(false);
    } catch (error) {
      console.log('Error fetching post:', error);
      toast.error('Failed to load post');
      setPostLoading(false);
    }
  };

  // Fetch post details on mount or when skill_id changes
  useEffect(() => {
    getPostDetails();
  }, [skill_id]); 

  useEffect(() => {
    if (skill_id) {
      handleFetchComments();
    }
  }, [skill_id]);

  return (                        
    <div className="row viw-wrapper">
      {postLoading && <Loader />}
      {/* Media Section */}
      {post && (
        <div className="viw-media-container col-12">
          <main className="viw-media">
            <div className="viw-action-btn p-0">
              <button className="viw-back-btn" onClick={() => navigate(-1)}> 
                {/* `/profile/${post.user_id}` */}
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>
            
            <div
              id={`viw-carousel-${post.id}`}
              className="carousel slide viw-carousel"
            >
              <div className="carousel-inner">
                {post.media?.map((item, index) => (
                  <div
                    key={item.media_id}
                    className={`carousel-item ${index === 0 ? 'active' : ''}`}
                  >
                    <div className="viw-media-images">
                      {item.media_type === 'image' ? (
                        <img src={item.media_url} alt="" />
                      ) : (
                        <video src={item.media_url} controls />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {post.media?.length > 1 && (
                <>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target={`#viw-carousel-${post.id}`}
                    data-bs-slide="prev"
                  >
                    <span className="carousel-control-prev-icon"></span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target={`#viw-carousel-${post.id}`}
                    data-bs-slide="next"
                  >
                    <span className="carousel-control-next-icon"></span>
                  </button>
                </>
              )}
            </div>
          </main>

          <footer className="viw-footer">
            <div className="viw-actions d-flex gap-3">
              <div onClick={() => handleSkillLike(post.id)}>
                {post.user_liked
                  ? (<FontAwesomeIcon 
                    className={`viw-cmt-like-btn
                      ${post.user_liked ? 'liked' : ''}
                      ${skillHeartBeatId === post.id ? 'heart-beat-once' : ''}
                    `}
                    icon={faHeartSolid} />)
                  : (<FontAwesomeIcon 
                    className='viw-cmt-like-btn'
                    icon={faHeart} />)
                }
                <span>{post.like_count}</span>
              </div>

              <div>
                <FontAwesomeIcon icon={faMessage} />
                <span>{post?.comment_count || 0}</span>
              </div>
              <div>
                <FontAwesomeIcon icon={faShare} />
              </div>
              <div className="ms-auto">
                <FontAwesomeIcon icon={faSave} />
              </div>
            </div>
            
            <div className="viw-description">{post.description}</div>
          </footer>
        </div>
      )}

      {/* Comments Section */}
      {post && (
        <div className="viw-comments-container col-12">
          {isLoading ? (
            <div className="text-center p-4">Loading comments...</div>
          ) : (
            <ul className="viw-cmt-list">
              {allComments && allComments.length > 0 ? (
                allComments.map(cmt => {
                  const isExpanded = expandedComments[cmt.id];
                  return (
                    <li className="viw-cmt-list-item" key={cmt.tempId || cmt.id}>
                      <div className="viw-cmt-lst-item-prf">
                        <img src={cmt.user_avatar || '/avatar.jpg'} alt="" />
                      </div>
                      
                      <div className="viw-cmt-lst-item-cmt">
                        <div className='viw-cmt-lst-item-cmt-header'>
                          <h1 className='viw-cmt-username'>{cmt.user_name}</h1>
                          <div className='d-flex flex-column justify-content-center align-items-center'>
                              <FontAwesomeIcon 
                                icon={cmt.user_liked ? faHeartSolid : faHeart} 
                                  className={`viw-cmt-like-btn
                                    ${cmt.user_liked ? 'liked' : ''}
                                    ${heartBeatId === cmt.id ? 'heart-beat-once' : ''}
                                  `}
                                onClick={() => { 
                                    if(!cmt.isTemp) { 
                                    handleLikeComment(cmt.id, cmt.user_liked);
                                  }
                                }}
                              />
                            <p className='viw-cmt-like-count'>{cmt.like_count || 0}</p>
                          </div>
                        </div>
                       
                        <p>
                          {isExpanded
                            ? cmt.text
                            : cmt.text?.slice(0, 200) +
                              (cmt.text?.length > 200 ? '...' : '')}
                          
                          {cmt.text?.length > 200 && (
                            <FontAwesomeIcon
                              icon={faStar}
                              style={{ cursor: 'pointer', marginLeft: '5px' }}
                              onClick={() => toggleComment(cmt.id)}
                            />
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-center p-4">No comments yet. Be the first to comment!</li>
              )}
            </ul>
          )}

          <div className="viw-add-cmt">
            <textarea
              ref={textareaRef}
              name="newCmt"
              placeholder="Type here..."
              onChange={handleCommentInput}
              value={comment}
              rows={1}
            />
            
            <div className="viw-add-cmt-button">
              <FontAwesomeIcon
                icon={faPaperPlane}
                onClick={handleCommentSubmit}
                style={{ cursor: comment.trim() ? 'pointer' : 'not-allowed', opacity: comment.trim() ? 1 : 0.5 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewpost;