import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, File, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function FileUpload({ onExtracted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onExtracted(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to extract data');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '200px', 
        cursor: 'pointer', 
        borderColor: dragActive ? 'var(--accent-color)' : 'var(--panel-border)',
        backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(15, 23, 42, 0.4)',
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderRadius: '12px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}
      className={loading ? 'opacity-50' : ''}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFile(e.target.files[0])} 
        accept=".jpg,.jpeg,.png,.pdf" 
        style={{ display: 'none' }} 
      />
      
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-accent" size={48} />
          <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Extracting data with AI...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%', marginBottom: '8px' }}>
            <UploadCloud size={40} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <p style={{color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '500'}}>Drag and drop your receipt or statement here</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Supports JPG, PNG, and PDF</p>
          <button className="secondary mt-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse Files</button>
        </div>
      )}
      
      {error && <div className="text-danger mt-4 text-center w-full p-3" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.9rem'}}>{error}</div>}
    </div>
  );
}
