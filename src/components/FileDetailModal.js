import React from 'react';
import { FiX, FiDownload, FiFile, FiCalendar, FiUser, FiEye } from 'react-icons/fi';
import './FileDetailModal.css';

const FileDetailModal = ({ isOpen, onClose, file, fileType }) => {
  if (!isOpen || !file) return null;

  const formatDate = (date) => {
    if (!date) return '';
    
    let d;
    if (date.toDate) {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const downloadUrl = file.cloudinaryUrl || file.fileUrl || file.downloadUrl || file.recordingUrl;
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.fileName || file.recordingFileName || file.title || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('URL download tidak tersedia');
    }
  };

  const handleViewFile = () => {
    const fileUrl = file.cloudinaryUrl || file.fileUrl || file.downloadUrl || file.recordingUrl;
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert('URL file tidak tersedia');
    }
  };

  const getTypeLabel = () => {
    switch (fileType) {
      case 'workPaper': return 'Kertas Kerja';
      case 'evidence': return 'Bukti Audit';
      case 'note': return 'Catatan';
      case 'interview': return 'Wawancara';
      default: return 'Dokumen';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detail {getTypeLabel()}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Title/Name */}
          <div className="detail-section">
            <h3>Judul</h3>
            <p className="detail-value">{file.title || file.fileName || file.recordingFileName || 'Tanpa judul'}</p>
          </div>

          {/* Description */}
          {file.description && (
            <div className="detail-section">
              <h3>Deskripsi</h3>
              <p className="detail-value">{file.description}</p>
            </div>
          )}

          {/* Category */}
          {file.category && (
            <div className="detail-section">
              <h3>Kategori</h3>
              <p className="detail-value">{file.category}</p>
            </div>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="detail-section">
              <h3>Tags</h3>
              <div className="tags-container">
                {file.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="detail-section">
            <h3>Informasi File</h3>
            <div className="info-grid">
              <div className="info-item">
                <FiFile />
                <div>
                  <div className="info-label">Nama File</div>
                  <div className="info-value">{file.fileName || file.recordingFileName || '-'}</div>
                </div>
              </div>
              <div className="info-item">
                <FiFile />
                <div>
                  <div className="info-label">Ukuran</div>
                  <div className="info-value">{formatFileSize(file.fileSize || file.recordingSize)}</div>
                </div>
              </div>
              <div className="info-item">
                <FiCalendar />
                <div>
                  <div className="info-label">Tanggal Upload</div>
                  <div className="info-value">{formatDate(file.uploadedAt || file.createdAt)}</div>
                </div>
              </div>
              <div className="info-item">
                <FiUser />
                <div>
                  <div className="info-label">Diupload oleh</div>
                  <div className="info-value">{file.uploadedBy || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button className="btn-secondary" onClick={handleDownload}>
            <FiDownload />
            Download File
          </button>
          <button className="btn-primary" onClick={handleViewFile}>
            <FiEye />
            Lihat File
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;

