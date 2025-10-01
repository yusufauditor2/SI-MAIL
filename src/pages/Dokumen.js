import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiSearch, 
  FiUpload, 
  FiEye, 
  FiDownload, 
  FiTrash2, 
  FiList, 
  FiGrid,
  FiFolder,
  FiFile,
  FiImage,
  FiFileText
} from 'react-icons/fi';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../constants/collections';
import { cloudinaryService } from '../services/cloudinaryService';
import FileUploadModal from '../components/FileUploadModal';
import './Dokumen.css';

const Dokumen = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [categoryStats, setCategoryStats] = useState({
    'Kertas Kerja': 0,
    'Bukti Audit': 0,
    'Laporan': 0,
    'Template': 0,
    'Regulasi': 0
  });

  // Document categories
  const categories = [
    { name: 'Kertas Kerja', color: 'blue', icon: FiFileText },
    { name: 'Bukti Audit', color: 'green', icon: FiImage },
    { name: 'Laporan', color: 'purple', icon: FiFile },
    { name: 'Template', color: 'yellow', icon: FiFileText },
    { name: 'Regulasi', color: 'red', icon: FiFile }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filterDocuments = useCallback(() => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        (d.fileName || '').toLowerCase().includes(q) ||
        (d.title || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q) ||
        (d.tags || []).some(tag => (tag || '').toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (selectedCategory !== 'Semua Kategori') {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedCategory]);

  useEffect(() => {
    filterDocuments();
  }, [filterDocuments]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const aggregated = [];

      // Load from audits subcollections (individual queries)
      try {
        console.log('Fetching audits...');
        const auditsQuery = query(collection(db, 'audits'));
        const auditsSnap = await getDocs(auditsQuery);
        
        for (const auditDoc of auditsSnap.docs) {
          const auditId = auditDoc.id;
          console.log(`Processing audit: ${auditId}`);
          
          // Get work papers from this audit
          try {
            const wpQuery = query(collection(db, 'audits', auditId, 'workPapers'));
            const wpSnap = await getDocs(wpQuery);
            wpSnap.forEach((d) => {
              const data = d.data();
              // Skip deleted documents
              if (data.isDeleted) return;
              
              aggregated.push({
                id: d.id,
                fileName: data.fileName || data.name || 'Tanpa Nama',
                fileSize: data.fileSize || 0,
                fileType: data.fileType || 'application/octet-stream',
                fileUrl: data.cloudinaryUrl || data.fileUrl,
                uploadedBy: data.uploadedBy || '-',
                uploadDate: data.uploadedAt || data.uploadDate || new Date(),
                category: 'Kertas Kerja',
                title: data.title || data.fileName || 'Tanpa Judul',
                description: data.description || '',
                tags: data.tags || [],
                auditId: auditId,
                cloudinaryId: data.cloudinaryId || data.cloudinaryPublicId || data.fileId,
                source: 'audit-workpaper',
                sourceType: 'workPaper'
              });
            });
          } catch (error) {
            console.log(`Error fetching work papers for audit ${auditId}:`, error.message);
          }
          
          // Get evidence from this audit
          try {
            const evQuery = query(collection(db, 'audits', auditId, 'evidence'));
            const evSnap = await getDocs(evQuery);
            evSnap.forEach((d) => {
              const data = d.data();
              // Skip deleted documents
              if (data.isDeleted) return;
              
              aggregated.push({
                id: d.id,
                fileName: data.fileName || data.name || 'Tanpa Nama',
                fileSize: data.fileSize || 0,
                fileType: data.fileType || 'application/octet-stream',
                fileUrl: data.cloudinaryUrl || data.fileUrl,
                uploadedBy: data.uploadedBy || '-',
                uploadDate: data.uploadedAt || data.uploadDate || new Date(),
                category: 'Bukti Audit',
                title: data.title || data.fileName || 'Tanpa Judul',
                description: data.description || '',
                tags: data.tags || [],
                auditId: auditId,
                cloudinaryId: data.cloudinaryId || data.cloudinaryPublicId || data.fileId,
                source: 'audit-evidence',
                sourceType: 'evidence'
              });
            });
          } catch (error) {
            console.log(`Error fetching evidence for audit ${auditId}:`, error.message);
          }
        }
      } catch (error) {
        console.log('Error fetching audits:', error.message);
      }

      // Load from top-level collections
      try {
        // Documents collection
        const docsQuery = query(collection(db, COLLECTIONS.DOCUMENTS), orderBy('uploadDate', 'desc'));
        const docsSnap = await getDocs(docsQuery);
        docsSnap.forEach((d) => {
          const data = d.data();
          // Skip deleted documents
          if (data.isDeleted) return;
          
          aggregated.push({
            id: d.id,
            fileName: data.fileName || 'Tanpa Nama',
            fileSize: data.fileSize || 0,
            fileType: data.fileType || 'application/octet-stream',
            fileUrl: data.fileUrl,
            uploadedBy: data.uploadedBy || '-',
            uploadDate: data.uploadDate || new Date(),
            category: data.category || 'Dokumen',
            title: data.title || data.fileName || 'Tanpa Judul',
            description: data.description || '',
            tags: data.tags || [],
            cloudinaryId: data.cloudinaryId || data.cloudinaryPublicId || data.fileId,
            source: 'documents',
            sourceType: 'document'
          });
        });
      } catch (error) {
        console.log('Documents collection query failed:', error.message);
      }

      // Load from legacy collections
      try {
        // Legacy work_papers collection
        const legacyWpQuery = query(collection(db, 'work_papers'), orderBy('uploadedAt', 'desc'));
        const legacyWpSnap = await getDocs(legacyWpQuery);
        legacyWpSnap.forEach((d) => {
          const data = d.data();
          // Skip deleted documents
          if (data.isDeleted) return;
          
          aggregated.push({
            id: d.id,
            fileName: data.fileName || data.name || 'Tanpa Nama',
            fileSize: data.fileSize || 0,
            fileType: data.fileType || 'application/octet-stream',
            fileUrl: data.cloudinaryUrl || data.fileUrl,
            uploadedBy: data.uploadedBy || '-',
            uploadDate: data.uploadedAt || data.uploadDate || new Date(),
            category: 'Kertas Kerja',
            title: data.title || data.fileName || 'Tanpa Judul',
            description: data.description || '',
            tags: data.tags || [],
            cloudinaryId: data.cloudinaryId || data.cloudinaryPublicId || data.fileId,
            source: 'legacy-workpaper',
            sourceType: 'workPaper'
          });
        });

        // Legacy audit_evidence collection
        const legacyEvQuery = query(collection(db, 'audit_evidence'), orderBy('uploadedAt', 'desc'));
        const legacyEvSnap = await getDocs(legacyEvQuery);
        legacyEvSnap.forEach((d) => {
          const data = d.data();
          // Skip deleted documents
          if (data.isDeleted) return;
          
          aggregated.push({
            id: d.id,
            fileName: data.fileName || data.name || 'Tanpa Nama',
            fileSize: data.fileSize || 0,
            fileType: data.fileType || 'application/octet-stream',
            fileUrl: data.cloudinaryUrl || data.fileUrl,
            uploadedBy: data.uploadedBy || '-',
            uploadDate: data.uploadedAt || data.uploadDate || new Date(),
            category: 'Bukti Audit',
            title: data.title || data.fileName || 'Tanpa Judul',
            description: data.description || '',
            tags: data.tags || [],
            cloudinaryId: data.cloudinaryId || data.cloudinaryPublicId || data.fileId,
            source: 'legacy-evidence',
            sourceType: 'evidence'
          });
        });
      } catch (error) {
        console.log('Legacy collections query failed:', error.message);
      }

      console.log(`Total documents found: ${aggregated.length}`);
      
      // Sort by upload date (newest first)
      aggregated.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      
      setDocuments(aggregated);
      setFilteredDocuments(aggregated);
      
      // Calculate category statistics
      const stats = aggregated.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {});
      setCategoryStats(stats);
      
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (document) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${document.fileName}"?`)) {
      return;
    }

    try {
      console.log('Deleting document:', document);
      
      // If document is from audit subcollection, use cloudinaryService
      if (document.auditId && document.sourceType) {
        console.log(`Deleting from audit ${document.auditId}, type: ${document.sourceType}`);
        await cloudinaryService.deleteFile(document.auditId, document.sourceType, document.id);
        console.log('Document deleted successfully from audit subcollection');
      } 
      // If document is from top-level documents collection
      else if (document.source === 'documents') {
        console.log('Deleting from documents collection');
        await deleteDoc(doc(db, COLLECTIONS.DOCUMENTS, document.id));
        console.log('Document deleted successfully from documents collection');
      }
      // If document is from legacy collections
      else if (document.source === 'legacy-workpaper') {
        console.log('Deleting from legacy work_papers collection');
        await deleteDoc(doc(db, 'work_papers', document.id));
        console.log('Document deleted successfully from legacy work_papers');
      }
      else if (document.source === 'legacy-evidence') {
        console.log('Deleting from legacy audit_evidence collection');
        await deleteDoc(doc(db, 'audit_evidence', document.id));
        console.log('Document deleted successfully from legacy evidence');
      }
      else {
        throw new Error('Unknown document source');
      }
      
      // Show success message
      alert('Dokumen berhasil dihapus!');
      
      // Refresh the list
      await fetchDocuments();
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Gagal menghapus dokumen: ${error.message}`);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = (fileName || '').split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FiFileText className="text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FiImage className="text-purple-500" />;
      case 'docx':
      case 'doc':
        return <FiFileText className="text-blue-500" />;
      default:
        return <FiFile className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="dokumen-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Dokumen</h1>
          <p className="page-subtitle">Kelola dokumen dan file audit</p>
        </div>
        <button 
          className="upload-btn"
          onClick={() => setShowUploadModal(true)}
        >
          <FiUpload />
          Upload Dokumen
        </button>
      </div>

      {/* Category Cards */}
      <div className="category-cards">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.name} className="category-card">
              <div className="category-icon">
                <Icon />
              </div>
              <div className="category-info">
                <h3 className="category-name">{category.name}</h3>
                <p className="category-count">{categoryStats[category.name] || 0}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-section">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-section">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="Semua Kategori">Semua Kategori</option>
            {categories.map(category => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FiList />
              List
            </button>
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Documents Table/Grid */}
      <div className="documents-container">
        {loading ? (
          <div className="loading">Memuat dokumen...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <FiFolder className="empty-icon" />
            <p>Tidak ada dokumen ditemukan</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="documents-table">
            <table>
              <thead>
                <tr>
                  <th>Nama File</th>
                  <th>Kategori</th>
                  <th>Ukuran</th>
                  <th>Upload Oleh</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="file-info">
                      <div className="file-icon">
                        {getFileIcon(doc.fileName)}
                      </div>
                      <div className="file-details">
                        <div className="file-name">{doc.fileName}</div>
                        <div className="file-description">{doc.title}</div>
                        <div className="file-tags">
                          {doc.tags?.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`category-tag ${doc.category?.toLowerCase().replace(' ', '-')}`}>
                        {doc.category}
                      </span>
                    </td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>{doc.uploadedBy}</td>
                    <td>{formatDate(doc.uploadDate)}</td>
                    <td className="actions">
                      <button className="action-btn view" title="Lihat">
                        <FiEye />
                      </button>
                      <button className="action-btn download" title="Download">
                        <FiDownload />
                      </button>
                      <button 
                        className="action-btn delete" 
                        title="Hapus"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="documents-grid">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="card-header">
                  <div className="file-icon">
                    {getFileIcon(doc.fileName)}
                  </div>
                  <div className="card-actions">
                    <button className="action-btn view" title="Lihat">
                      <FiEye />
                    </button>
                    <button className="action-btn download" title="Download">
                      <FiDownload />
                    </button>
                    <button 
                      className="action-btn delete" 
                      title="Hapus"
                      onClick={() => handleDeleteDocument(doc)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div className="card-content">
                  <h3 className="file-name">{doc.fileName}</h3>
                  <p className="file-description">{doc.title}</p>
                  <div className="file-tags">
                    {doc.tags?.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="file-meta">
                    <span className="category-tag">{doc.category}</span>
                    <span className="file-size">{formatFileSize(doc.fileSize)}</span>
                  </div>
                  <div className="file-info">
                    <span>Oleh: {doc.uploadedBy}</span>
                    <span>{formatDate(doc.uploadDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
};

export default Dokumen;
