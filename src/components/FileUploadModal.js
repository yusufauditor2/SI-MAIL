import React, { useState, useRef } from 'react';
import { 
  FiUpload, 
  FiX, 
  FiCheck, 
  FiAlertCircle,
  FiTrash2
} from 'react-icons/fi';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../constants/collections';
import { cloudinaryService } from '../services/cloudinaryService';

const FileUploadModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  auditId, 
  type = 'document', // 'workPaper', 'evidence', 'interview', 'note', 'document'
  title = 'Upload File'
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Kertas Kerja',
    tags: ''
  });

  const categories = [
    'Kertas Kerja',
    'Bukti Audit', 
    'Laporan',
    'Template',
    'Regulasi'
  ];

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map(file => ({
      file,
      id: Date.now() + Math.random(),
      status: 'pending',
      error: null
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setErrors([]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.title.trim()) {
      newErrors.push('Judul harus diisi');
    }
    
    if (files.length === 0) {
      newErrors.push('Pilih file untuk diupload');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const uploadFiles = async () => {
    if (!validateForm()) return;
    
    if (!auditId) {
      setErrors(['Audit ID tidak ditemukan']);
      return;
    }
    
    setUploading(true);
    const newProgress = {};
    
    try {
      for (const fileItem of files) {
        if (fileItem.status === 'pending') {
          newProgress[fileItem.id] = 0;
          setUploadProgress({ ...newProgress });
          
          try {
            // Validate file menggunakan Cloudinary service
            cloudinaryService.validateFile(fileItem.file);
            
            // Prepare metadata
            const metadata = {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
              uploadedBy: 'current-user' // This should come from auth context
            };
            
            // Upload based on type using specialized cloudinary service methods
            let uploadResult;
            switch (type) {
              case 'workPaper':
                uploadResult = await cloudinaryService.uploadWorkPaper(auditId, fileItem.file, metadata);
                break;
              case 'evidence':
                uploadResult = await cloudinaryService.uploadEvidence(auditId, fileItem.file, metadata);
                break;
              case 'interview':
                uploadResult = await cloudinaryService.uploadInterviewRecording(auditId, fileItem.file, metadata);
                break;
              case 'note':
                uploadResult = await cloudinaryService.uploadNoteAttachment(auditId, fileItem.file, metadata);
                break;
              case 'document':
              default:
                // For generic documents, use the original method
                const cloudinaryResult = await cloudinaryService.uploadDocument(fileItem.file);
                const documentData = {
                  fileName: fileItem.file.name,
                  fileSize: fileItem.file.size,
                  fileType: fileItem.file.type,
                  fileUrl: cloudinaryResult.secure_url,
                  publicId: cloudinaryResult.public_id,
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                  uploadedBy: 'current-user',
                  uploadDate: serverTimestamp(),
                  auditId: auditId || null
                };
                const docRef = await addDoc(collection(db, COLLECTIONS.DOCUMENTS), documentData);
                uploadResult = { ...cloudinaryResult, docId: docRef.id };
                break;
            }
            
            // Update file status
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id 
                ? { ...f, status: 'success', result: uploadResult }
                : f
            ));
            
            newProgress[fileItem.id] = 100;
            setUploadProgress({ ...newProgress });
            
          } catch (error) {
            console.error('Upload error:', error);
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id 
                ? { ...f, status: 'error', error: error.message }
                : f
            ));
          }
        }
      }
      
      // Check if any uploads were successful
      const hasSuccessful = files.some(f => f.status === 'success');
      if (hasSuccessful) {
        onSuccess && onSuccess();
        setTimeout(() => {
          onClose();
        }, 500);
      }
      
    } catch (error) {
      console.error('Upload process error:', error);
      setErrors([error.message]);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file) => {
    return cloudinaryService.getFileIcon(file.type);
  };

  const formatFileSize = (bytes) => {
    return cloudinaryService.formatFileSize(bytes);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content file-upload-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Form Fields */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Judul</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul dokumen"
                />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Masukkan deskripsi dokumen"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Masukkan tags (pisahkan dengan koma)"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div className="upload-section">
            <div
              ref={dropZoneRef}
              className="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload size={48} />
              <h3>Drag & Drop file di sini</h3>
              <p>atau klik untuk memilih file</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="file-list">
              <h4>File yang akan diupload:</h4>
              {files.map((fileItem) => (
                <div key={fileItem.id} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">{getFileIcon(fileItem.file)}</span>
                    <div className="file-details">
                      <div className="file-name">{fileItem.file.name}</div>
                      <div className="file-size">{formatFileSize(fileItem.file.size)}</div>
                    </div>
                  </div>
                  
                  <div className="file-status">
                    {fileItem.status === 'pending' && (
                      <span className="status pending">Menunggu</span>
                    )}
                    {fileItem.status === 'success' && (
                      <span className="status success">
                        <FiCheck /> Berhasil
                      </span>
                    )}
                    {fileItem.status === 'error' && (
                      <span className="status error">
                        <FiAlertCircle /> Error
                      </span>
                    )}
                    
                    {uploadProgress[fileItem.id] !== undefined && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${uploadProgress[fileItem.id]}%` }}
                        ></div>
                      </div>
                    )}
                    
                    <button
                      className="remove-file"
                      onClick={() => removeFile(fileItem.id)}
                      disabled={uploading}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  
                  {fileItem.error && (
                    <div className="file-error">{fileItem.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <div key={index} className="error-message">
                  <FiAlertCircle />
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={uploading}
          >
            Batal
          </button>
          <button 
            className="btn-primary" 
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Mengupload...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
