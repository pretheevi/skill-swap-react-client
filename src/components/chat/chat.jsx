import { useContext, useEffect,useReducer, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideo,
  faPhone,
  faSearch,
  faFaceSmile,
  faPaperclip,
  faPaperPlane,
  faChevronLeft,
  faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons';
import './chat.css';
import API from '../api/api';

import { AuthContext } from '../../context/AuthContext';
import { WSContext } from '../../context/WSContext';
import { initialState, chatReducer } from '../../context/chatContext';


function Chat() {
  const navigate = useNavigate();
  const loggedUserId = useContext(AuthContext).user?.id;
  const [searchParams] = useSearchParams();
  const targetFromMessage = searchParams.get('from') === 'message';
  const targetUserId   = searchParams.get('userId');
  const targetName     = searchParams.get('name');
  const targetAvatar   = searchParams.get('avatar');
  const { ws, onlineUsers, registerMessageHandler  } = useContext(WSContext);
  const [ state, dispatch ] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef(null);
  const loadMoreRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const typingClearRef = useRef(null);

  const onNewMessageInput = (e) => {
    dispatch({type: 'SET_NEW_MESSAGE', payload: e.target.value});
    
    if (typingTimeoutRef.current) return;

    ws.send(JSON.stringify({
        type: 'typing',
        room_id: state.selectedRoom?.room_id,
        receiver_id: state.selectedRoom?.other_user_id,
    }));

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  }

  const onNewMessageSend = (room_id, receiver_id) => {
    const newMessage = state.newMessage.trim();
    if (!newMessage) return;
    ws.send(JSON.stringify({
      room_id,
      receiver_id,
      type: "message",
      text: newMessage
    }));
    dispatch({ type: 'APPEND_MESSAGE', payload: {
      id: `temp-${Date.now()}`,
      sender_id: loggedUserId,
      text: newMessage,
      created_at: new Date().toISOString(),
      scrollDown: true,
    }});
    dispatch({type: 'SET_NEW_MESSAGE', payload: ''});
    clearTimeout(typingTimeoutRef.current);
  }

  const onDeleteMessage = async (msg) => {
    try {
      ws.send(JSON.stringify({
        type: 'delete_message',
        message_id: msg.id,
        receiver_id: state.selectedRoom.other_user_id,
        sender_id: loggedUserId,
      }));

      await API.delete(`/chat/message/${msg.id}`);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRooms = async () => {
    try{
      const response = await API.get("/chat/rooms");
      const rooms = response.data.rooms;
      console.log(rooms)
      dispatch({ type: "SET_ROOMS", payload: rooms });
      
      if (targetFromMessage && targetUserId) {
        const match = rooms.find(r => r.other_user_id === targetUserId);
        if (match) {
          dispatch({ type: "SET_SELECTED_ROOM", payload: match });
        } else {
          // fake room just to open the window
          const fakeRoom = {
            room_id: null,
            other_user_id: targetUserId,
            other_user_name: targetName,
            other_user_avatar: targetAvatar,
            last_message: null,
          };
          dispatch({ type: "SET_SELECTED_ROOM", payload: fakeRoom }); 
        }
      } 
    } catch(error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchConversation = async (offset=0) => {
    const limit = 30;
    
    if (offset > 0) {
        prevScrollHeightRef.current = messagesContainerRef.current?.scrollHeight;  // ✅ save before fetch
    }
    
    try {
      const response = await API.get(`/chat/room/conversation/${state.selectedRoom.room_id}?limit=${limit}&offset=${offset}`);
      console.log(response);
      const messages = response.data.roomConversation;
      console.log(messages)
      if (offset === 0) {
        dispatch({ type: 'SET_ROOM_CONVERSATION', payload: messages });
        await API.patch(`/chat/room/${state.selectedRoom.room_id}/read`);
      
      } else {
        dispatch({ type: 'PREPEND_MESSAGES', payload: messages });  // older msgs go on top
      }

      dispatch({ type: 'SET_OFFSET', payload: offset + limit });
      dispatch({ type: 'SET_HAS_MORE', payload: messages.length === limit });  // if less than 30, no more
    } catch(error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!state.selectedRoom?.room_id) return;  // skip fake room (null id)
    fetchConversation();
  }, [state.selectedRoom?.room_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.shouldScrollBottom]);

  useEffect(() => {
    if (prevScrollHeightRef.current && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;  // ✅ restore
      prevScrollHeightRef.current = 0;
    }
  }, [state.roomConversation]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && state.hasMore) {
        fetchConversation(state.offset);
      }
    });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [state.offset, state.hasMore, state.selectedRoom?.room_id]);

  useEffect(() => {
    registerMessageHandler((parsed) => {
        if (parsed.type === 'typing') {
            dispatch({ type: 'SET_TYPING', payload: parsed.sender_id });

            clearTimeout(typingClearRef.current);
            typingClearRef.current = setTimeout(() => {
              dispatch({ type: 'SET_TYPING', payload: null });
            }, 3000);
            return;
        }

        if (parsed.type === 'delete_message') {
          dispatch({ type: 'DELETE_MESSAGE_BY_ID', payload: parsed.message_id });
          return;
        }

        if (parsed.type === 'message') {      
          if (parsed.sender_id !== loggedUserId) {
              dispatch({ type: 'APPEND_MESSAGE', payload: {
                id: parsed.message_id,
                sender_id: parsed.sender_id,
                text: parsed.text,
                created_at: new Date().toISOString(),
                scrollDown: false,
              }});
            }

          if (state.selectedRoom?.room_id !== parsed.room_id) {
            dispatch({ type: 'INCREMENT_UNREAD', payload: parsed.room_id });
          }

          if (state.selectedRoom && !state.selectedRoom.room_id) {
            const newRoom = { ...state.selectedRoom, room_id: parsed.room_id };
            console.log('new room', newRoom);
            dispatch({ type: 'SET_SELECTED_ROOM', payload: newRoom });
            dispatch({ type: 'SET_ROOMS', payload: [newRoom, ...state.rooms] });
          }
      }
    });

    return () => {
      registerMessageHandler(null);
      clearTimeout(typingClearRef.current);
      typingClearRef.current = null;
    }
  }, [state.selectedRoom]);

  return (
    <div className="chat-root">

      {/* SIDEBAR */}
      <aside className={`chat-sidebar ${state.showList ? 'mobile-show' : 'mobile-hide'}`}>
        <div className="chat-sidebar-header">
          <button 
            className="ch-back-btn"
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h2 className="chat-title">Messages</h2>
        </div>

        <div className="chat-search">
          <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
          <input type="text" placeholder="Search..." />
        </div>

        <ul className="chat-list-items">
          {state?.rooms?.length > 0 
            && state.rooms.map(r => {
              return (
                <li   
                  key={r.room_id}  
                  className={`chat-list-item ${state.selectedRoom?.room_id === r.room_id ? 'active' : ''}`}
                  onClick={() => {
                    dispatch({ type: "SET_SELECTED_ROOM", payload: r });
                    dispatch({ type: "MARK_ROOM_READ", payload: r.room_id });
                  }}  
                >
                  <div className="clt-avatar-wrap">
                    <img src={r.other_user_avatar || "/avatar.jpg"} alt="John Doe" className="clt-avatar" />
                    <span className={`clt-presence-dot ${onlineUsers.has(String(r.other_user_id)) ? 'online' : ''}`} />
                  </div>
                  <div className="clt-info">
                    <div className="clt-row">
                      <span className="clt-name">{r.other_user_name}</span>
                      {r.unread_count > 0 && (
                        <span className="clt-unread-badge">
                          {r.unread_count > 99 ? '99+' : r.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="clt-preview">{r.last_message}</p>
                  </div>
                </li>
              )
            })}
        </ul>
      </aside>

      {/* CHAT WINDOW */}
      <div className={`chat-window ${!state.showList ? 'mobile-show' : 'mobile-hide'}`}>
        {!state.selectedRoom ? (
          <div className="ch-no-selection">
            <p>Select a conversation</p>
          </div>
        ) : (
          <>
            <header className="ch-header">
              <button 
                className="ch-back-btn d-lg-none" 
                onClick={() => {
                  dispatch({ type:"SET_SHOW_LIST", payload: true });
                  navigate('/feed/chat', {replace: true});
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <img src={state.selectedRoom.other_user_avatar || '/avatar.jpg'} alt="John Doe" className="ch-avatar" />
              <div className="ch-header-info">
                <span className="ch-name">{state.selectedRoom.other_user_name}</span>
                  <span className="ch-status">
                    <span className="ch-status-dot" />
                    {state.typingUserId === state.selectedRoom.other_user_id
                      ? 'typing...'
                      : onlineUsers.has(String(state.selectedRoom.other_user_id)) 
                        ? 'Active now' 
                        : 'Offline'
                    }
                  </span>
              </div>
              <div className="ch-header-actions">
                <button className="ch-icon-btn"><FontAwesomeIcon icon={faPhone} /></button>
                <button className="ch-icon-btn"><FontAwesomeIcon icon={faVideo} /></button>
                <button className="ch-icon-btn"><FontAwesomeIcon icon={faEllipsisVertical} /></button>
              </div>
            </header>

            <div className="ch-messages" ref={messagesContainerRef}>
              <div ref={loadMoreRef} />
              {state.roomConversation?.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`ch-message ${msg.sender_id === loggedUserId ? 'ch-message-mine' : 'ch-message-theirs'}`}
                  onDoubleClick={() => dispatch({ type: 'SET_SELECTED_MESSAGE', payload: msg.id })}
                >
                  <p className="ch-message-text">{msg.text}</p>
                  <span className="ch-message-time">{timeAgo(msg.created_at)}</span>
                
                  {state.selectedMessageIndex === msg.id && msg.sender_id === loggedUserId && (
                    <button
                      className='ch-delete-btn'
                      onClick={() => onDeleteMessage(msg)}
                    >
                      delete
                    </button>
                  )}
                
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <footer className="ch-footer">
              <button className="ch-icon-btn"><FontAwesomeIcon icon={faPaperclip} /></button>
              <div className="ch-input-wrap">
                <input 
                  type="text" 
                  value={state.newMessage}
                  placeholder="Message..." 
                  className="ch-input" 
                  onChange={onNewMessageInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                       onNewMessageSend(state.selectedRoom.room_id, state.selectedRoom.other_user_id)
                    }
                  }}
                />
                <button className="ch-icon-btn ch-emoji-btn">
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>
              </div>
              <button className="ch-send-btn" onClick={(e) => onNewMessageSend(state.selectedRoom.room_id, state.selectedRoom.other_user_id)}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </footer> 
          </>
        )}

      </div>

    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const normalized = dateStr.replace(' ', 'T');
  const date = new Date(normalized.endsWith('Z') ? normalized : normalized + 'Z');
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default Chat;