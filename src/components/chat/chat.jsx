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
import { WSContext } from '../../context/WSContext';
import './chat.css';

const initialState = {
  roomList: [],
  selectedRoomId: null,
  showList: true,
  search: '',
  messages: [],
  message: '',
  isTyping: false,
  // Pagination states
  hasMoreMessages: true,
  messageOffset: 0,
  loadingMore: false,
  messageLimit: 30,
  totalMessages: 0
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
          // Match by tempId if it exists, or fall back to other methods
          (m.tempId && m.tempId === action.payload.tempId) 
            ? { ...action.payload, tempId: undefined } // Remove tempId after replacement
            : m
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

    case "SET_TYPING":
      return { ...state, isTyping: action.payload }

    case "SET_SEARCH":
      return { ...state, search: action.payload };

    case "HANDLE_BACK":
      return { ...state, showList: true, selectedRoomId: null };


    case "SET_MESSAGES_WITH_PAGINATION":
      return {
        ...state,
        messages: action.payload.messages,
        hasMoreMessages: action.payload.hasMore,
        messageOffset: action.payload.offset + action.payload.messages.length,
        totalMessages: action.payload.total
      };
      
    case "APPEND_OLDER_MESSAGES":
      return {
        ...state,
        messages: [...action.payload.messages, ...state.messages],
        hasMoreMessages: action.payload.hasMore,
        messageOffset: action.payload.newOffset,
        loadingMore: false
      };
      
    case "SET_LOADING_MORE":
      return { ...state, loadingMore: action.payload };
      
    case "RESET_PAGINATION":
      return {
        ...state,
        hasMoreMessages: true,
        messageOffset: 0,
        loadingMore: false
      };
      
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
  const { ws, wsRef, onlineUsers } = useContext(WSContext);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null); 
  const selectedRoomRef = useRef(null);
  const selectedRoom = useMemo(() =>
    roomList.find(c => c.room_id === selectedRoomId) ||
    (selectedRoomId ? {
      room_id: selectedRoomId,
      other_user_name: targetName,
      other_user_avatar: targetAvatar,
      other_user_id: targetUserId
    } : null)
  , [roomList, selectedRoomId, targetName, targetAvatar, targetUserId]);
  const messagesContainerRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
    
  const filtered =  useMemo(() => 
    roomList.filter(c =>
      c.other_user_name?.toLowerCase().includes(search.toLowerCase())
    )
  , [roomList, search]);

  const fetchAllRooms = async () => {
    try{
      const response = await API.get('/chat/rooms');
      dispatch({ type: "SET_ROOMS", payload: response.data.rooms });
      console.log(response)
    } catch(error) {
      console.log(error);
    }
  }

  const onRoomSelect = (roomId) => {
    dispatch({ type: "SELECT_ROOM", payload: roomId });
    navigate(`/feed/chat?room=${roomId}`, { replace: true });
  };

  const handleRoomBack = () => {
    dispatch({ type: "HANDLE_BACK" });
    navigate('/feed/chat', { replace: true });
  };

    // Add this useEffect to set up the intersection observer
  useEffect(() => {
    if (!selectedRoomId || !state.hasMoreMessages || state.loadingMore) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && state.hasMoreMessages && !state.loadingMore) {
          console.log('📜 Load more triggered by scroll');
          fetchRoomConversations(selectedRoomId, true);
        }
      },
      {
        root: messagesContainerRef.current,
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '20px 0px 0px 0px' // Slightly提前 trigger
      }
    );

    // Observe the trigger element
    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [selectedRoomId, state.hasMoreMessages, state.loadingMore, messagesContainerRef.current]);

 // Update fetchRoomConversations to handle scroll loading
  const fetchRoomConversations = async (roomId, loadMore = false) => {
    try {
      if (loadMore) {
        dispatch({ type: "SET_LOADING_MORE", payload: true });
      }
      
      const limit = state.messageLimit;
      const offset = loadMore ? state.messageOffset : 0;
      
      const response = await API.get(
        `/chat/room/conversation/${roomId}?limit=${limit}&offset=${offset}`
      );
      
      console.log('📥 Fetched conversations:', response.data);
      
      if (loadMore) {
        // Store scroll height before updating messages
        const container = messagesContainerRef.current;
        const oldScrollHeight = container?.scrollHeight || 0;
        const oldScrollTop = container?.scrollTop || 0;
        
        // Prepend older messages
        dispatch({ 
          type: "APPEND_OLDER_MESSAGES", 
          payload: {
            messages: response.data.roomConversation,
            hasMore: response.data.pagination.hasMore,
            // Use the new offset from server response instead of calculating
            newOffset: offset + response.data.roomConversation.length
          }
        });
        
        // Restore scroll position after messages are rendered
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            // Adjust scroll to maintain position relative to new content
            container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
          }
        }, 100);
      } else {
        dispatch({ 
          type: "SET_MESSAGES_WITH_PAGINATION", 
          payload: {
            messages: response.data.roomConversation,
            hasMore: response.data.pagination.hasMore,
            offset: 0,
            total: response.data.pagination.total
          }
        });
      }
      
    } catch(error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (loadMore) {
        dispatch({ type: "SET_LOADING_MORE", payload: false });
      }
    }
  };

  // Update the useEffect that fetches on room change
  useEffect(() => {
    dispatch({ type: "SET_TYPING", payload: false });
    dispatch({ type: "RESET_PAGINATION" }); // Reset pagination when room changes
    
    if (selectedRoomId) {
      fetchRoomConversations(selectedRoomId, false); // false = not loading more
    }
  }, [selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

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


  const handleNewMessaageInput = (e) => {
    dispatch({ type: "SET_MESSAGE_INPUT", payload: e.target.value });

    console.log('receiver_id:', selectedRoom?.other_user_id); // ← and this
    console.log('ws readyState:', wsRef?.current?.readyState);
    wsRef?.current?.send(JSON.stringify({
      type: 'typing',
      receiver_id: selectedRoom.other_user_id,
    }))
  }

  const onSendNewMessage = async () => {
    if (!message.trim()) return;
    const tempMsg = {
      id: `temp-${Date.now()}`, // Use string temp ID
      tempId: `temp-${Date.now()}`, // Store it separately
      sender_id: loggedUserId,
      text: message.trim(),
      created_at: new Date().toISOString(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: tempMsg });
    dispatch({ type: "SET_MESSAGE_INPUT", payload: '' });
    wsRef.current?.send(JSON.stringify({
      receiver_id: selectedRoom.other_user_id || selectedRoom.id,
      text: tempMsg.text,
    }));
  };

  useEffect(() => {
    const roomFromUrl = searchParams.get('room');

    const initializeChat = async () => {
      await fetchAllRooms();
      
      // If there's a room ID in URL, select it after rooms load
      if (roomFromUrl) {
        dispatch({ type: "SELECT_ROOM", payload: roomFromUrl });
      }
    };

    fetchAllRooms();
    if (!ws) return;
    
    const handleMessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('📨 WS received:', data); // Add this to debug

      if (data.type === 'message') {
        // This is when someone else sends YOU a message
        console.log('📩 New message from someone:', data.message);
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        dispatch({ 
          type: "UPDATE_ROOM_LAST_MESSAGE", 
          payload: { 
            room_id: data.message.room_id, 
            text: data.message.text 
          } 
        });
      }
      
      if (data.type === 'sent') {
        // This is confirmation that YOUR message was saved
        console.log('✅ Message sent confirmation:', data.message);
        dispatch({ type: "REPLACE_TEMP_MESSAGE", payload: data.message });
        
        // Update the room list with the new last message
        dispatch({ 
          type: "UPDATE_ROOM_LAST_MESSAGE", 
          payload: { 
            room_id: data.message.room_id, 
            text: data.message.text 
          } 
        });
      }
      
      if (data.type === 'typing') {
        if (String(data.sender_id) !== String(selectedRoomRef.current?.other_user_id)) return;
        dispatch({ type: "SET_TYPING", payload: true });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          dispatch({ type: "SET_TYPING", payload: false });
        }, 2000);
      }
      
      if (data.type === 'online_users') {
        // Your WSContext already handles this, but you can also handle it here
        console.log('👥 Online users:', data.userIds);
      }
    };
    initializeChat();
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, selectedRoomId]); // Add dependency

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
                <span 
                  className={`clt-presence-dot ${
                      onlineUsers.has(String(chat.other_user_id)) ? 'online' : 'offline'
                  }`} />
              </div>
              <div className="clt-info">
                <div className="clt-row">
                  <span className="clt-name">{chat.other_user_name}</span>
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
        {!selectedRoom ? (
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
              <img src={selectedRoom?.other_user_avatar || '/avatar.jpg'} alt={selectedRoom?.other_user_name} className="ch-avatar"
                onClick={() => navigate(`/feed/profile/${selectedRoom.other_user_id}`)}
                onError={e => { e.target.src = '/avatar.jpg'; }} />
              <div className="ch-header-info">
                <span className="ch-name">{selectedRoom?.other_user_name}</span>
                <span className="ch-status">
                  <span className="ch-status-dot" />
                     {state.isTyping
                        ? 'typing...'
                        : onlineUsers.has(String(selectedRoom?.other_user_id))
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

            {/* messages area */}
            <div className="ch-messages" ref={messagesContainerRef}>
                {/* Scroll trigger for loading more - appears at the top */}
                {state.hasMoreMessages && messages.length > 0 && (
                  <div 
                    ref={loadMoreTriggerRef}
                    className="ch-scroll-trigger"
                    style={{ 
                      height: '20px', 
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {state.loadingMore && (
                      <div className="ch-loading-indicator">
                        <span className="ch-spinner"></span>
                        <span>Loading older messages...</span>
                      </div>
                    )}
                  </div>
                )}
              {messages.length === 0 ? (
                <div className="ch-empty-state">
                  <img src={selectedRoom?.other_user_avatar || '/avatar.jpg'} alt=""
                    className="ch-empty-avatar" onError={e => { e.target.src = '/avatar.jpg'; }} />
                  <p className="ch-empty-name">{selectedRoom?.other_user_name}</p>
                  <p className="ch-empty-hint">Start the conversation</p>
                </div>
              ) : (
                messages.map(msg => {
                  // Create a unique key - use real ID if available, otherwise use temp ID or fallback
                  const msgKey = msg.id || msg.tempId || `msg-${Date.now()}-${Math.random()}`;
                    
                    return (
                      <div
                        key={msgKey}
                        className={`ch-message ${msg.sender_id === loggedUserId ? 'ch-message-mine' : 'ch-message-theirs'}`}
                      >
                        <p className="ch-message-text">{msg.text}</p>
                        <span className="ch-message-time">{timeAgo(msg.created_at)}</span>
                      </div>
                    );
                  })
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