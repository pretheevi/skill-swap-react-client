import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faSearch,
  faMicrophone,
  faPaperclip,
  faPaperPlane,
  faFaceSmile,
} from '@fortawesome/free-solid-svg-icons';
import './chat.css';
import { useNavigate } from 'react-router-dom';

function Chat() {
  // Mock data
  const chatList = [
    {
      id: 1,
      name: 'Sonya Leena',
      avatar:
        'https://i.pinimg.com/736x/fe/57/11/fe571153716bc8c7c319cf62bfa69a1d.jpg',
      lastMessage: 'Hey! Did you check the UI draft?',
      lastActive: '28 Jan',
      unread: true,
    },
    {
      id: 2,
      name: 'Adam Addison',
      avatar:
        'https://i.pinimg.com/736x/4c/9c/33/4c9c338e8a6ccf3f74c3b6c7b4a55f30.jpg',
      lastMessage: 'Let’s push the backend today',
      lastActive: '27 Jan',
      unread: false,
    },
    {
      id: 3,
      name: 'Nora Miles',
      avatar:
        'https://i.pinimg.com/736x/4e/98/44/4e98440c3dc8d67a1b34cbe6f89d0c77.jpg',
      lastMessage: 'Carousel looks clean 👌',
      lastActive: '26 Jan',
      unread: true,
    },
    {
      id: 4,
      name: 'Leo Carter',
      avatar:
        'https://i.pinimg.com/736x/7a/5c/af/7a5caf8d1f8b0e5c79a6e0ed2d2b6b89.jpg',
      lastMessage: 'I’ll fix the CORS issue',
      lastActive: '25 Jan',
      unread: false,
    },
    {
      id: 5,
      name: 'Ava Stone',
      avatar:
        'https://i.pinimg.com/736x/24/89/5a/24895a8f76e0bbbd1c94bfc7db4a7a10.jpg',
      lastMessage: 'Can we add dark mode?',
      lastActive: '24 Jan',
      unread: true,
    },
    {
      id: 6,
      name: 'Ryan Brooks',
      avatar:
        'https://i.pinimg.com/736x/9c/68/3f/9c683f6e40a9cfdfc8c60f6c30f3b2c3.jpg',
      lastMessage: 'WebSocket is live 🔥',
      lastActive: '23 Jan',
      unread: false,
    },
    {
      id: 7,
      name: 'Maya Patel',
      avatar:
        'https://i.pinimg.com/736x/61/9f/8c/619f8c7f5d8b9e6d7e0c9a7d4f2b1c33.jpg',
      lastMessage: 'Animations feel smooth now',
      lastActive: '22 Jan',
      unread: false,
    },
    {
      id: 8,
      name: 'Ethan Wong',
      avatar:
        'https://i.pinimg.com/736x/44/ab/12/44ab12d1d9d5d0a67f6c6bfc7f123456.jpg',
      lastMessage: 'Deploying to Vercel rn',
      lastActive: '21 Jan',
      unread: true,
    },
    {
      id: 9,
      name: 'Sophia Ray',
      avatar:
        'https://i.pinimg.com/736x/8e/23/45/8e2345e1a9d6f2b7c4d9a1f123abcd.jpg',
      lastMessage: 'That gradient is perfect 💜',
      lastActive: '20 Jan',
      unread: false,
    },
    {
      id: 10,
      name: 'Chris Nolan',
      avatar:
        'https://i.pinimg.com/736x/3d/91/77/3d9177d4e8c9b1f0e4c2a8d9f7654321.jpg',
      lastMessage: 'We’re almost production-ready',
      lastActive: '19 Jan',
      unread: true,
    },
  ];

  const navigate = useNavigate();
  return (
    <div className="row w-100 h-100 p-0 m-0">
      {/* Chat List Sidebar */}
      <div className="col-4 chat-list p-0">
        <div className="chat-header">
          <div className="d-flex align-items-center p-3">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="chat-toggle-icon"
              onClick={() => navigate('/feed')}
            />
            <h1 className="chat-title">Chat</h1>
          </div>
          
          <div className="chat-search-box">
            <input type="text" placeholder="Search conversations..." />
            <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
          </div>
        </div>

        {chatList.map((chat) => (
          <div className="chat-list-item" key={chat.id}>
            <img src={chat.avatar} alt="profile-pic" className="clt-prof-pic" />
            
            <div className="clt-details-card">
              <div className="clt-details">
                <p className="clt-username m-0">{chat.name}</p>
                <p className="clt-datetime m-0">{chat.lastActive}</p>
              </div>
              <p className="clt-recents m-0">{chat.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div className="col-8 chat-box p-0">
        <header className="ch-user">
          <div className="p-2">
            <img
              src="https://i.pinimg.com/736x/fe/57/11/fe571153716bc8c7c319cf62bfa69a1d.jpg"
              alt="pro-pic"
              className="ch-user-prof-pic"
            />
          </div>
          
          <div className="d-flex justify-content-between w-100 p-2">
            <div>
              <h1 className="ch-username p-0 m-0">User Name</h1>
              <p className="ch-active p-0 m-0">Active now</p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div>Icon</div>
              <div>Icon</div>
              <div>Icon</div>
            </div>
          </div>
        </header>

        {/* Chat Area - Empty State */}
        <div className="ch-messages-area">
          {/* Messages would go here */}
        </div>

        {/* Chat Input Footer */}
        <footer className="ch-chatarea">
          <div className="ch-input">
            <div className="ch-mic-and-input d-flex gap-2">
              <div className="ch-mic">
                <FontAwesomeIcon icon={faMicrophone} />
              </div>
              <input
                type="text"
                placeholder="Text your message"
                className="ch-input-field"
              />
            </div>
            
            <div className="ch-file-and-emoji d-flex">
              <div className="ch-file">
                <FontAwesomeIcon icon={faPaperclip} />
              </div>
              <div className="ch-emoji">
                <FontAwesomeIcon icon={faFaceSmile} />
              </div>
            </div>
          </div>
          
          <div className="ch-send">
            <div className="ch-paperPlane">
              <FontAwesomeIcon icon={faPaperPlane} className="p-0 m-0" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Chat;