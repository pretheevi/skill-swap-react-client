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
      return {
        ...state,
        selectedRoomId: action.payload,
        showList: false,
        // Clear messages when selecting new room
        messages: [],
        messageOffset: 0,
        hasMoreMessages: true
      };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "ADD_MESSAGE":
      // Only add if it belongs to current room
      if (action.payload.room_id && action.payload.room_id !== state.selectedRoomId) {
        return state;
      }
      return { ...state, messages: [...state.messages, action.payload] };

    case "REPLACE_TEMP_MESSAGE":
      return {
        ...state,
        messages: state.messages.map(m =>
          (m.tempId && m.tempId === action.payload.tempId)
            ? { ...action.payload, tempId: undefined }
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
      return { ...state, isTyping: action.payload };

    case "SET_SEARCH":
      return { ...state, search: action.payload };

    case "HANDLE_BACK":
      return {
        ...state,
        showList: true,
        selectedRoomId: null,
        messages: [], // Clear messages when going back
        messageOffset: 0,
        hasMoreMessages: true
      };

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

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        messageOffset: 0,
        hasMoreMessages: true
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
  const targetName = searchParams.get('name');
  const targetAvatar = searchParams.get('avatar');
  const loggedUserId = useContext(AuthContext).user?.id;
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { roomList, selectedRoomId, showList, search, messages, message } = state;
  const { ws, wsRef, onlineUsers } = useContext(WSContext);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);   // ← add this
  const loadMoreTriggerRef = useRef(null);      // ← add this
  const observerRef = useRef(null); 
  const typingTimeoutRef = useRef(null);
  const selectedRoomRef = useRef(null);
  const isLoadingOlderRef = useRef(false);
  const prevLengthRef = useRef(0);
  const selectedRoom = useMemo(() =>
    roomList.find(c => c.room_id === selectedRoomId) ||
    (selectedRoomId ? {
      room_id: selectedRoomId, // This is crucial!
      other_user_name: targetName,
      other_user_avatar: targetAvatar,
      other_user_id: targetUserId
    } : null)
    , [roomList, selectedRoomId, targetName, targetAvatar, targetUserId]);

  const filtered = useMemo(() =>
    roomList.filter(c =>
      c.other_user_name?.toLowerCase().includes(search.toLowerCase())
    )
    , [roomList, search]);

  const fetchAllRooms = async () => {
    try {
      const response = await API.get('/chat/rooms');
      dispatch({ type: "SET_ROOMS", payload: response.data.rooms });
      console.log('Rooms fetched:', response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const onRoomSelect = (roomId) => {
    dispatch({ type: "SELECT_ROOM", payload: roomId });
    navigate(`/feed/chat?room=${roomId}`, { replace: true });
  };

  const handleRoomBack = () => {
    dispatch({ type: "HANDLE_BACK" });
    navigate('/feed/chat', { replace: true });
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!selectedRoomId || !state.hasMoreMessages || state.loadingMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.hasMoreMessages && !state.loadingMore) {
          fetchRoomConversations(selectedRoomId, true);
        }
      },
      {
        root: messagesContainerRef.current,
        threshold: 0.1,
        rootMargin: '50px 0px 0px 0px',
      }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [selectedRoomId, state.hasMoreMessages, state.loadingMore, messages.length]);

  const fetchRoomConversations = async (roomId, loadMore = false) => {
    if (selectedRoomId !== roomId) return;
    try {
      if (loadMore) {
        isLoadingOlderRef.current = true;
        dispatch({ type: "SET_LOADING_MORE", payload: true });
      }

      const limit = state.messageLimit;
      const offset = loadMore ? state.messageOffset : 0;

      const response = await API.get(
        `/chat/room/conversation/${roomId}?limit=${limit}&offset=${offset}`
      );

      if (selectedRoomId !== roomId) {
        // Ignore stale response for previously selected room
        return;
      }

      console.log('📥 Fetched conversations:', response.data);
      const fetchedMessages = Array.isArray(response.data.roomConversation)
        ? response.data.roomConversation.slice().reverse()
        : [];
      if (loadMore) {
        const container = messagesContainerRef.current;
        const oldScrollHeight = container?.scrollHeight || 0;
        const oldScrollTop = container?.scrollTop || 0;

        dispatch({
          type: "APPEND_OLDER_MESSAGES",
          payload: {
            messages: fetchedMessages,
            hasMore: response.data.pagination.hasMore,
            newOffset: offset + fetchedMessages.length
          }
        });

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
          }
        }, 100);
      } else {
        dispatch({
          type: "SET_MESSAGES_WITH_PAGINATION",
          payload: {
            messages: fetchedMessages,
            hasMore: response.data.pagination.hasMore,
            offset: 0,
            total: response.data.pagination.total
          }
        });
      }

    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (loadMore) {
        // dispatch({ type: "SET_LOADING_MORE", payload: false });
      }
    }
  };

  // Fetch messages when room changes
  useEffect(() => {
    dispatch({ type: "SET_TYPING", payload: false });
    dispatch({ type: "RESET_PAGINATION" });

    if (selectedRoomId) {
      fetchRoomConversations(selectedRoomId, false);
    }
  }, [selectedRoomId]);

  // Scroll to bottom only on new messages (not on load more)
  useEffect(() => {
    const prev = prevLengthRef.current;
    const curr = messages.length;

    if (isLoadingOlderRef.current) {
      isLoadingOlderRef.current = false;
      prevLengthRef.current = curr;
      return;
    }

    if (curr > prev && !state.loadingMore && messagesContainerRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.room_id === selectedRoomId) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    prevLengthRef.current = curr;
  }, [messages, state.loadingMore, selectedRoomId]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Handle navigation from message link
  useEffect(() => {
    if (!fromMessage || !targetUserId) return;
    if (roomList.length === 0) return;

    const existing = roomList.find(c => String(c.other_user_id) === String(targetUserId));

    if (existing) {
      dispatch({ type: "SELECT_ROOM", payload: existing.room_id });
    } else {
      dispatch({ type: "SELECT_ROOM", payload: `temp-${targetUserId}` });
    }
  }, [fromMessage, targetUserId, roomList]);


  const typingSendTimeoutRef = useRef(null);

  const handleNewMessageInput = (e) => {
    dispatch({ type: "SET_MESSAGE_INPUT", payload: e.target.value });

    // Debounce typing indicator
    if (typingSendTimeoutRef.current) {
      clearTimeout(typingSendTimeoutRef.current);
    }

    typingSendTimeoutRef.current = setTimeout(() => {
      if (selectedRoom?.other_user_id) {
        wsRef?.current?.send(JSON.stringify({
          type: 'typing',
          receiver_id: selectedRoom.other_user_id,
        }));
      }
    }, 300);
  };

  const onSendNewMessage = async () => {
    if (!message.trim() || !selectedRoom) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMsg = {
      id: tempId,
      tempId,
      sender_id: loggedUserId,
      text: message.trim(),
      created_at: new Date().toISOString(),
      room_id: selectedRoom.room_id // Include room_id
    };

    dispatch({ type: "ADD_MESSAGE", payload: tempMsg });
    dispatch({ type: "SET_MESSAGE_INPUT", payload: '' });

    wsRef.current?.send(JSON.stringify({
      receiver_id: selectedRoom.other_user_id || selectedRoom.id,
      text: tempMsg.text,
      tempId,
      room_id: selectedRoom.room_id
    }));
  };

  // Initialize chat and WebSocket listeners
  useEffect(() => {
    const roomFromUrl = searchParams.get('room');

    const initializeChat = async () => {
      await fetchAllRooms();

      if (roomFromUrl) {
        dispatch({ type: "SELECT_ROOM", payload: roomFromUrl });
      }
    };

    initializeChat();

    if (!ws) return;

    const handleMessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('📨 WS received:', data);

      if (data.type === 'message') {
        // Only add if it belongs to current room
        if (data.message.room_id === selectedRoomId) {
          dispatch({ type: "ADD_MESSAGE", payload: data.message });
        }

        dispatch({
          type: "UPDATE_ROOM_LAST_MESSAGE",
          payload: {
            room_id: data.message.room_id,
            text: data.message.text
          }
        });
      }

      if (data.type === 'sent') {
        console.log('✅ Message sent confirmation:', data.message);
        dispatch({ type: "REPLACE_TEMP_MESSAGE", payload: data.message });

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
        console.log('👥 Online users:', data.userIds);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]); // Re-run when selectedRoomId changes
  // Add to the cleanup in your main useEffect
  useEffect(() => {
    return () => {
      if (typingSendTimeoutRef.current) {
        clearTimeout(typingSendTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className="chat-root">

      {/* Sidebar */}
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
              className={`chat-list-item ${selectedRoomId === chat.room_id ? 'active' : ''}`}
              onClick={() => onRoomSelect(chat.room_id)}
            >
              <div className="clt-avatar-wrap">
                <img src={chat.other_user_avatar || '/avatar.jpg'} alt={chat.other_user_name} className="clt-avatar" />
                <span
                  className={`clt-presence-dot ${onlineUsers.has(String(chat.other_user_id)) ? 'online' : 'offline'
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

      {/* Chat window */}
      <div className={`chat-window ${!showList ? 'mobile-show' : 'mobile-hide'}`}>
        {!selectedRoom ? (
          <div className="ch-no-selection">
            <p>Select a conversation or message someone</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="ch-header">
              <button className="ch-back-btn d-lg-none" onClick={handleRoomBack}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <img
                src={selectedRoom?.other_user_avatar || '/avatar.jpg'}
                alt={selectedRoom?.other_user_name}
                className="ch-avatar"
                onClick={() => navigate(`/feed/profile/${selectedRoom.other_user_id}`)}
                onError={e => { e.target.src = '/avatar.jpg'; }}
              />
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

            {/* Messages area */}
            <div className="ch-messages" ref={messagesContainerRef}>
              {/* Scroll trigger for loading more */}
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
                  <img
                    src={selectedRoom?.other_user_avatar || '/avatar.jpg'}
                    alt=""
                    className="ch-empty-avatar"
                    onError={e => { e.target.src = '/avatar.jpg'; }}
                  />
                  <p className="ch-empty-name">{selectedRoom?.other_user_name}</p>
                  <p className="ch-empty-hint">Start the conversation</p>
                </div>
              ) : (
                messages.map(msg => {
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

            {/* Input footer */}
            <footer className="ch-footer">
              <button className="ch-icon-btn"><FontAwesomeIcon icon={faPaperclip} /></button>
              <div className="ch-input-wrap">
                <input
                  type="text"
                  placeholder="Message..."
                  className="ch-input"
                  value={message}
                  onChange={handleNewMessageInput}
                />
                <button className="ch-icon-btn ch-emoji-btn">
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>
              </div>
              <button
                className="ch-send-btn"
                onClick={onSendNewMessage}
                disabled={!message.trim()}
              >
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