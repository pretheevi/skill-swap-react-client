import { Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faBell, faMessage } from '@fortawesome/free-regular-svg-icons';

import Feed from "../feed";
import { FeedContext, feedReducer, initialState } from '../../context/FeedContext';
import { useReducer } from "react";
import './feedLayout.css';

function FeedLayout({ setCreatePost }) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(feedReducer, initialState);

  return (
    <>
      <FeedContext.Provider value={{ state, dispatch }}>
        <header className="main-header d-flex d-lg-flex">
          <div className="main-header-logo d-flex d-lg-none">
            <img src="/logo.png" alt="logo-image" />
          </div>

          <div className="da-actions d-flex justify-content-center align-items-center gap-2 ms-auto">
            <FontAwesomeIcon icon={faBell} className="main-header-bell-icon" />

            <div onClick={() => navigate("/feed/chat")}>
              <FontAwesomeIcon icon={faMessage} className="main-header-message-icon" />
            </div>

            <button
              className="bttn d-flex justify-content-center align-items-center gap-2"
              onClick={() => setCreatePost(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="main-header-plus-icon" />
              <span>Create Post</span>
            </button>
          </div>
        </header>
        <main className="uid main-feed-card">
          <Feed />
          <Outlet />
        </main>
      </FeedContext.Provider>
    </>
  );
}

export default FeedLayout;
