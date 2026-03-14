export const initialState = {
  rooms: [],
  selectedRoom: null,
  roomConversation: [],
  newMessage: '',
  showList: true,
  offset: 0,
  hasMore: true,
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
      return { ...state, roomConversation: action.payload };

    case 'APPEND_MESSAGE':
      return { ...state, roomConversation: [...state.roomConversation, action.payload] };
    
    case 'PREPEND_MESSAGES':
      return { ...state, roomConversation: [...action.payload, ...state.roomConversation] };

    case 'SET_OFFSET':
      return { ...state, offset: action.payload };

    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };

    case 'SET_SHOW_LIST':
      return { ...state, showList: action.payload };
  }
};


