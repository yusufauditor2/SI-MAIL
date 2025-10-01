import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiBarChart2,
  FiFileText,
  FiPaperclip,
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPlay,
  FiPlus,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiEye,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiUpload,
  FiMoreVertical,
  FiArrowUp,
  FiMic,
  FiAlertTriangle
} from 'react-icons/fi';
import { auditService } from '../services/firebaseService';
import FileUploadModal from '../components/FileUploadModal';
import FileList from '../components/FileList';

const PelaksanaanAudit = () => {
  const [activeAudits, setActiveAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    pending: 0
  });

  // Extended audit data structure
  const [auditDetails, setAuditDetails] = useState({
    workPapers: 0,
    evidence: 0,
    interviews: 0,
    findings: 0,
    overallProgress: 0,
    currentStage: 'Persiapan',
    stageProgress: 0
  });

  // File upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState('workPaper');
  const [uploadTitle, setUploadTitle] = useState('');
  const [fileListRefreshKey, setFileListRefreshKey] = useState(0);

  // Load active audits from Firestore
  // Note: This page uses the unified 'audits' collection with execution statuses
  // (Disetujui, Berlangsung, Dalam Proses, Review, Finalisasi, Selesai)
  const loadActiveAudits = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading active audits...');
      
      const audits = await auditService.getExecutionAudits();
      console.log('Audits loaded:', audits);
      
      const executionStats = await auditService.getExecutionStats();
      console.log('Execution stats:', executionStats);
      
      // If no audits found, provide some sample data for testing
      if (!audits || audits.length === 0) {
        console.log('No audits found, using sample data');
        const sampleAudits = [
          {
            id: 'sample-1',
            title: 'Audit Keuangan Dinas Pendidikan',
            department: 'Dinas Pendidikan',
            status: 'Berlangsung',
            progress: 65,
            type: 'Keuangan',
            priority: 'Tinggi',
            description: 'Audit keuangan tahunan untuk Dinas Pendidikan',
            period: '2024',
            team: [
              { name: 'Sri Wahyuni', role: 'Ketua Tim' },
              { name: 'Ahmad Rahman', role: 'Anggota' }
            ],
            workPapersCount: 3,
            evidenceCount: 8,
            interviewsCount: 2,
            findingsCount: 5,
            updatedAt: new Date()
          },
          {
            id: 'sample-2',
            title: 'Audit Kinerja Dinas Kesehatan',
            department: 'Dinas Kesehatan',
            status: 'Dalam Proses',
            progress: 45,
            type: 'Kinerja',
            priority: 'Sedang',
            description: 'Audit kinerja program kesehatan masyarakat',
            period: '2024',
            team: [
              { name: 'Siti Nurhaliza', role: 'Ketua Tim' },
              { name: 'Budi Santoso', role: 'Anggota' }
            ],
            workPapersCount: 2,
            evidenceCount: 5,
            interviewsCount: 1,
            findingsCount: 3,
            updatedAt: new Date()
          }
        ];
        setActiveAudits(sampleAudits);
        setStats({
          total: 2,
          ongoing: 1,
          completed: 0,
          pending: 1
        });
        
        setSelectedAudit(prev => prev || sampleAudits[0]);
      } else {
        setActiveAudits(audits);
        setStats({
          total: executionStats?.total || 0,
          ongoing: executionStats?.ongoing || 0,
          completed: executionStats?.completed || 0,
          pending: executionStats?.approved || 0
        });
        
        // Set first audit as selected by default only if no audit is currently selected
        setSelectedAudit(prev => prev || audits[0]);
      }
    } catch (error) {
      console.error('Error loading active audits:', error);
      // Set empty arrays to prevent undefined errors
      setActiveAudits([]);
      setStats({
        total: 0,
        ongoing: 0,
        completed: 0,
        pending: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveAudits();
  }, [loadActiveAudits]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disetujui': return '#10b981';
      case 'Berlangsung': return '#3b82f6';
      case 'Dalam Proses': return '#f59e0b';
      case 'Review': return '#ef4444';
      case 'Finalisasi': return '#8b5cf6';
      case 'Selesai': return '#059669';
      case 'Persiapan': return '#f59e0b';
      case 'Pelaksanaan': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Disetujui': return <FiCheckCircle size={16} />;
      case 'Berlangsung': return <FiPlay size={16} />;
      case 'Dalam Proses': return <FiClock size={16} />;
      case 'Review': return <FiAlertCircle size={16} />;
      case 'Finalisasi': return <FiFileText size={16} />;
      case 'Selesai': return <FiCheckCircle size={16} />;
      case 'Persiapan': return <FiFileText size={16} />;
      case 'Pelaksanaan': return <FiClock size={16} />;
      default: return <FiClock size={16} />;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return '#10b981';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Removed unused formatCurrency to satisfy ESLint

  // Function to update audit details based on selected audit
  const updateAuditDetails = useCallback((audit) => {
    console.log('Updating audit details for:', audit);
    
    if (!audit) {
      console.log('No audit selected, setting default values');
      setAuditDetails({
        workPapers: 0,
        evidence: 0,
        interviews: 0,
        findings: 0,
        overallProgress: 0,
        currentStage: 'Persiapan',
        stageProgress: 0
      });
      return;
    }

    const newAuditDetails = {
      workPapers: audit.workPapersCount || 0,
      evidence: audit.evidenceCount || 0,
      interviews: audit.interviewsCount || 0,
      findings: audit.findingsCount || 0,
      overallProgress: audit.progress || 0,
      currentStage: audit.currentStage || audit.status || 'Persiapan',
      stageProgress: audit.stageProgress || 0
    };
    
    console.log('Setting audit details:', newAuditDetails);
    setAuditDetails(newAuditDetails);
  }, []);

  // Update audit details when selected audit changes
  useEffect(() => {
    updateAuditDetails(selectedAudit);
  }, [selectedAudit, updateAuditDetails]);

  // Function to refresh selected audit data
  const refreshSelectedAudit = useCallback(async (currentSelectedAudit) => {
    if (!currentSelectedAudit) return;
    
    try {
      const audits = await auditService.getExecutionAudits();
      const updatedSelectedAudit = audits.find(audit => audit.id === currentSelectedAudit.id);
      if (updatedSelectedAudit) {
        setSelectedAudit(updatedSelectedAudit);
      }
    } catch (error) {
      console.error('Error refreshing selected audit:', error);
    }
  }, []); // Remove selectedAudit dependency

  const handleUploadSuccess = () => {
    // Refresh data after successful upload
    loadActiveAudits();
    // Refresh selected audit data
    if (selectedAudit) {
      refreshSelectedAudit(selectedAudit);
    }
    // Force re-render of file lists by updating refresh key
    setFileListRefreshKey(prev => prev + 1);
  };

  const handleFileDeleted = () => {
    // Refresh audit details after file deletion
    if (selectedAudit) {
      refreshSelectedAudit(selectedAudit);
    }
    // Force re-render of file lists by updating refresh key
    setFileListRefreshKey(prev => prev + 1);
  };

  const handleUploadModalClose = () => {
    setUploadModalOpen(false);
    setUploadType('workPaper');
    setUploadTitle('');
  };

  const openUploadModal = (type, title) => {
    setUploadType(type);
    setUploadTitle(title);
    setUploadModalOpen(true);
  };

  const filteredAudits = (activeAudits || []).filter(audit => {
    if (!audit || !audit.title || !audit.department) return false;
    
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderAuditStages = (currentStage) => {
    const stages = [
      { id: 'persiapan', name: 'Persiapan', icon: <FiFileText />, status: 'active' },
      { id: 'pelaksanaan', name: 'Pelaksanaan', icon: <FiClock />, status: 'pending' },
      { id: 'review', name: 'Review', icon: <FiAlertCircle />, status: 'pending' },
      { id: 'finalisasi', name: 'Finalisasi', icon: <FiCheckCircle />, status: 'pending' }
    ];

    return (
      <div className="audit-stages">
        {stages.map((stage, index) => (
          <div key={stage.id} className={`stage-item ${stage.status}`}>
            <div className="stage-icon">
              {stage.icon}
            </div>
            <div className="stage-name">{stage.name}</div>
            {index < stages.length - 1 && (
              <div className={`stage-line ${stage.status === 'completed' ? 'completed' : ''}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    if (!selectedAudit) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content">
            <div className="overview-section">
              {/* Overall Progress Section */}
              <div className="overall-progress-section">
                <div className="progress-header">
                  <h3>Progress Keseluruhan</h3>
                  <span className="progress-percentage">{auditDetails.overallProgress}%</span>
                </div>
                <div className="progress-bar large">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${auditDetails.overallProgress}%`,
                      backgroundColor: getProgressColor(auditDetails.overallProgress)
                    }}
                  ></div>
                </div>
              </div>

              {/* Current Stage Progress */}
              <div className="current-stage-section">
                <div className="stage-info">
                  <h4>{selectedAudit.title}</h4>
                  <div className="stage-progress-info">
                    <span className="stage-label">{auditDetails.currentStage}</span>
                    <span className="stage-progress">{auditDetails.stageProgress}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${auditDetails.stageProgress}%`,
                      backgroundColor: getStatusColor(auditDetails.currentStage)
                    }}
                  ></div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="statistics-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <FiFileText />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{auditDetails.workPapers}</div>
                    <div className="stat-label">Kertas Kerja</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <FiArrowUp />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{auditDetails.evidence}</div>
                    <div className="stat-label">Bukti Audit</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">
                    <FiMic />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{auditDetails.interviews}</div>
                    <div className="stat-label">Wawancara</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">
                    <FiAlertTriangle />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{auditDetails.findings}</div>
                    <div className="stat-label">Temuan</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h3>Aksi Cepat</h3>
                <div className="quick-actions-grid">
                  <button 
                    className="quick-action-btn"
                    onClick={() => openUploadModal('workPaper', 'Tambah Kertas Kerja')}
                  >
                    <div className="action-icon blue">
                      <FiPlus />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Tambah Kertas Kerja</div>
                      <div className="action-subtitle">Buat kertas kerja baru</div>
                    </div>
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => openUploadModal('evidence', 'Upload Bukti Audit')}
                  >
                    <div className="action-icon green">
                      <FiArrowUp />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Upload Bukti</div>
                      <div className="action-subtitle">Tambah bukti audit</div>
                    </div>
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => openUploadModal('note', 'Tambah Catatan')}
                  >
                    <div className="action-icon purple">
                      <FiMessageSquare />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Tambah Catatan</div>
                      <div className="action-subtitle">Catat observasi</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Files Section */}
              <div className="recent-files-section">
                <h3>File Terbaru</h3>
                <div className="file-tabs">
                  <div className="file-tab-section">
                    <h4><FiFileText /> Kertas Kerja</h4>
                    <FileList 
                      key={`overview-workPaper-${fileListRefreshKey}`}
                      auditId={selectedAudit.id} 
                      fileType="workPaper"
                      onFileDeleted={handleFileDeleted}
                    />
                  </div>
                  <div className="file-tab-section">
                    <h4><FiPaperclip /> Bukti Audit</h4>
                    <FileList 
                      key={`overview-evidence-${fileListRefreshKey}`}
                      auditId={selectedAudit.id} 
                      fileType="evidence"
                      onFileDeleted={handleFileDeleted}
                    />
                  </div>
                  <div className="file-tab-section">
                    <h4><FiMessageSquare /> Catatan</h4>
                    <FileList 
                      key={`overview-note-${fileListRefreshKey}`}
                      auditId={selectedAudit.id} 
                      fileType="note"
                      onFileDeleted={handleFileDeleted}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'workpaper':
        return (
          <div className="tab-content">
            <div className="workpaper-section">
              <div className="section-header">
                <h3>Kertas Kerja</h3>
                <div className="section-actions">
                  <button className="btn-secondary">
                    <FiDownload />
                    Export
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => openUploadModal('workPaper', 'Tambah Kertas Kerja')}
                  >
                    <FiPlus />
                    Tambah Kertas Kerja
                  </button>
                </div>
              </div>
              <div className="workpaper-list">
                <FileList 
                  key={`workPaper-${fileListRefreshKey}`}
                  auditId={selectedAudit.id} 
                  fileType="workPaper"
                  onFileDeleted={handleFileDeleted}
                />
              </div>
            </div>
          </div>
        );
      case 'evidence':
        return (
          <div className="tab-content">
            <div className="evidence-section">
              <div className="section-header">
                <h3>Bukti Audit</h3>
                <div className="section-actions">
                  <button className="btn-secondary">
                    <FiUpload />
                    Bulk Upload
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => openUploadModal('evidence', 'Upload Bukti Audit')}
                  >
                    <FiPlus />
                    Upload Bukti
                  </button>
                </div>
              </div>
              <div className="evidence-list">
                <FileList 
                  key={`evidence-${fileListRefreshKey}`}
                  auditId={selectedAudit.id} 
                  fileType="evidence"
                  onFileDeleted={handleFileDeleted}
                />
              </div>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="tab-content">
            <div className="team-section">
              <div className="section-header">
                <h3>Tim Audit</h3>
                <div className="section-actions">
                  <button className="btn-secondary">
                    <FiUsers />
                    Lihat Semua
                  </button>
                  <button className="btn-primary">
                    <FiPlus />
                    Tambah Anggota
                  </button>
                </div>
              </div>
              <div className="team-list">
                {selectedAudit.team?.length > 0 ? (
                  selectedAudit.team.map((member, index) => (
                    <div key={index} className="team-member">
                      <div className="member-avatar">
                        {member.name?.charAt(0) || 'U'}
                      </div>
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-role">{member.role}</div>
                      </div>
                      <div className="member-actions">
                        <button className="action-icon-btn">
                          <FiMoreVertical />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <FiUsers size={48} />
                    <h4>Belum ada anggota tim</h4>
                    <p>Tambahkan anggota tim untuk melaksanakan audit ini</p>
                    <button className="btn-primary">Tambah Anggota Tim</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="tab-content">
            <div className="notes-section">
              <div className="section-header">
                <h3>Catatan</h3>
                <div className="section-actions">
                  <button className="btn-secondary">
                    <FiDownload />
                    Export
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => openUploadModal('note', 'Tambah Catatan')}
                  >
                    <FiPlus />
                    Tambah Catatan
                  </button>
                </div>
              </div>
              <div className="notes-list">
                <FileList 
                  key={`note-${fileListRefreshKey}`}
                  auditId={selectedAudit.id} 
                  fileType="note"
                  onFileDeleted={handleFileDeleted}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="pelaksanaan-content">
        <div className="loading-message">Memuat data audit...</div>
      </div>
    );
  }

  return (
    <div className="pelaksanaan-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Pelaksanaan Audit</h1>
          <p>Dokumentasi dan monitoring pelaksanaan audit internal</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiBarChart2 />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Audit</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FiPlay />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.ongoing}</div>
            <div className="stat-label">Sedang Berlangsung</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <FiClock />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Menunggu</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Selesai</div>
          </div>
        </div>
      </div>

      <div className="pelaksanaan-layout">
        {/* Left Column - Active Audits */}
        <div className="left-column">
          <div className="active-audits-card">
            <div className="card-header">
              <h3>Audit Aktif</h3>
              <div className="header-actions">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Cari audit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-box">
                  <FiFilter />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Review">Review</option>
                    <option value="Finalisasi">Finalisasi</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="audit-list">
              {filteredAudits.map(audit => (
                <div 
                  key={audit.id} 
                  className={`audit-item ${selectedAudit?.id === audit.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAudit(audit)}
                >
                  <div className="audit-header">
                    <div className="audit-info">
                      <h4>{audit.title}</h4>
                      <p className="audit-department">{audit.department}</p>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(audit.status) }}
                    >
                      {getStatusIcon(audit.status)}
                      {audit.status}
                    </span>
                  </div>
                  <div className="audit-progress">
                    <div className="progress-info">
                      <span className="progress-label">Progress</span>
                      <span className="progress-text">{audit.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${audit.progress}%`,
                          backgroundColor: getProgressColor(audit.progress)
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="audit-meta">
                    <div className="meta-item">
                      <FiCalendar size={12} />
                      <span>{audit.period}</span>
                    </div>
                    <div className="meta-item">
                      <FiUsers size={12} />
                      <span>{audit.team?.length || 0} anggota</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAudits.length === 0 && (
                <div className="empty-state">
                  <p>Tidak ada audit yang ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Audit Details */}
        <div className="right-column">
          {selectedAudit ? (
            <>
              {/* Main Audit Details Card */}
              <div className="audit-details-card">
                <div className="audit-info">
                  <div className="audit-header-main">
                    <div className="audit-title-section">
                      <h2>{selectedAudit.title}</h2>
                      <div className="audit-meta-main">
                        <div className="meta-item-main">
                          <span className="label">Departemen:</span>
                          <span className="value">{selectedAudit.department}</span>
                        </div>
                        <div className="meta-item-main">
                          <span className="label">Tipe Audit:</span>
                          <span className="value">{selectedAudit.type}</span>
                        </div>
                        <div className="meta-item-main">
                          <span className="label">Prioritas:</span>
                          <span className="value">
                            <span className="priority-badge">{selectedAudit.priority}</span>
                          </span>
                        </div>
                        <div className="meta-item-main">
                          <span className="label">Terakhir diupdate:</span>
                          <span className="value">{formatDate(selectedAudit.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="audit-actions">
                      <button className="action-btn view">
                        <FiEye />
                      </button>
                      <button className="action-btn edit">
                        <FiEdit />
                      </button>
                      <button className="action-btn delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  
                  <div className="audit-description">
                    <h4>Deskripsi</h4>
                    <p>{selectedAudit.description}</p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="audit-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <FiBarChart2 />
                    Overview
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'workpaper' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workpaper')}
                  >
                    <FiFileText />
                    Kertas Kerja
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'evidence' ? 'active' : ''}`}
                    onClick={() => setActiveTab('evidence')}
                  >
                    <FiPaperclip />
                    Bukti Audit
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveTab('team')}
                  >
                    <FiUsers />
                    Tim Audit
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                  >
                    <FiMessageSquare />
                    Catatan
                  </button>
                </div>

                {/* Tab Content */}
                {renderTabContent()}
              </div>

              {/* Audit Stages Card */}
              <div className="audit-stages-card">
                <div className="card-header">
                  <h3>Tahapan Audit</h3>
                </div>
                {renderAuditStages(selectedAudit.status)}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <FiBarChart2 size={64} />
                <h3>Pilih Audit</h3>
                <p>Pilih audit dari daftar untuk melihat detail dan mengelola pelaksanaannya</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={handleUploadModalClose}
        onSuccess={handleUploadSuccess}
        auditId={selectedAudit?.id}
        type={uploadType}
        title={uploadTitle}
      />
    </div>
  );
};

export default PelaksanaanAudit;
