import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiEye, 
  FiEdit3, 
  FiTrash2,
  FiAlertTriangle, 
  FiCheckCircle,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';
import { 
  FINDING_STATUS, 
  FINDING_CATEGORY, 
  FINDING_SEVERITY 
} from '../constants/collections';
import { findingService } from '../services/firebaseService';
import AddFindingModal from '../components/AddFindingModal';
import './TemuanAudit.css';

const TemuanAudit = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Semua Tingkat');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Summary data
  const summaryData = {
    total: findings.length,
    open: findings.filter(f => f.status === FINDING_STATUS.OPEN).length,
    inProgress: findings.filter(f => f.status === FINDING_STATUS.IN_PROGRESS).length,
    completed: findings.filter(f => f.status === FINDING_STATUS.COMPLETED).length,
    highPriority: findings.filter(f => f.severity === FINDING_SEVERITY.HIGH).length
  };

  useEffect(() => {
    loadFindings();
  }, []);

  const loadFindings = async () => {
    try {
      setLoading(true);
      console.log('[TemuanAudit] Loading findings...');
      // Try to load from Firebase first
      const findingsData = await findingService.getAllFindings();
      console.log('[TemuanAudit] Findings loaded:', findingsData.length);
      setFindings(findingsData);
    } catch (error) {
      console.error('Error loading findings from Firebase:', error);
      // Fallback to mock data for testing
      const mockFindings = [
        {
          id: '1',
          title: 'Ketidaksesuaian Pencatatan Aset',
          description: 'Ditemukan perbedaan nilai aset tetap antara catatan akuntansi dengan kondisi fisik di lapangan',
          severity: 'Tinggi',
          category: 'Keuangan',
          recommendation: 'Melakukan rekonsiliasi dan penyesuaian nilai aset tetap sesuai kondisi riil',
          status: 'Dalam Tindak Lanjut',
          auditContext: 'Audit Keuangan Dinas Pendidikan 2024',
          responsibleParty: 'Kepala Bagian Keuangan',
          findingDate: '2024-01-12',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '2',
          title: 'Kepatuhan SOP Pengadaan Barang',
          description: 'Proses pengadaan barang tidak sepenuhnya mengikuti SOP yang telah ditetapkan',
          severity: 'Sedang',
          category: 'Kepatuhan',
          recommendation: 'Melakukan sosialisasi dan pelatihan terkait SOP pengadaan barang',
          status: 'Terbuka',
          auditContext: 'Audit Kepatuhan Dinas PUPR 2024',
          responsibleParty: 'Kepala Seksi Pengadaan',
          findingDate: '2024-01-15',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '3',
          title: 'Efisiensi Penggunaan Dana BOS',
          description: 'Penggunaan dana BOS belum optimal dan efisien sesuai dengan peruntukannya',
          severity: 'Tinggi',
          category: 'Kinerja',
          recommendation: 'Meningkatkan monitoring dan evaluasi penggunaan dana BOS secara berkala',
          status: 'Selesai',
          auditContext: 'Audit Kinerja Dinas Pendidikan 2024',
          responsibleParty: 'Kepala Sekolah',
          findingDate: '2024-01-10',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        }
      ];
      setFindings(mockFindings);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinding = async (findingData) => {
    try {
      console.log('[TemuanAudit] Creating finding:', findingData);
      await findingService.createFinding(findingData);
      await loadFindings(); // Reload findings after adding new one
      setShowAddModal(false);
      alert('Temuan audit berhasil ditambahkan!');
    } catch (error) {
      console.error('Error saving finding to Firebase:', error);
      alert('Gagal menambahkan temuan: ' + error.message);
    }
  };

  const handleViewFinding = (finding) => {
    console.log('[TemuanAudit] Viewing finding:', finding);
    setSelectedFinding(finding);
    setShowViewModal(true);
  };

  const handleEditFinding = (finding) => {
    console.log('[TemuanAudit] Editing finding:', finding);
    setSelectedFinding(finding);
    setShowEditModal(true);
  };

  const handleUpdateFinding = async (findingData) => {
    try {
      console.log('[TemuanAudit] Updating finding:', selectedFinding.id, findingData);
      await findingService.updateFinding(selectedFinding.id, findingData);
      await loadFindings(); // Reload findings after update
      setShowEditModal(false);
      setSelectedFinding(null);
      alert('Temuan audit berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating finding:', error);
      alert('Gagal memperbarui temuan: ' + error.message);
    }
  };

  const handleDeleteFinding = async (findingId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus temuan ini?')) {
      return;
    }
    
    try {
      console.log('[TemuanAudit] Deleting finding:', findingId);
      await findingService.deleteFinding(findingId);
      await loadFindings(); // Reload findings after delete
      alert('Temuan audit berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting finding:', error);
      alert('Gagal menghapus temuan: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case FINDING_STATUS.OPEN:
        return 'status-open';
      case FINDING_STATUS.IN_PROGRESS:
        return 'status-progress';
      case FINDING_STATUS.IN_FOLLOW_UP:
        return 'status-followup';
      case FINDING_STATUS.COMPLETED:
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case FINDING_SEVERITY.HIGH:
        return 'severity-high';
      case FINDING_SEVERITY.MEDIUM:
        return 'severity-medium';
      case FINDING_SEVERITY.LOW:
        return 'severity-low';
      default:
        return 'severity-default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case FINDING_CATEGORY.FINANCIAL:
        return 'category-financial';
      case FINDING_CATEGORY.COMPLIANCE:
        return 'category-compliance';
      case FINDING_CATEGORY.PERFORMANCE:
        return 'category-performance';
      case FINDING_CATEGORY.OPERATIONAL:
        return 'category-operational';
      case FINDING_CATEGORY.SYSTEM:
        return 'category-system';
      default:
        return 'category-default';
    }
  };

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         finding.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'Semua Tingkat' || finding.severity === selectedLevel;
    const matchesStatus = selectedStatus === 'Semua Status' || finding.status === selectedStatus;
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const SummaryCard = ({ title, value, icon: Icon, color }) => (
    <div className="summary-card">
      <div className="summary-icon" style={{ backgroundColor: color }}>
        <Icon />
      </div>
      <div className="summary-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const FindingCard = ({ finding, onView, onEdit, onDelete }) => (
    <div className="finding-card">
      <div className="finding-header">
        <div className="finding-title-section">
          <h3>{finding.title}</h3>
          <div className="finding-tags">
            <span className={`tag severity-tag ${getSeverityColor(finding.severity)}`}>
              {finding.severity}
            </span>
            <span className={`tag category-tag ${getCategoryColor(finding.category)}`}>
              {finding.category}
            </span>
          </div>
        </div>
        <div className="finding-actions">
          <span className={`status-badge ${getStatusColor(finding.status)}`}>
            {finding.status}
          </span>
          <div className="action-buttons">
            <button 
              className="action-btn view-btn" 
              title="Lihat Detail"
              onClick={() => onView(finding)}
            >
              <FiEye />
            </button>
            <button 
              className="action-btn edit-btn" 
              title="Edit"
              onClick={() => onEdit(finding)}
            >
              <FiEdit3 />
            </button>
            <button 
              className="action-btn delete-btn" 
              title="Hapus"
              onClick={() => onDelete(finding.id)}
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      </div>
      
      <div className="finding-content">
        <div className="finding-context">
          <strong>Konteks Audit:</strong> {finding.auditContext}
        </div>
        
        <div className="finding-description">
          <strong>Temuan:</strong> {finding.description}
        </div>
        
        <div className="finding-recommendation">
          <strong>Rekomendasi:</strong> {finding.recommendation}
        </div>
        
        <div className="finding-details">
          <div className="detail-item">
            <strong>Penanggung Jawab:</strong> {finding.responsibleParty}
          </div>
          <div className="detail-item">
            <strong>Tanggal Temuan:</strong> {finding.findingDate}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data temuan audit...</p>
      </div>
    );
  }

  return (
    <div className="temuan-audit-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Temuan Audit</h1>
          <p>Kelola dan monitoring temuan hasil audit</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <SummaryCard 
          title="Dalam Proses" 
          value={summaryData.inProgress} 
          icon={FiClock} 
          color="#007bff"
        />
        <SummaryCard 
          title="Selesai" 
          value={summaryData.completed} 
          icon={FiCheckCircle} 
          color="#28a745"
        />
        <SummaryCard 
          title="Prioritas Tinggi" 
          value={summaryData.highPriority} 
          icon={FiTrendingUp} 
          color="#dc3545"
        />
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Cari temuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="filter-select"
          >
            <option>Semua Tingkat</option>
            <option value={FINDING_SEVERITY.HIGH}>Tinggi</option>
            <option value={FINDING_SEVERITY.MEDIUM}>Sedang</option>
            <option value={FINDING_SEVERITY.LOW}>Rendah</option>
          </select>
          
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option>Semua Status</option>
            <option value={FINDING_STATUS.OPEN}>Terbuka</option>
            <option value={FINDING_STATUS.IN_PROGRESS}>Dalam Proses</option>
            <option value={FINDING_STATUS.IN_FOLLOW_UP}>Dalam Tindak Lanjut</option>
            <option value={FINDING_STATUS.COMPLETED}>Selesai</option>
          </select>
        </div>
        
        <button 
          className="add-finding-btn"
          onClick={() => setShowAddModal(true)}
        >
          <FiPlus />
          Tambah Temuan
        </button>
      </div>

      {/* Findings List */}
      <div className="findings-list">
        {filteredFindings.length === 0 ? (
          <div className="empty-state">
            <FiAlertTriangle className="empty-icon" />
            <h3>Tidak ada temuan audit</h3>
            <p>Belum ada temuan audit yang ditemukan atau sesuai dengan filter yang dipilih.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard 
              key={finding.id} 
              finding={finding}
              onView={handleViewFinding}
              onEdit={handleEditFinding}
              onDelete={handleDeleteFinding}
            />
          ))
        )}
      </div>

      {/* Add Finding Modal */}
      <AddFindingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveFinding}
      />

      {/* View Finding Modal */}
      {showViewModal && selectedFinding && (
        <ViewFindingModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedFinding(null);
          }}
          finding={selectedFinding}
        />
      )}

      {/* Edit Finding Modal */}
      {showEditModal && selectedFinding && (
        <AddFindingModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFinding(null);
          }}
          onSave={handleUpdateFinding}
          initialData={selectedFinding}
          isEditMode={true}
        />
      )}
    </div>
  );
};

// View Finding Modal Component
const ViewFindingModal = ({ isOpen, onClose, finding }) => {
  if (!isOpen) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    if (date.toDate) {
      return date.toDate().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return '-';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content view-finding-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detail Temuan Audit</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="view-section">
            <label className="view-label">Judul Temuan</label>
            <p className="view-value">{finding.title || '-'}</p>
          </div>

          <div className="view-row">
            <div className="view-section">
              <label className="view-label">Kategori</label>
              <p className="view-value">
                <span className="badge badge-info">{finding.category || '-'}</span>
              </p>
            </div>
            <div className="view-section">
              <label className="view-label">Tingkat Keparahan</label>
              <p className="view-value">
                <span className={`badge ${
                  finding.severity === 'Tinggi' ? 'badge-danger' :
                  finding.severity === 'Sedang' ? 'badge-warning' :
                  'badge-success'
                }`}>{finding.severity || '-'}</span>
              </p>
            </div>
            <div className="view-section">
              <label className="view-label">Status</label>
              <p className="view-value">
                <span className="badge badge-primary">{finding.status || '-'}</span>
              </p>
            </div>
          </div>

          <div className="view-section">
            <label className="view-label">Konteks Audit</label>
            <p className="view-value">{finding.auditContext || '-'}</p>
          </div>

          <div className="view-section">
            <label className="view-label">Deskripsi Temuan</label>
            <p className="view-value whitespace-pre-wrap">{finding.description || '-'}</p>
          </div>

          <div className="view-section">
            <label className="view-label">Rekomendasi</label>
            <p className="view-value whitespace-pre-wrap">{finding.recommendation || '-'}</p>
          </div>

          <div className="view-section">
            <label className="view-label">Pihak Bertanggung Jawab</label>
            <p className="view-value">{finding.responsibleParty || '-'}</p>
          </div>

          <div className="view-row">
            <div className="view-section">
              <label className="view-label">Tanggal Temuan</label>
              <p className="view-value">{formatDate(finding.findingDate)}</p>
            </div>
            <div className="view-section">
              <label className="view-label">Dibuat Pada</label>
              <p className="view-value">{formatDate(finding.createdAt)}</p>
            </div>
            <div className="view-section">
              <label className="view-label">Terakhir Diperbarui</label>
              <p className="view-value">{formatDate(finding.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemuanAudit;
