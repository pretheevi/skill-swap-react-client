import { useContext, useEffect, useState } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faTrash,
  faFloppyDisk,
} from '@fortawesome/free-solid-svg-icons';
import { faMessage } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';
import { AuthContext } from "../../context/AuthContext"
import { useNavigate, useParams } from "react-router-dom";
import AppLoader from '../AppLoader/AppLoader';
import API from '../api/api';
import './editSkill.css';

function EditSkill() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const { skill_id } = useParams();

  const [post, setPost] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty = post && description !== post.description;

  // ── fetch ──────────────────────────────────────────────
  const getPostDetail = async () => {
    try {
      setPostLoading(true);
      const response = await API.get(`/skills/${skill_id}`);
      setPost(response.data);
      setDescription(response.data.description || '');
    } catch (error) {
      toast.error('Failed to load post');
    } finally {
      setPostLoading(false);
    }
  };

  useEffect(() => { getPostDetail(); }, [skill_id]);

  // ── save description ───────────────────────────────────
  const handleSave = async () => {
    if (!isDirty) return;
    try {
      setSaving(true);
      await API.patch(`/skills/${skill_id}`, { description });
      setPost(prev => ({ ...prev, description }));
      toast.success('Description updated');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // ── delete post ────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true); // first click: show confirmation
      return;
    }
    try {
      setDeleting(true);
      await API.delete(`/skills/${skill_id}`);
      setUser(prev => ({...prev, posts_count: prev.posts_count - 1}))
      toast.success('Post deleted');
      navigate(`/feed/profile/${post.user_id}`);
    } catch (error) {
      toast.error('Failed to delete post');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!post || postLoading) return (
    <div className="row edt-wrapper">
      <AppLoader />
    </div>
  );

  return (
    <div className="row edt-wrapper">
      <div className="col-12 p-0">

        {/* ── media ── */}
        <main className="viw-media">
          <div className="viw-action-btn">
            <button className="viw-back-btn" onClick={() => navigate(-1)}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>

          <div
            id={`viw-carousel-${post.id}`}
            className="carousel slide viw-carousel"
            data-bs-ride="false"
          >
            {post.media?.length > 1 && (
              <div className="carousel-indicators">
                {post.media.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    data-bs-target={`#viw-carousel-${post.id}`}
                    data-bs-slide-to={index}
                    className={index === 0 ? 'active' : ''}
                    aria-current={index === 0 ? 'true' : undefined}
                  />
                ))}
              </div>
            )}

            <div className="carousel-inner">
              {post.media?.map((item, index) => (
                <div key={item.media_id} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                  <div className="viw-media-images">
                    {item.media_type === 'image'
                      ? <img src={item.media_url} alt="" />
                      : <video src={item.media_url} controls />
                    }
                  </div>
                </div>
              ))}
            </div>

            {post.media?.length > 1 && (
              <>
                <button className="carousel-control-prev" type="button"
                  data-bs-target={`#viw-carousel-${post.id}`} data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" />
                </button>
                <button className="carousel-control-next" type="button"
                  data-bs-target={`#viw-carousel-${post.id}`} data-bs-slide="next">
                  <span className="carousel-control-next-icon" />
                </button>
              </>
            )}
          </div>
        </main>

        {/* ── footer ── */}
        <footer className="viw-footer">

          {/* action row */}
          <div className="edt-action-row">
            <div className="edt-meta">
              <FontAwesomeIcon icon={faMessage} />
              <span>{post?.comment_count || 0}</span>
            </div>

            <div className="edt-btns">
              {/* delete */}
              <button
                className={`edt-btn edt-delete-btn ${confirmDelete ? 'confirm' : ''}`}
                onClick={handleDelete}
                disabled={deleting}
                title={confirmDelete ? 'Click again to confirm' : 'Delete post'}
              >
                {deleting
                  ? <span className="edt-spinner" />
                  : <FontAwesomeIcon icon={faTrash} />
                }
                <span>{confirmDelete ? 'Confirm?' : 'Delete'}</span>
              </button>

              {/* save */}
              <button
                className={`edt-btn edt-save-btn ${isDirty ? 'active' : ''}`}
                onClick={handleSave}
                disabled={!isDirty || saving}
                title="Save description"
              >
                {saving
                  ? <span className="edt-spinner" />
                  : <FontAwesomeIcon icon={faFloppyDisk} />
                }
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* description editor */}
          <div className="edt-description">
            <textarea
              className="edt-textarea"
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                setConfirmDelete(false); // cancel delete confirm if user starts typing
              }}
              placeholder="Write a description..."
              rows={4}
            />
            {isDirty && (
              <p className="edt-unsaved-hint">Unsaved changes</p>
            )}
          </div>

        </footer>
      </div>
    </div>
  );
}

export default EditSkill;