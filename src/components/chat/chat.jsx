import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft, faSearch, faPaperPlane,
  faFaceSmile, faPaperclip, faPhone, faVideo, faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons';
import './chat.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/api';
import { useContext } from 'react';
import {AuthContext} from '../../context/AuthContext';

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

function Chat() {
  const loggedUserId = useContext(AuthContext).user?.id;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromMessage = searchParams.get('from') === 'message';
  const targetUserId = searchParams.get('userId');
  const targetName   = searchParams.get('name');
  const targetAvatar = searchParams.get('avatar');

  const [roomList, setRoomList] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [showList, setShowList]     = useState(true);
  const [search, setSearch]         = useState('');

  const [messages, setMessages] = useState([]);  // array, not string
  const [message, setMessage] = useState(''); 

  // if redirected from message button, open that user's chat directly
  useEffect(() => {
    if (fromMessage && targetUserId) {
      console.log(fromMessage, targetUserId)
      // check if room already exists in list
      const existing = roomList.find(c => String(c.id) === targetUserId);
      if (existing) {
        setSelectedRoomId(existing.id);
      } else {
        // new conversation — create a temporary entry
        setSelectedRoomId(targetUserId);
      }
      setShowList(false); // on mobile, go straight to chat
    }
  }, [fromMessage, targetUserId]);

  // 3. selected — match by room_id
  const selected = roomList.find(c => c.room_id === selectedRoomId) ||
    (selectedRoomId ? { room_id: selectedRoomId, other_user_name: targetName, other_user_avatar: targetAvatar, id: targetUserId } : null);
  
  // 1. filtered — guard against empty list
  const filtered = roomList.filter(c =>
    c.other_user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchRoomConversation = async (roomId) => {
    try {
      const response = await API.get(`/chat/room/conversation/${roomId}`);
      console.log('aaaaaa', response);
      setMessages(response.data.roomConversation);
    } catch(error) {
      console.log(error);
    }
  }

  // 2. handleSelect — use room_id
  const handleSelect = (roomId) => {
    console.log('selected room id', roomId)
    setSelectedRoomId(roomId);
    setShowList(false);
  };

  const handleBack = () => {
    setShowList(true);
    setSelectedRoomId(null);
    // clear query params when going back to list
    navigate('/feed/chat', { replace: true });
  };

  const fetchAllRooms = async () => {
    try{
      const response = await API.get('/chat/rooms');
      console.log(response);
      setRoomList(response.data.rooms);
    } catch(error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchAllRooms();
  }, [])

useEffect(() => {
  if (selectedRoomId) fetchRoomConversation(selectedRoomId);
}, [selectedRoomId]);


  const handleMessaageInput = (e) => {
    const {value} = e.target;
    setMessage(value);
  }

  // const sendMessage = async () => {
  //   try{
  //     const payload = {
  //       receiver_id: selected.other_user_id || selected.id,
  //       text: message.trim()
  //     }

  //     const response = await API.post('/chat/send', payload);
  //     console.log(response.data.data)
  //     const data = response.data.data;
  //     const newMessage = {
  //       id: data.message.id,
  //       room_id: data.room.id,
  //       sender_id: data.message.sender_id,
  //       text: data.message.text,
  //       is_read: data.message.is_read,
  //       created_at: data.message.created_at,
  //     }
  //     console.log(messages)
  //     setMessages(prev => [...prev, newMessage])
  //     setRoomList(prev => prev.map(r =>
  //       r.room_id === selectedRoomId
  //         ? { ...r, last_message: message.trim(), last_message_at: new Date().toISOString() }
  //         : r
  //     ));
  //     setMessage('');
  //   } catch(error){
  //     console.log(error);
  //   }
  // }

  const sendMessage = async () => {
    if (!message.trim()) return;

    // optimistic UI
    const tempMsg = {
      id: Date.now(),
      sender_id: loggedUserId,
      text: message.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setMessage('');

    // send via WS — server saves to DB and forwards to receiver
    wsRef.current?.send(JSON.stringify({
      receiver_id: selected.other_user_id || selected.id,
      text: tempMsg.text,
    }));
  };


  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'message') {
        // received from other person
        setMessages(prev => [...prev, data.message]);
        setRoomList(prev => prev.map(r =>
          r.room_id === data.message.room_id
            ? { ...r, last_message: data.message.text }
            : r
        ));
      }
      if (data.type === 'sent') {
        // replace temp message with real one from DB
        setMessages(prev => prev.map(m =>
          typeof m.id === 'number' ? data.message : m  // replace temp id
        ));
      }
    };

    return () => ws.close();
  }, []);


  
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-root">

      {/* ── sidebar ── */}
      <aside className={`chat-sidebar ${showList ? 'mobile-show' : 'mobile-hide'}`}>

        <div className="chat-sidebar-header">
          <button className="ch-back-btn" onClick={() => navigate('/feed')}>
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
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <ul className="chat-list-items">
          {filtered.map(chat => (
            <li
              key={chat.room_id}
              className={`chat-list-item ${selectedRoomId === chat.room_id ? 'active' : ''}` }
              onClick={() => handleSelect(chat.room_id)}
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
              <button className="ch-back-btn d-lg-none" onClick={handleBack}>
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
                  onChange={handleMessaageInput} />
                <button className="ch-icon-btn ch-emoji-btn">
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>
              </div>
              <button className="ch-send-btn" onClick={sendMessage} disabled={!message.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;