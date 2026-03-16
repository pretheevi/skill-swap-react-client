export const initialState = {
  rooms: [],
  selectedRoom: null,
  roomConversation: [],
  onlineUsers: new Set(),
  newMessage: '',
  showList: true,
  offset: 0,
  hasMore: true,
  shouldScrollBottom: false,
  typingUserId: null,
  selectedMessageIndex: null,
};


export const chatReducer = (state, action) => {
  switch (action.type) {
    case "SET_NEW_MESSAGE":
      return { ...state, newMessage: action.payload }

    case "SET_ROOMS":
      return { ...state, rooms: action.payload }
    
    case 'SET_SELECTED_ROOM':
      const isSameRoom = state.selectedRoom?.room_id === action.payload?.room_id;
      return { 
        ...state, 
        selectedRoom: action.payload, 
        roomConversation: isSameRoom ? state.roomConversation : [],  // ✅ keep if same room
        offset: isSameRoom ? state.offset : 0,
        hasMore: isSameRoom ? state.hasMore : true,
        showList: false 
      };

    case 'SET_ROOM_CONVERSATION':
      return { ...state, roomConversation: action.payload, shouldScrollBottom: true };

    case 'APPEND_MESSAGE':
      return { ...state, roomConversation: [...state.roomConversation, action.payload], shouldScrollBottom: action.payload.scrollDown };
    
    case 'PREPEND_MESSAGES':
      return { ...state, roomConversation: [...action.payload, ...state.roomConversation], shouldScrollBottom: false };

    case 'SET_OFFSET':
      return { ...state, offset: action.payload };

    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };

    case 'SET_SHOW_LIST':
      return { ...state, showList: action.payload };
  
    case 'USER_ONLINE':
      return {
        ...state,
        onlineUsers: new Set([...state.onlineUsers, String(action.payload)])
      };

    case 'USER_OFFLINE': {
      const updated = new Set(state.onlineUsers);
      updated.delete(String(action.payload));
      return { ...state, onlineUsers: updated };
    }

    case 'SET_TYPING':
      return { ...state, typingUserId: action.payload };

    case 'MARK_ROOM_READ':
      return {
        ...state,
        rooms: state.rooms.map(r => 
          r.room_id === action.payload ? { ...r, unread_count: 0 } : r
        )
      };

    case 'INCREMENT_UNREAD':
      return {
        ...state,
        rooms: state.rooms.map(r =>
          r.room_id === action.payload 
            ? { ...r, unread_count: (r.unread_count || 0) + 1 } 
            : r
        )
      };

    case 'SET_SELECTED_MESSAGE':
      // toggle off if double clicked again
      return { 
        ...state, 
        selectedMessageIndex: state.selectedMessageIndex === action.payload ? null : action.payload 
      };

    case 'DELETE_MESSAGE_BY_ID':
      return {
        ...state,
        roomConversation: state.roomConversation.filter(m => m.id !== action.payload),
        selectedMessageIndex: null
      };
  }
};


