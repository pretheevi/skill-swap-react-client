import React, { useEffect, useRef, useContext, useReducer } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShare,
  faSave,
  faStar,
  faPaperPlane,
  faArrowLeft,
  faHeart as faHeartSolid,
  faTrash,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import { faMessage, faHeart } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';

import API from '../api/api';
import Loader from '../loader/loader';
import './viewpost.css';
import './viwcmt.css';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  post:             null,
  allComments:      [],
  expandedComments: {},
  heartBeatId:      null,   // comment heart-beat
  skillHeartBeatId: null,   // post/skill heart-beat
  comment:          '',
  isLoading:        false,  // comments loading
  postLoading:      false,  // post details loading
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function skillReducer(state, action) {
  switch (action.type) {

    /* ── Post ── */
    case 'SET_POST':
      return { ...state, post: action.payload };

    case 'SET_POST_LOADING':
      return { ...state, postLoading: action.payload };

    case 'TOGGLE_SKILL_LIKE':
      return {
        ...state,
        post: {
          ...state.post,
          like_count: action.payload.likeCount,
          user_liked: action.payload.liked,
        },
      };

    case 'SET_SKILL_HEART_BEAT_ID':
      return { ...state, skillHeartBeatId: action.payload };

    /* ── Comments list ── */
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ALL_COMMENTS':
      return { ...state, allComments: action.payload };

    case 'ADD_COMMENT':
      return { ...state, allComments: [action.payload, ...state.allComments] };

    case 'REPLACE_TEMP_COMMENT':
      return {
        ...state,
        allComments: state.allComments.map(c =>
          c.tempId === action.payload.tempId
            ? { ...action.payload.comment, tempId: c.tempId, isTemp: false }
            : c
        ),
      };

    case 'REMOVE_COMMENT':
      // remove by real id  (after delete) or tempId (on rollback)
      return {
        ...state,
        allComments: state.allComments.filter(
          c => c.id !== action.payload && c.tempId !== action.payload
        ),
      };

    /* ── Comment count on the post ── */
    case 'COMMENT_COUNT_INCREMENT':
      return {
        ...state,
        post: {
          ...state.post,
          comment_count: (state.post?.comment_count || 0) + action.payload,
        },
      };

    case 'COMMENT_COUNT_DECREMENT':
      return {
        ...state,
        post: {
          ...state.post,
          comment_count: Math.max(0, (state.post?.comment_count || 0) - action.payload),
        },
      };

    /* ── Comment likes ── */
    case 'TOGGLE_COMMENT_LIKE':
      return {
        ...state,
        allComments: state.allComments.map(cmt =>
          cmt.id === action.payload.commentId
            ? {
                ...cmt,
                like_count: action.payload.like_count,
                user_liked:  action.payload.liked,
              }
            : cmt
        ),
      };

    case 'SET_HEART_BEAT_ID':
      return { ...state, heartBeatId: action.payload };

    /* ── Comment textarea ── */
    case 'SET_COMMENT':
      return { ...state, comment: action.payload };

    /* ── Expand / collapse long comments ── */
    case 'TOGGLE_EXPANDED_COMMENT':
      return {
        ...state,
        expandedComments: {
          ...state.expandedComments,
          [action.payload]: !state.expandedComments[action.payload],
        },
      };

    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
function Viewpost(props) {
  const { skill_id } = useParams();
  const navigate = useNavigate();
  const { user: loggedUser } = useContext(AuthContext);

  const [state, dispatch] = useReducer(skillReducer, initialState);
  const textareaRef = useRef(null);

  // Destructure for convenience
  const {
    post,
    allComments,
    expandedComments,
    heartBeatId,
    skillHeartBeatId,
    comment,
    isLoading,
    postLoading,
  } = state;

  // ── Fetch post ─────────────────────────────────────────────────────────────
  const getPostDetails = async () => {
    const id = skill_id || props.post?.skill_id;
    if (!id) return;

    dispatch({ type: 'SET_POST_LOADING', payload: true });
    try {
      const response = await API.get(`/skills/${id}`);
      dispatch({ type: 'SET_POST', payload: response.data });
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
    } finally {
      dispatch({ type: 'SET_POST_LOADING', payload: false });
    }
  };

  // ── Fetch comments ─────────────────────────────────────────────────────────
  const handleFetchComments = async () => {
    const postId = post?.skill_id || skill_id;
    if (!postId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await API.get(`/comments/${postId}`);
      dispatch({ type: 'SET_ALL_COMMENTS', payload: response.data || [] });
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ── Textarea auto-resize ───────────────────────────────────────────────────
  const handleCommentInput = (e) => {
    const { value } = e.target;

    if (value.length >= 2000) {
      toast.warning('Comment limit reached');
      return;
    }

    dispatch({ type: 'SET_COMMENT', payload: value });

    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 300) + 'px';
    }
  };

  // ── Submit comment ─────────────────────────────────────────────────────────
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    if (!loggedUser) {
      toast.error('Please login to comment');
      return;
    }

    const tempId = Date.now();
    const tempComment = {
      tempId,
      id: null,
      user_id: loggedUser.id,
      user_name: loggedUser.name,
      user_avatar: loggedUser.avatar,
      text: comment,
      like_count: 0,
      user_liked: false,
      isTemp: true,
    };

    // Optimistic updates
    dispatch({ type: 'ADD_COMMENT',  payload: tempComment });
    dispatch({ type: 'COMMENT_COUNT_INCREMENT',  payload: 1 });

    const commentText = comment;
    dispatch({ type: 'SET_COMMENT', payload: '' });
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const payload = { skill_id: post?.skill_id || skill_id, text: commentText };
      const response = await API.post('/comment', payload);

      dispatch({
        type: 'REPLACE_TEMP_COMMENT',
        payload: { tempId, comment: response.data },
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.message || 'Error posting comment');

      // Rollback
      dispatch({ type: 'REMOVE_COMMENT', payload: tempId });
      dispatch({ type: 'COMMENT_COUNT_DECREMENT', payload: 1 });
    }
  };

  // ── Toggle comment expansion ───────────────────────────────────────────────
  const toggleComment = (id) => {
    dispatch({ type: 'TOGGLE_EXPANDED_COMMENT', payload: id });
  };

  // ── Like a comment ─────────────────────────────────────────────────────────
  const handleLikeComment = async (commentId) => {
    const target = allComments.find(c => c.id === commentId);
    const prevLiked = target.user_liked;
    const prevLikeCount = target.like_count;

    // Optimistic update
    dispatch({
      type:    'TOGGLE_COMMENT_LIKE',
      payload: {
        commentId,
        like_count: prevLiked ? prevLikeCount - 1 : prevLikeCount + 1,
        liked: !prevLiked,
      },
    });

    if (!prevLiked) {
      dispatch({ type: 'SET_HEART_BEAT_ID', payload: commentId });
      setTimeout(() => dispatch({ type: 'SET_HEART_BEAT_ID', payload: null }), 400);
    }

    try {
      const response = await API.post('/commentlike/toggle', { comment_id: commentId });
      const { like_count, liked } = response.data;
      dispatch({ type: 'TOGGLE_COMMENT_LIKE', payload: { commentId, like_count, liked } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error liking comment');
      // Rollback to previous values
      dispatch({
        type:    'TOGGLE_COMMENT_LIKE',
        payload: { commentId, like_count: prevLikeCount, liked: prevLiked },
      });
    }
  };

  // ── Like the post/skill ────────────────────────────────────────────────────
  const handleSkillLike = async (id) => {
    try {
      const response = await API.post(`/${id}/like/toggle`);
      const { likeCount, liked } = response.data.data;

      dispatch({ type: 'TOGGLE_SKILL_LIKE', payload: { likeCount, liked } });

      if (liked) {
        dispatch({ type: 'SET_SKILL_HEART_BEAT_ID', payload: id });
        setTimeout(() => dispatch({ type: 'SET_SKILL_HEART_BEAT_ID', payload: null }), 400);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error liking post');
    }
  };

  // ── Delete comment ─────────────────────────────────────────────────────────
  const deleteComment = async (commentId) => {
    try {
      await API.delete(`/comment/${commentId}`);
      dispatch({ type: 'REMOVE_COMMENT',          payload: commentId });
      dispatch({ type: 'COMMENT_COUNT_DECREMENT', payload: 1 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete comment');
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { getPostDetails() }, [skill_id]);
  useEffect(() => { handleFetchComments() }, [skill_id]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="row viw-wrapper">
      {postLoading && <Loader />}

      {/* ── Media Section ── */}
      {post && (
        <div className="viw-media-container col-12">
          <main className="viw-media">
            <div className="viw-action-btn p-0">
              <button className="viw-back-btn" onClick={() => navigate(-1)}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>

            <div
              id={`viw-carousel-${post.id}`}
              className="carousel slide viw-carousel"
              data-bs-ride="carousel"
            >
              {post.media?.length > 1 && (
                <div className="carousel-indicators">
                  {post.media.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      data-bs-target={`#viw-carousel-${post.id}`}
                      data-bs-slide-to={index}
                      className={index === 0 ? 'active' : ''}
                      aria-current={index === 0 ? 'true' : undefined}
                    />
                  ))}
                </div>
              )}

              <div className="carousel-inner">
                {post.media?.map((item, index) => (
                  <div
                    key={item.media_id}
                    className={`carousel-item ${index === 0 ? 'active' : ''}`}
                  >
                    <div className="viw-media-images">
                      {item.media_type === 'image'
                        ? <img src={item.media_url} alt="" />
                        : <video src={item.media_url} controls />
                      }
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
                    <span className="carousel-control-prev-icon" />
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target={`#viw-carousel-${post.id}`}
                    data-bs-slide="next"
                  >
                    <span className="carousel-control-next-icon" />
                  </button>
                </>
              )}
            </div>
          </main>

          <footer className="viw-footer">
            <div className="viw-actions d-flex gap-3">
              <div onClick={() => handleSkillLike(post.id)}>
                <FontAwesomeIcon
                  icon={post.user_liked ? faHeartSolid : faHeart}
                  className={`viw-cmt-like-btn
                    ${post.user_liked ? 'liked' : ''}
                    ${skillHeartBeatId === post.id ? 'heart-beat-once' : ''}
                  `}
                />
                <span>{post.like_count}</span>
              </div>

              <div>
                <FontAwesomeIcon icon={faMessage} />
                <span>{post.comment_count || 0}</span>
              </div>

              <div>
                <FontAwesomeIcon icon={faShare} />
              </div>

              {loggedUser?.id !== post.user_id && (
                <div className="ms-auto">
                  <FontAwesomeIcon icon={faSave} />
                </div>
              )}

              {loggedUser?.id === post.user_id && (
                <div onClick={() => navigate(`/feed/editSkill/${post.id}`)}>
                  <FontAwesomeIcon icon={faEdit} />
                </div>
              )}
            </div>

            <div className="viw-description">{post.description}</div>
          </footer>
        </div>
      )}

      {/* ── Comments Section ── */}
      {post && (
        <div className="viw-comments-container col-12">
          {isLoading ? (
            <div className="text-center p-4">Loading comments...</div>
          ) : (
            <ul className="viw-cmt-list">
              {allComments.length > 0 ? (
                allComments.map(cmt => {
                  const isExpanded = expandedComments[cmt.id];
                  return (
                    <li className="viw-cmt-list-item" key={cmt.tempId || cmt.id}>
                      <div
                        className="viw-cmt-lst-item-prf"
                        onClick={() => navigate(`/feed/profile/${cmt.user_id}`)}
                      >
                        <img src={cmt.user_avatar || '/avatar.jpg'} alt="" />
                      </div>

                      <div className="viw-cmt-lst-item-cmt">
                        <div className="viw-cmt-lst-item-cmt-header">
                          <h1 className="viw-cmt-username">{cmt.user_name}</h1>

                          <div className="d-flex justify-content-center align-item-center gap-2">
                            <div className="d-flex flex-column justify-content-center align-items-center">
                              <FontAwesomeIcon
                                icon={cmt.user_liked ? faHeartSolid : faHeart}
                                className={`viw-cmt-like-btn
                                  ${cmt.user_liked ? 'liked' : ''}
                                  ${heartBeatId === cmt.id ? 'heart-beat-once' : ''}
                                `}
                                onClick={() => {
                                  if (!cmt.isTemp) handleLikeComment(cmt.id);
                                }}
                              />
                              <p className="viw-cmt-like-count">{cmt.like_count || 0}</p>
                            </div>

                            {(loggedUser?.id === cmt.user_id || loggedUser?.id === post.user_id) && (
                              <div
                                className="viw-cmt-delete"
                                onClick={() => deleteComment(cmt.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </div>
                            )}
                          </div>
                        </div>

                        <p>
                          {isExpanded
                            ? cmt.text
                            : cmt.text?.slice(0, 200) + (cmt.text?.length > 200 ? '...' : '')}

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
                style={{
                  cursor:  comment.trim() ? 'pointer' : 'not-allowed',
                  opacity: comment.trim() ? 1 : 0.5,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewpost;