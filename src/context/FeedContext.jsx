import { createContext } from "react";

export const FeedContext = createContext(null);

export const initialState = {
  feed: [],
  loading: false,
  hasMore: true,
  heartBeatId: null,
}

export const feedReducer = (state, action) => {
  switch (action.type) {
    case "SET_FEED":
      return {...state, feed: action.payload };

    case "APPEND_FEED":
      const existingIds = new Set(state.feed.map(s => s.skill_id));
      const unique = action.payload.filter(s => !existingIds.has(s.skill_id));
      return { ...state, feed: [...state.feed, ...unique] };

    case "TOGGLE_LIKE":
      return {
        ...state,
        feed: state.feed.map(skill => 
          skill.skill_id === action.payload.skill_id
            ? { ...skill, like_count: action.payload.likeCount, user_liked: action.payload.liked }
            : skill
        )
      }

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_HAS_MORE":
      return { ...state, hasMore: action.payload };

    case "SET_HEARTBEAT":
      return { ...state, heartBeatId: action.payload };

    default:
      return state;

  }
};

