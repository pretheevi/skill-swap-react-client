import { useEffect, useRef, useMemo, useReducer, useContext } from 'react';
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
import API from '../api/api';
import { AuthContext } from '../../context/AuthContext';
import './chat.css';

const initialState = {
  roomList: [],
  selectedRoomId: null,
  showList: true,
  search: '',
  messages: [],
  message: '',
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case "SET_ROOMS":
      return { ...state, roomList: action.payload };

    case "SELECT_ROOM":
      return { ...state, selectedRoomId: action.payload, showList: false };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "REPLACE_TEMP_MESSAGE":
      return {
        ...state,
        messages: state.messages.map(m =>
          typeof m.id === 'number' ? action.payload : m
        )
      };

    case "UPDATE_ROOM_LAST_MESSAGE":
      return {
        ...state,
        roomList: state.roomList.map(r =>
          r.room_id === action.payload.room_id
            ? { ...r, last_message: action.payload.text }
            : r
        )
      };

    case "SET_MESSAGE_INPUT":
      return { ...state, message: action.payload };

    case "SET_SEARCH":
      return { ...state, search: action.payload };

    case "HANDLE_BACK":
      return { ...state, showList: true, selectedRoomId: null };

    default:
      return state;
  }
};

function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromMessage = searchParams.get('from') === 'message';
  const targetUserId = searchParams.get('userId');
  const targetName   = searchParams.get('name');
  const targetAvatar = searchParams.get('avatar');
  const loggedUserId = useContext(AuthContext).user?.id;
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { roomList, selectedRoomId, showList, search, messages, message } = state;
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
   

  const selected = useMemo(() =>
    roomList.find(c => c.room_id === selectedRoomId) ||
    (selectedRoomId ? {
      room_id: selectedRoomId,
      other_user_name: targetName,
      other_user_avatar: targetAvatar,
      other_user_id: targetUserId
    } : null)
  , [roomList, selectedRoomId, targetName, targetAvatar, targetUserId]);
    
  const filtered =  useMemo(() => 
    roomList.filter(c =>
      c.other_user_name?.toLowerCase().includes(search.toLowerCase())
    )
  , [roomList, search]);

  const fetchAllRooms = async () => {
    try{
      const response = await API.get('/chat/rooms');
      dispatch({ type: "SET_ROOMS", payload: response.data.rooms });
    } catch(error) {
      console.log(error);
    }
  }

  const onRoomSelect = (roomId) => {
    dispatch({ type: "SELECT_ROOM", payload: roomId });
  };

  const handleRoomBack = () => {
    dispatch({ type: "HANDLE_BACK" });
    navigate('/feed/chat', { replace: true });
  };

  const fetchRoomConversations = async (roomId) => {
    try {
      const response = await API.get(`/chat/room/conversation/${roomId}`);
      console.log('fetchRoomConversation', response.data);
      dispatch({ type: "SET_MESSAGES", payload: response.data.roomConversation });
    } catch(error) {
      console.log(error);
    }
  }

  const handleNewMessaageInput = (e) => {
    dispatch({ type: "SET_MESSAGE_INPUT", payload: e.target.value });
  }

  const onSendNewMessage = async () => {
    if (!message.trim()) return;
    const tempMsg = {
      id: Date.now(),
      sender_id: loggedUserId,
      text: message.trim(),
      created_at: new Date().toISOString(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: tempMsg });
    dispatch({ type: "SET_MESSAGE_INPUT", payload: '' });
    wsRef.current?.send(JSON.stringify({
      receiver_id: selected.other_user_id || selected.id,
      text: tempMsg.text,
    }));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedRoomId) fetchRoomConversations(selectedRoomId);
  }, [selectedRoomId]);

  useEffect(() => {
    if (!fromMessage || !targetUserId) return;
    if (roomList.length === 0) return;

    const existing = roomList.find(c => String(c.other_user_id) === String(targetUserId));
    
    if (existing) {
      dispatch({ type: "SELECT_ROOM", payload: existing.room_id });
    } else {
      dispatch({ type: "SELECT_ROOM", payload: targetUserId });
    }
  }, [fromMessage, targetUserId, roomList]);


  useEffect(() => {
    fetchAllRooms();

    const token = localStorage.getItem('token');
    const wsUrl = [
      `wss://insta-mirror-server.onrender.com?token=${token}`,
      `ws://localhost:8080?token=${token}`
    ]
    const ws = new WebSocket(wsUrl[0]);
    wsRef.current = ws;

      // ping every 30 seconds to keep alive
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'message') {
        // received from other person
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        dispatch({ type: "UPDATE_ROOM_LAST_MESSAGE", payload: data.message });
      }
      if (data.type === 'sent') {
        // replace temp message with real one from DB
        dispatch({ type: "REPLACE_TEMP_MESSAGE", payload: data.message });
      }
    };

    return () => {
    clearInterval(ping);
    ws.close();
  };
  }, []);

  return (
    <div className="chat-root">

      {/* ── sidebar ── */}
      <aside className={`chat-sidebar ${showList ? 'mobile-show' : 'mobile-hide'}`}>

        <div className="chat-sidebar-header">
          <button className="ch-back-btn" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h2 className="chat-title">Messages</h2>
        </div>

        <div className="chat-search">
          <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
          />
        </div>

        <ul className="chat-list-items">
          {filtered.map(chat => (
            <li
              key={chat.room_id}
              className={`chat-list-item ${selectedRoomId === chat.room_id ? 'active' : ''}` }
              onClick={() => onRoomSelect(chat.room_id)}
            >
              <div className="clt-avatar-wrap">
                <img src={chat.other_user_avatar || '/avatar.jpg'} alt={chat.other_user_name} className="clt-avatar" />
                {/* {chat && <span className="clt-unread-dot" />} */}
              </div>
              <div className="clt-info">
                <div className="clt-row">
                  <span className="clt-name">{chat.other_user_name}</span>
                  {/* <span className="clt-time">{chat.lastActive}</span> */}
                </div>
                <p className="clt-preview">{chat.last_message}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── chat window ── */}
      <div className={`chat-window ${!showList ? 'mobile-show' : 'mobile-hide'}`}>

        {/* no room selected — blank state on desktop */}
        {!selected ? (
          <div className="ch-no-selection">
            <p>Select a conversation or message someone</p>
          </div>
        ) : (
          <>
            {/* header */}
            <header className="ch-header">
              <button className="ch-back-btn d-lg-none" onClick={handleRoomBack}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <img src={selected?.other_user_avatar || '/avatar.jpg'} alt={selected?.other_user_name} className="ch-avatar"
                onClick={() => navigate(`/feed/profile/${selected.other_user_id}`)}
                onError={e => { e.target.src = '/avatar.jpg'; }} />
              <div className="ch-header-info">
                <span className="ch-name">{selected?.other_user_name}</span>
                <span className="ch-status">
                  <span className="ch-status-dot" />
                  Active now
                </span>
              </div>
              <div className="ch-header-actions">
                <button className="ch-icon-btn"><FontAwesomeIcon icon={faPhone} /></button>
                <button className="ch-icon-btn"><FontAwesomeIcon icon={faVideo} /></button>
                <button className="ch-icon-btn"><FontAwesomeIcon icon={faEllipsisVertical} /></button>
              </div>
            </header>

            {/* messages area */}
            <div className="ch-messages">
              {messages.length === 0 ? (
                <div className="ch-empty-state">
                  <img src={selected?.other_user_avatar || '/avatar.jpg'} alt=""
                    className="ch-empty-avatar" onError={e => { e.target.src = '/avatar.jpg'; }} />
                  <p className="ch-empty-name">{selected?.other_user_name}</p>
                  <p className="ch-empty-hint">Start the conversation</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`ch-message ${msg.sender_id === loggedUserId ? 'ch-message-mine' : 'ch-message-theirs'}`}
                  >
                    <p className="ch-message-text">{msg.text}</p>
                    <span className="ch-message-time">{timeAgo(msg.created_at)}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* input footer */}
            <footer className="ch-footer">
              <button className="ch-icon-btn"><FontAwesomeIcon icon={faPaperclip} /></button>
              <div className="ch-input-wrap">
                <input 
                  type="text" 
                  placeholder="Message..." 
                  className="ch-input"
                  value={message}
                  onChange={handleNewMessaageInput} />
                <button className="ch-icon-btn ch-emoji-btn">
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>
              </div>
              <button className="ch-send-btn" onClick={onSendNewMessage} disabled={!message.trim()}>
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
  // append Z if no timezone info — forces UTC parsing
  const date = new Date(normalized.endsWith('Z') ? normalized : normalized + 'Z');
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60)      return 'just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default Chat;