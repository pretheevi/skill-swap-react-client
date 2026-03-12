import { useReducer, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faCamera,
  faCheck,
  faSpinner,
  faUser,
  faEnvelope,
  faAlignLeft,
} from '@fortawesome/free-solid-svg-icons';
import './editProfile.css';
import API from '../api/api';

const initialState = {
  name: '',
  email: '',
  bio: '',
  avatarPreview: null,
  avatarFile: null,
  avatarRemoved: false,   
  loading: false,
  saved: false,
  errors: {},
  original: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        saved: false,
        errors: { ...state.errors, [action.field]: null },
      };
    case 'SET_AVATAR':
      return { ...state, avatarPreview: action.preview, avatarFile: action.file, saved: false };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_SAVED':
      return { ...state, saved: true, loading: false };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors, loading: false };
    case 'INIT':
      return {
        ...state,
        ...action.payload,
        original: action.payload,
      };
    case 'REMOVE_AVATAR':
      return { 
        ...state, 
        avatarPreview: null, 
        avatarFile: null, 
        avatarRemoved: true, 
        saved: false
      };
    default:
      return state;
  }
}

function validate(state) {
  const errors = {};
  if (!state.name.trim()) errors.name = 'Name is required';
  else if (state.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!state.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errors.email = 'Invalid email address';
  if (state.bio.length > 160) errors.bio = 'Bio must be 160 characters or less';
  return errors;
}

function EditProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const fileRef = useRef();

  // replace isDirty
  const isDirty = state.original && (
    state.name  !== state.original.name  ||
    state.email !== state.original.email ||
    state.bio   !== state.original.bio   ||
    state.avatarFile !== null     ||
    state.avatarRemoved === true
  );

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    dispatch({ type: 'SET_AVATAR', preview, file });
  };

const handleSubmit = async () => {
  const errors = validate(state);
  if (Object.keys(errors).length) {
    dispatch({ type: 'SET_ERRORS', errors });
    return;
  }
  dispatch({ type: 'SET_LOADING', value: true });

  try {
    const formData = new FormData();
    formData.append('name', state.name);
    formData.append('bio', state.bio);

    if (state.avatarFile) {
      // new image selected — backend will delete old from cloudinary automatically
      formData.append('profilePic', state.avatarFile);
    } else if (state.avatarRemoved) {
      // user explicitly removed avatar
      formData.append('remove_avatar', 'true');
    }

    const response = await API.post('/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    dispatch({ type: 'SET_SAVED' });
    // update avatar preview with the new cloudinary URL
    if (response.data.user.avatar) {
      dispatch({ type: 'SET_AVATAR', preview: response.data.user.avatar, file: null });
    }
  } catch (err) {
    console.error('Failed to update profile', err);
    dispatch({
      type: 'SET_ERRORS',
      errors: { name: err?.response?.data?.message || 'Failed to save. Try again.' },
    });
  }
};

  // fetch on mount
  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      dispatch({ type: 'SET_LOADING', value: true });
      try {
        const response = await API(`/profileById/${id}`);
        const data = response.data;
        console.log(data)
        dispatch({
          type: 'INIT',
          payload: {
            name:  data.name  || '',
            email: data.email || '',
            bio:   data.bio   || '',
            avatarPreview: data.avatar || null,
            loading: false,
          },
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
        dispatch({ type: 'SET_LOADING', value: false });
      }
    };
    fetchProfile();
  }, [id]);

  return (
    <div className="ep-wrapper">

      {/* Header */}
      <div className="ep-header">
        <button className="ep-back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h1 className="ep-title">Edit Profile</h1>
        <button
          className={`ep-save-btn ${isDirty ? 'active' : ''}`}
          onClick={handleSubmit}
          disabled={!isDirty || state.loading}
        >
          {state.loading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : state.saved ? (
            <FontAwesomeIcon icon={faCheck} />
          ) : (
            'Save'
          )}
        </button>
      </div>

      <div className="ep-content">

        {/* Avatar */}
        <div className="ep-avatar-section">
          <div className="ep-avatar-wrap" onClick={() => fileRef.current.click()}>
            {state.avatarPreview ? (
              <img src={state.avatarPreview} className="ep-avatar" alt="avatar preview" />
            ) : (
              <div className="ep-avatar-placeholder">
                <FontAwesomeIcon icon={faUser} />
              </div>
            )}
            <div className="ep-avatar-overlay">
              <FontAwesomeIcon icon={faCamera} />
            </div>
          </div>
          <p className="ep-avatar-hint">Tap to change photo</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />

          {/* show remove only if avatar exists */}
          {state.avatarPreview && (
            <button
              className="ep-remove-avatar-btn"
              onClick={() => dispatch({ type: 'REMOVE_AVATAR' })}
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Form */}
        <div className="ep-form" data-lpignore="true" data-form-type="other">

          <div className={`ep-field ${state.errors.name ? 'error' : ''}`}>
            <label className="ep-label">
              <FontAwesomeIcon icon={faUser} className="ep-label-icon" />
              Name
            </label>
            <input
              className="ep-input"
              type="text"
              placeholder="Your display name"
              value={state.name}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
              maxLength={60}
            />
            {state.errors.name && <p className="ep-error">{state.errors.name}</p>}
          </div>

          <div className={`ep-field ${state.errors.email ? 'error' : ''}`}>
            <label className="ep-label">
              <FontAwesomeIcon icon={faEnvelope} className="ep-label-icon" />
              Email
            </label>
            <input
              className="ep-input"
              type="email"
              placeholder="your@email.com"
              value={state.email}
              disabled
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
            />
            {state.errors.email && <p className="ep-error">{state.errors.email}</p>}
          </div>

          <div className={`ep-field ${state.errors.bio ? 'error' : ''}`}>
            <label className="ep-label">
              <FontAwesomeIcon icon={faAlignLeft} className="ep-label-icon" />
              Bio
              <span className="ep-char-count">{state.bio.length}/160</span>
            </label>
            <textarea
              className="ep-textarea"
              placeholder="Tell people a little about yourself…"
              value={state.bio}
              rows={4}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'bio', value: e.target.value })}
              maxLength={160}
            />
            {state.errors.bio && <p className="ep-error">{state.errors.bio}</p>}
          </div>

        </div>

        {/* Success */}
        {state.saved && (
          <div className="ep-success">
            <FontAwesomeIcon icon={faCheck} />
            Profile updated successfully
          </div>
        )}

      </div>
    </div>
  );
}

export default EditProfile;