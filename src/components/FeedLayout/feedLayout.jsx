import { useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faBell, faMessage } from '@fortawesome/free-regular-svg-icons';

import Feed from "../feed";

function FeedLayout({ setCreatePost }) {
  const navigate = useNavigate();

  return (
    <>
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
            className="main-header-create-post-btn d-flex justify-content-center align-items-center gap-2"
            onClick={() => setCreatePost(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="main-header-plus-icon" />
            <span>Create Post</span>
          </button>
        </div>
      </header>

      <main className="uid main-feed-card">
        <Feed />
      </main>

      <Outlet />
    </>
  );
}

export default FeedLayout;