import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faSearch,
  faMicrophone,
  faPaperclip,
  faPaperPlane,
  faFaceSmile,
  faPhone,
  faVideo,
  faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons';
import './chat.css';
import { useNavigate } from 'react-router-dom';

const chatList = [
  { id: 1, name: 'Sonya Leena',    avatar: 'https://i.pinimg.com/736x/fe/57/11/fe571153716bc8c7c319cf62bfa69a1d.jpg', lastMessage: 'Hey! Did you check the UI draft?',   lastActive: '28 Jan', unread: true  },
  { id: 2, name: 'Adam Addison',   avatar: 'https://i.pinimg.com/736x/4c/9c/33/4c9c338e8a6ccf3f74c3b6c7b4a55f30.jpg', lastMessage: "Let's push the backend today",       lastActive: '27 Jan', unread: false },
  { id: 3, name: 'Nora Miles',     avatar: 'https://i.pinimg.com/736x/4e/98/44/4e98440c3dc8d67a1b34cbe6f89d0c77.jpg', lastMessage: 'Carousel looks clean 👌',             lastActive: '26 Jan', unread: true  },
  { id: 4, name: 'Leo Carter',     avatar: 'https://i.pinimg.com/736x/7a/5c/af/7a5caf8d1f8b0e5c79a6e0ed2d2b6b89.jpg', lastMessage: "I'll fix the CORS issue",              lastActive: '25 Jan', unread: false },
  { id: 5, name: 'Ava Stone',      avatar: 'https://i.pinimg.com/736x/24/89/5a/24895a8f76e0bbbd1c94bfc7db4a7a10.jpg', lastMessage: 'Can we add dark mode?',               lastActive: '24 Jan', unread: true  },
  { id: 6, name: 'Ryan Brooks',    avatar: 'https://i.pinimg.com/736x/9c/68/3f/9c683f6e40a9cfdfc8c60f6c30f3b2c3.jpg', lastMessage: 'WebSocket is live 🔥',                lastActive: '23 Jan', unread: false },
  { id: 7, name: 'Maya Patel',     avatar: 'https://i.pinimg.com/736x/61/9f/8c/619f8c7f5d8b9e6d7e0c9a7d4f2b1c33.jpg', lastMessage: 'Animations feel smooth now',          lastActive: '22 Jan', unread: false },
  { id: 8, name: 'Ethan Wong',     avatar: 'https://i.pinimg.com/736x/44/ab/12/44ab12d1d9d5d0a67f6c6bfc7f123456.jpg', lastMessage: 'Deploying to Vercel rn',              lastActive: '21 Jan', unread: true  },
  { id: 9, name: 'Sophia Ray',     avatar: 'https://i.pinimg.com/736x/8e/23/45/8e2345e1a9d6f2b7c4d9a1f123abcd.jpg',  lastMessage: 'That gradient is perfect 💜',         lastActive: '20 Jan', unread: false },
  { id: 10, name: 'Chris Nolan',   avatar: 'https://i.pinimg.com/736x/3d/91/77/3d9177d4e8c9b1f0e4c2a8d9f7654321.jpg', lastMessage: "We're almost production-ready",      lastActive: '19 Jan', unread: true  },
];

function Chat() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(1);
  const [showList, setShowList] = useState(true); // mobile: show list or chat
  const [search, setSearch] = useState('');

  const selected = chatList.find(c => c.id === selectedId);
  const filtered = chatList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    setShowList(false); // on mobile, switch to chat view
  };

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
              key={chat.id}
              className={`chat-list-item ${selectedId === chat.id ? 'active' : ''} ${chat.unread ? 'unread' : ''}`}
              onClick={() => handleSelect(chat.id)}
            >
              <div className="clt-avatar-wrap">
                <img src={chat.avatar} alt={chat.name} className="clt-avatar" />
                {chat.unread && <span className="clt-unread-dot" />}
              </div>
              <div className="clt-info">
                <div className="clt-row">
                  <span className="clt-name">{chat.name}</span>
                  <span className="clt-time">{chat.lastActive}</span>
                </div>
                <p className="clt-preview">{chat.lastMessage}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── chat window ── */}
      <div className={`chat-window ${!showList ? 'mobile-show' : 'mobile-hide'}`}>

        {/* header */}
        <header className="ch-header">
          <button className="ch-back-btn d-lg-none" onClick={() => setShowList(true)}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <img src={selected?.avatar} alt={selected?.name} className="ch-avatar" />
          <div className="ch-header-info">
            <span className="ch-name">{selected?.name}</span>
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
          <div className="ch-empty-state">
            <img src={selected?.avatar} alt="" className="ch-empty-avatar" />
            <p className="ch-empty-name">{selected?.name}</p>
            <p className="ch-empty-hint">Start the conversation</p>
          </div>
        </div>

        {/* input footer */}
        <footer className="ch-footer">
          <button className="ch-icon-btn"><FontAwesomeIcon icon={faPaperclip} /></button>
          <div className="ch-input-wrap">
            <input type="text" placeholder="Message..." className="ch-input" />
            <button className="ch-icon-btn ch-emoji-btn">
              <FontAwesomeIcon icon={faFaceSmile} />
            </button>
          </div>
          <button className="ch-send-btn">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </footer>

      </div>
    </div>
  );
}

export default Chat;