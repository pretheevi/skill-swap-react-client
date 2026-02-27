import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import API from '../api/api';
import { toast } from 'react-toastify';
import './post.css';

function Post(props) {
  // State declarations
  const [postnav, setPostNav] = useState({
    ratio: false,
    images: false,
    description: false,
    result: false,
  });

  const [form, setForm] = useState({
    imageRatio: '',
    images: [],
    description: '',
  });

  const [imagePreview, setImagePreview] = useState([]);

  // Navigation handlers
  const handlePostNavigation = (name) => {
    if (name.length === 0) return;
    
    setPostNav({
      ratio: false,
      images: false,
      description: false,
      result: false,
      [name]: true,
    });
  };

  const handleImageRatio = (value) => {
    console.log(value);
    setForm((prev) => ({ ...prev, imageRatio: value }));
    handlePostNavigation('images');
  };

  // Image validation
  const checkRatio = (width, height, ratio) => {
    if (ratio === '1:1') return width <= height;
    if (ratio === '2:3') return width < height;
    return false;
  };

  // File handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = [];
    const previews = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const isValid = checkRatio(img.width, img.height, form.imageRatio);

        if (!isValid) {
          alert(`Image must be ${form.imageRatio}`);
          URL.revokeObjectURL(img.src);
          return;
        }

        validFiles.push(file);
        previews.push(img.src);

        setForm((prev) => ({
          ...prev,
          images: [...prev.images, file],
        }));

        setImagePreview((prev) => [...prev, img.src]);
      };
    });
  };

  const removeImage = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Description handlers
  const handleDescriptionChange = (e) => {
    const { name, value } = e.target;
    if (value.length <= 1000) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getCharacterCount = (text) => {
    if (!text) return 0;
    return text.length;
  };

  const getRemainingCharacters = (text) => {
    return 1000 - getCharacterCount(text);
  };

  // Submit handler
  const handlePostShare = async () => {
    try {
      const formData = new FormData();
      formData.append('imageRatio', form.imageRatio);
      formData.append('description', form.description);

      for (const file of form.images) {
        formData.append('media', file);
      }
      
      console.log(formData);
      
      const response = await API.post('/skills', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(response.data);
      toast.success(response.data.message);
      props.setCreatePost(false);
    } catch (error) {
      console.log(error);
      toast.error('Failed to share post');
    }
  };

  // Effects
  useEffect(() => {
    handlePostNavigation('ratio');
  }, []);

  return (
    <div className="pst-container">
      {/* Ratio Selection Step */}
      {postnav.ratio && (
        <div className="pst-ratio-card">
          <button
            onClick={() => props.setCreatePost(false)}
            className="pst-ratio-btn remove-image-btn"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          
          <h4 className="pst-title">Choose Image Ratio</h4>
          
          <div className="pst-ratio-options d-flex justify-content-center align-items-center gap-2">
            <div
              className={`ratio-option ${form.imageRatio === '1:1' ? 'selected' : ''}`}
              onClick={() => handleImageRatio('1:1')}
            >
              <div className="ratio-box square">
                <span>1:1</span>
              </div>
              <p>Square</p>
            </div>
            
            <div
              className={`ratio-option ${form.imageRatio === '2:3' ? 'selected' : ''}`}
              onClick={() => handleImageRatio('2:3')}
            >
              <div className="ratio-box portrait">
                <span>2:3</span>
              </div>
              <p>Portrait</p>
            </div>
          </div>
          
          <p className="pst-subtitle m-0">Select an aspect ratio for your images</p>
        </div>
      )}

      {/* Image Upload Step */}
      {postnav.images && (
        <div className="pst-img-preview">
          <div className="pst-preview-header">
            <button
              className="pst-back-btn"
              onClick={() => {
                setForm((prev) => ({ ...prev, imageRatio: '' }));
                setImagePreview([]);
                handlePostNavigation('ratio');
              }}
            >
              ← Back
            </button>
            <span className="pst-ratio-badge">{form.imageRatio}</span>
          </div>

          <div id="carouselExample" className="carousel slide pst-carousel">
            {imagePreview.length > 0 ? (
              <>
                <div className="carousel-inner">
                  {imagePreview.map((imageUrl, index) => (
                    <div
                      key={imageUrl}
                      className={`carousel-item ${index === 0 ? 'active' : ''}`}
                    >
                      <div className="image-wrapper">
                        <img
                          src={imageUrl}
                          className="d-block pst-image"
                          alt="preview"
                        />
                        <button
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {imagePreview.length > 1 && (
                  <>
                    <button
                      className="carousel-control-prev"
                      type="button"
                      data-bs-target="#carouselExample"
                      data-bs-slide="prev"
                    >
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    
                    <button
                      className="carousel-control-next"
                      type="button"
                      data-bs-target="#carouselExample"
                      data-bs-slide="next"
                    >
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="pst-empty-state">
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <p>No images uploaded yet</p>
                </div>
              </div>
            )}
          </div>

          <div className="pst-img-preview-btn-card">
            <div className="pst-img-upload">
              <input
                type="file"
                id="upload-img"
                onChange={handleFileChange}
                multiple
                accept="image/*"
              />
              <label htmlFor="upload-img">
                {imagePreview.length > 0 ? 'Add More' : 'Upload Images'}
              </label>
            </div>

            {imagePreview.length > 0 && (
              <div className="pst-next-icon" onClick={() => handlePostNavigation('description')}>
                <FontAwesomeIcon icon={faArrowRight} />
              </div>
            )}
          </div>

          {imagePreview.length > 0 && (
            <div className="pst-counter">
              {imagePreview.length} image{imagePreview.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      {/* Description Step */}
      {postnav.description && (
        <div className="pst-description-container">
          <div className="pst-desc-header">
            <button className="pst-back-btn" onClick={() => handlePostNavigation('images')}>
              ← Back
            </button>
            <button
              className="pst-share"
              onClick={() => handlePostNavigation('result')}
              disabled={form.description.trim().length === 0}
            >
              Next
            </button>
          </div>

          <textarea
            name="description"
            id="description"
            placeholder="Write your description here..."
            value={form.description}
            onChange={handleDescriptionChange}
            maxLength={1000}
            className="pst-description"
          ></textarea>

          <div className="pst-char-count">
            <span className="char-count">{getCharacterCount(form.description)} / </span>
            <span className="char-remaining">
              {getRemainingCharacters(form.description)} characters remaining
            </span>
          </div>
        </div>
      )}

      {/* Preview & Share Step */}
      {postnav.result && (
        <div className="result-container">
          <div className="pst-preview-header">
            <button className="pst-back-btn" onClick={() => handlePostNavigation('description')}>
              ← Back
            </button>
            <button className="pst-ratio-badge" onClick={handlePostShare}>
              Share
            </button>
          </div>

          <div className="result-main">
            <div className="images-container">
              <div id="carouselExample" className="carousel slide pst-carousel">
                {imagePreview.length > 0 ? (
                  <>
                    <div className="carousel-inner">
                      {imagePreview.map((imageUrl, index) => (
                        <div
                          key={imageUrl}
                          className={`carousel-item ${index === 0 ? 'active' : ''}`}
                        >
                          <div className="image-wrapper">
                            <img src={imageUrl} className="d-block" alt="preview" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {imagePreview.length > 1 && (
                      <>
                        <button
                          className="carousel-control-prev"
                          type="button"
                          data-bs-target="#carouselExample"
                          data-bs-slide="prev"
                        >
                          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                          <span className="visually-hidden">Previous</span>
                        </button>
                        
                        <button
                          className="carousel-control-next"
                          type="button"
                          data-bs-target="#carouselExample"
                          data-bs-slide="next"
                        >
                          <span className="carousel-control-next-icon" aria-hidden="true"></span>
                          <span className="visually-hidden">Next</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="pst-empty-state">
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <p>No images uploaded yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="desc-container">
              <p className="pst-result-description">{form.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;