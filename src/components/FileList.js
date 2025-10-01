import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiDownload, 
  FiTrash2, 
  FiEye, 
  FiFile, 
  FiImage, 
  FiVideo, 
  FiMusic,
  FiFileText,
  FiArchive
} from 'react-icons/fi';
import { cloudinaryService } from '../services/cloudinaryService';
import FileDetailModal from './FileDetailModal';

const FileList = ({ auditId, fileType, onFileDeleted }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[FileList] Loading files for auditId: ${auditId}, fileType: ${fileType}`);
      
      const auditFiles = await cloudinaryService.getAuditFiles(auditId);
      console.log(`[FileList] All audit files:`, auditFiles);
      
      // Filter files berdasarkan type
      let filteredFiles = [];
      switch (fileType) {
        case 'workPaper':
          filteredFiles = auditFiles.workPapers || [];
          break;
        case 'evidence':
          filteredFiles = auditFiles.evidence || [];
          break;
        case 'interview':
          filteredFiles = auditFiles.interviews || [];
          break;
        case 'note':
          filteredFiles = auditFiles.notes || [];
          break;
        default:
          filteredFiles = [];
      }
      
      console.log(`[FileList] Filtered files for ${fileType}:`, filteredFiles);
      
      // Sort files by upload date (newest first)
      filteredFiles.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || a.uploadedAt || a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || b.uploadedAt || b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return dateB - dateA;
      });
      
      console.log(`[FileList] Final sorted files (${filteredFiles.length}):`, filteredFiles);
      setFiles(filteredFiles);
    } catch (error) {
      console.error('[FileList] Error loading files:', error);
      setError('Gagal memuat daftar file');
    } finally {
      setLoading(false);
    }
  }, [auditId, fileType]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDownload = async (file) => {
    try {
      const downloadUrl = file.cloudinaryUrl || file.fileUrl || file.downloadUrl || file.recordingUrl;
      if (downloadUrl) {
        // Create a temporary link and trigger download
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
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Gagal mengunduh file');
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus file ini?')) {
      try {
        console.log('[FileList] Deleting file:', fileId);
        await cloudinaryService.deleteFile(auditId, fileType, fileId);
        setFiles(prev => prev.filter(f => f.id !== fileId));
        onFileDeleted && onFileDeleted();
        alert('File berhasil dihapus');
      } catch (error) {
        console.error('[FileList] Error deleting file:', error);
        alert('Gagal menghapus file: ' + error.message);
      }
    }
  };

  const handleViewDetail = (file) => {
    setSelectedFile(file);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedFile(null);
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FiFile />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FiFileText />;
    if (type.includes('image') || type.includes('jpeg') || type.includes('jpg') || type.includes('png') || type.includes('gif')) return <FiImage />;
    if (type.includes('video') || type.includes('mp4') || type.includes('avi') || type.includes('mov')) return <FiVideo />;
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav') || type.includes('m4a')) return <FiMusic />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <FiArchive />;
    if (type.includes('word') || type.includes('doc')) return <FiFileText />;
    if (type.includes('excel') || type.includes('xls')) return <FiFileText />;
    return <FiFile />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Handle Firestore Timestamp
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="file-list-loading">
        <div className="loading-spinner"></div>
        <p>Memuat daftar file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list-error">
        <p>{error}</p>
        <button onClick={loadFiles} className="btn-secondary">
          Coba Lagi
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <FiFile size={48} />
        <h4>Belum ada file</h4>
        <p>Upload file pertama untuk memulai</p>
      </div>
    );
  }

  return (
    <>
      <div className="file-list">
        {files.map((file) => (
          <div key={file.id} className="file-item">
            <div className="file-info">
              <div className="file-icon">
                {getFileIcon(file.fileType || file.recordingType || file.type)}
              </div>
              <div className="file-details">
                <div className="file-name">
                  {file.title || file.fileName || file.recordingFileName || 'File tanpa nama'}
                </div>
                <div className="file-meta">
                  <span className="file-size">
                    {formatFileSize(file.fileSize || file.recordingSize || file.size)}
                  </span>
                  <span className="file-date">
                    {formatDate(file.uploadedAt || file.createdAt)}
                  </span>
                  {file.uploadedBy && (
                    <span className="file-uploader">
                      oleh {file.uploadedBy}
                    </span>
                  )}
                </div>
                {file.description && (
                  <div className="file-description">{file.description}</div>
                )}
              </div>
            </div>
            
            <div className="file-actions">
              <button 
                className="action-btn view"
                onClick={() => handleViewDetail(file)}
                title="Lihat detail"
              >
                <FiEye />
              </button>
              <button 
                className="action-btn download"
                onClick={() => handleDownload(file)}
                title="Download file"
              >
                <FiDownload />
              </button>
              <button 
                className="action-btn delete"
                onClick={() => handleDelete(file.id)}
                title="Hapus file"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      <FileDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        file={selectedFile}
        fileType={fileType}
      />
    </>
  );
};

export default FileList;
