import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiSearch, 
  FiFilter,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiX,
  FiSave,
  FiFileText,
  FiUsers,
  FiCalendar as FiCalendarIcon
} from 'react-icons/fi';
import { auditService } from '../services/firebaseService';
import TeamManagementModal from '../components/TeamManagementModal';

const PerencanaanAudit = () => {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [priorityFilter, setPriorityFilter] = useState('Semua Prioritas');
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [auditPlans, setAuditPlans] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    draft: 0,
    approved: 0,
    ongoing: 0,
    completed: 0,
    highPriority: 0
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalMode, setModalMode] = useState('create'); // 'create', 'view', 'edit'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    type: '',
    priority: 'Sedang',
    status: 'Draft',
    startDate: '',
    endDate: '',
    description: '',
    scope: '',
    objectives: '',
    budget: '',
    riskLevel: 'Medium',
    team: [] // Team members array
  });

  // Load audit plans from Firestore
  useEffect(() => {
    loadAuditPlans();
  }, []);

  const loadAuditPlans = async () => {
    try {
      setLoading(true);
      // Load all audit plans (Draft, Disetujui, Berlangsung, Selesai)
      // All audit plans remain in this page regardless of status
      const plans = await auditService.getPlanningAudits();
      setAuditPlans(plans);
      
      // Calculate summary stats
      const stats = await auditService.getPlanningStats();
      setSummaryStats(stats);
    } catch (error) {
      console.error('Error loading audit plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateForDisplay = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };
    
    return `${formatDate(startDate)} s/d ${formatDate(endDate)}`;
  };

  const parsePeriodString = (periodString) => {
    if (!periodString) return { startDate: '', endDate: '' };
    
    const parts = periodString.split(' s/d ');
    if (parts.length === 2) {
      const startDate = new Date(parts[0].split('/').reverse().join('-'));
      const endDate = new Date(parts[1].split('/').reverse().join('-'));
      
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
    
    return { startDate: '', endDate: '' };
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      department: '',
      type: '',
      priority: 'Sedang',
      status: 'Draft',
      startDate: '',
      endDate: '',
      description: '',
      scope: '',
      objectives: '',
      budget: '',
      riskLevel: 'Medium',
      team: []
    });
    setShowModal(true);
  };

  const openViewModal = (plan) => {
    setModalMode('view');
    setSelectedPlan(plan);
    
    // Parse period string to get start and end dates
    const { startDate, endDate } = parsePeriodString(plan.period);
    
    setFormData({
      title: plan.title,
      department: plan.department,
      type: plan.type,
      priority: plan.priority,
      status: plan.status,
      startDate: startDate,
      endDate: endDate,
      description: plan.description,
      scope: plan.scope,
      objectives: plan.objectives,
      budget: plan.budget,
      riskLevel: plan.riskLevel,
      team: plan.team || []
    });
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setModalMode('edit');
    setSelectedPlan(plan);
    
    // Parse period string to get start and end dates
    const { startDate, endDate } = parsePeriodString(plan.period);
    
    setFormData({
      title: plan.title,
      department: plan.department,
      type: plan.type,
      priority: plan.priority,
      status: plan.status,
      startDate: startDate,
      endDate: endDate,
      description: plan.description,
      scope: plan.scope,
      objectives: plan.objectives,
      budget: plan.budget,
      riskLevel: plan.riskLevel,
      team: plan.team || []
    });
    setShowModal(true);
  };

  // Handler for team management
  const handleOpenTeamModal = () => {
    setShowTeamModal(true);
  };

  const handleSaveTeam = (team) => {
    setFormData(prev => ({
      ...prev,
      team: team
    }));
    setShowTeamModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format period string from start and end dates
      const period = formatDateForDisplay(formData.startDate, formData.endDate);
      
      // Convert date strings to Date objects for Firestore
      const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
      const endDate = formData.endDate ? new Date(formData.endDate) : new Date();
      
      // Get auditor name from team leader (Ketua Tim)
      const teamLeader = formData.team?.find(member => member.role === 'Ketua Tim');
      const auditor = teamLeader ? teamLeader.name : '';
      
      if (modalMode === 'create') {
        // Convert budget to number and add required fields
        const planData = {
          ...formData,
          auditor: auditor, // Set auditor from team leader
          period: period,
          budget: parseFloat(formData.budget) || 0,
          startDate: startDate,
          endDate: endDate,
          progress: 0, // Default progress for new plans
          team: formData.team || [], // Team from form
          workPapers: [], // Default empty work papers
          evidence: [], // Default empty evidence
          notes: [] // Default empty notes
        };

        console.log('Sending audit data to Firestore:', planData);
        await auditService.createAudit(planData);
        alert('Rencana audit berhasil dibuat!');
      } else if (modalMode === 'edit') {
        // Convert budget to number and update dates
        const planData = {
          ...formData,
          auditor: auditor, // Update auditor from team leader
          period: period,
          budget: parseFloat(formData.budget) || 0,
          startDate: startDate,
          endDate: endDate
        };

        await auditService.updateAudit(selectedPlan.id, planData);
        alert('Rencana audit berhasil diperbarui!');
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        department: '',
        type: '',
        priority: 'Sedang',
        status: 'Draft',
        startDate: '',
        endDate: '',
        description: '',
        scope: '',
        objectives: '',
        budget: '',
        riskLevel: 'Medium',
        team: []
      });
      setShowModal(false);
      setSelectedPlan(null);
      
      // Reload audit plans
      await loadAuditPlans();
    } catch (error) {
      console.error('Error saving audit plan:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Gagal menyimpan rencana audit: ${error.message}. Silakan coba lagi.`);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rencana audit ini?')) {
      try {
        await auditService.deleteAudit(planId);
        await loadAuditPlans();
        alert('Rencana audit berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting audit plan:', error);
        alert('Gagal menghapus rencana audit. Silakan coba lagi.');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlan(null);
    setFormData({
      title: '',
      department: '',
      type: '',
      priority: 'Sedang',
      status: 'Draft',
      startDate: '',
      endDate: '',
      description: '',
      scope: '',
      objectives: '',
      budget: '',
      riskLevel: 'Medium',
      team: []
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Tinggi': return '#ef4444';
      case 'Sedang': return '#f59e0b';
      case 'Rendah': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return '#6b7280';
      case 'Disetujui': return '#10b981';
      case 'Berlangsung': return '#3b82f6';
      case 'Selesai': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <FiFileText size={16} />;
      case 'Disetujui': return <FiCheckCircle size={16} />;
      case 'Berlangsung': return <FiClock size={16} />;
      case 'Selesai': return <FiCheckCircle size={16} />;
      default: return <FiFileText size={16} />;
    }
  };

  // Filter plans based on search and filters
  // Note: All audit plans remain in this page regardless of status
  // (Draft, Disetujui, Berlangsung, Selesai) - they don't move to other pages
  const filteredPlans = auditPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.auditor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua Status' || plan.status === statusFilter;
    const matchesPriority = priorityFilter === 'Semua Prioritas' || plan.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const renderModalContent = () => {
    const isViewMode = modalMode === 'view';
    const isEditMode = modalMode === 'edit';
    const isCreateMode = modalMode === 'create';

    return (
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {isCreateMode && 'Buat Rencana Audit Baru'}
            {isViewMode && 'Detail Rencana Audit'}
            {isEditMode && 'Edit Rencana Audit'}
          </h2>
          <button 
            className="modal-close"
            onClick={closeModal}
          >
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="audit-plan-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Judul Rencana Audit</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                placeholder="Masukkan judul rencana audit"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="department">Unit Auditee</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                placeholder="Contoh: Dinas Pendidikan"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Jenis Audit</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
              >
                <option value="">Pilih jenis audit</option>
                <option value="Audit Keuangan">Audit Keuangan</option>
                <option value="Audit Kinerja">Audit Kinerja</option>
                <option value="Audit Kepatuhan">Audit Kepatuhan</option>
                <option value="Audit Operasional">Audit Operasional</option>
                <option value="Audit Sistem">Audit Sistem</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="priority">Prioritas</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
              >
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
              >
                <option value="Draft">Draft</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="riskLevel">Tingkat Risiko</label>
              <select
                id="riskLevel"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
              >
                <option value="Low">Rendah</option>
                <option value="Medium">Sedang</option>
                <option value="High">Tinggi</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">
                <FiCalendarIcon />
                Tanggal Mulai
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">
                <FiCalendarIcon />
                Tanggal Selesai
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget">Anggaran (Rp)</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Tim Audit Section */}
          <div className="form-group team-section">
            <label>
              <FiUsers />
              Tim Audit
            </label>
            <div className="team-management">
              <div className="team-info">
                {formData.team && formData.team.length > 0 ? (
                  <div className="team-members-summary">
                    <div className="team-count-badge">
                      {formData.team.length} Anggota Tim
                    </div>
                    <div className="team-members-list-mini">
                      {formData.team.map((member, index) => (
                        <div key={index} className="team-member-mini">
                          <div className="member-avatar-mini">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-info-mini">
                            <span className="member-name">{member.name}</span>
                            {member.role === 'Ketua Tim' && (
                              <span className="leader-badge">★ Ketua</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-team">
                    <FiUsers size={24} />
                    <p>Belum ada anggota tim</p>
                  </div>
                )}
              </div>
              {!isViewMode && (
                <button
                  type="button"
                  className="manage-team-btn"
                  onClick={handleOpenTeamModal}
                >
                  <FiUsers />
                  Kelola Tim Audit
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isViewMode}
              rows="3"
              placeholder="Deskripsi singkat tentang rencana audit"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scope">Ruang Lingkup</label>
              <textarea
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleInputChange}
                disabled={isViewMode}
                rows="3"
                placeholder="Ruang lingkup audit yang akan dilakukan"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="objectives">Tujuan Audit</label>
              <textarea
                id="objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                disabled={isViewMode}
                rows="3"
                placeholder="Tujuan dan sasaran audit"
              />
            </div>
          </div>

          {!isViewMode && (
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={closeModal}
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                <FiSave />
                {isCreateMode ? 'Simpan Rencana' : 'Update Rencana'}
              </button>
            </div>
          )}

          {isViewMode && (
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={closeModal}
              >
                Tutup
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  setModalMode('edit');
                }}
              >
                <FiEdit />
                Edit Rencana
              </button>
            </div>
          )}
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="perencanaan-content">
        <div className="loading-message">Memuat data rencana audit...</div>
      </div>
    );
  }

  return (
    <div className="perencanaan-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Perencanaan Audit</h1>
          <p>Manajemen dan perencanaan audit internal</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon planning">
            <FiCalendar />
          </div>
          <div className="card-content">
            <h3>{summaryStats.total}</h3>
            <p>Total Rencana</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon draft">
            <FiFileText />
          </div>
          <div className="card-content">
            <h3>{summaryStats.draft}</h3>
            <p>Draft</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon approved">
            <FiCheckCircle />
          </div>
          <div className="card-content">
            <h3>{summaryStats.approved}</h3>
            <p>Disetujui</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon ongoing">
            <FiClock />
          </div>
          <div className="card-content">
            <h3>{summaryStats.ongoing}</h3>
            <p>Berlangsung</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon completed">
            <FiCheckCircle />
          </div>
          <div className="card-content">
            <h3>{summaryStats.completed}</h3>
            <p>Selesai</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon high-priority">
            <FiAlertTriangle />
          </div>
          <div className="card-content">
            <h3>{summaryStats.highPriority}</h3>
            <p>Prioritas Tinggi</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Cari rencana audit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Berlangsung">Berlangsung</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
          
          <div className="filter-group">
            <FiFilter />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="Semua Prioritas">Semua Prioritas</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>
        </div>
        
        <button className="add-plan-btn" onClick={openCreateModal}>
          <FiPlus />
          <span>+ Tambah Rencana</span>
        </button>
      </div>

      {/* Audit Plans Table */}
      <div className="audit-plans-table">
        {loading ? (
          <div className="loading-message">Memuat data rencana audit...</div>
        ) : (
          <table className="plans-table">
            <thead>
              <tr>
                <th>Rencana Audit</th>
                <th>Jenis</th>
                <th>Prioritas</th>
                <th>Status</th>
                <th>Auditor</th>
                <th>Periode</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map(plan => (
                <tr key={plan.id}>
                  <td>
                    <div className="plan-info">
                      <div className="plan-title">{plan.title}</div>
                      <div className="plan-department">{plan.department}</div>
                    </div>
                  </td>
                  <td>{plan.type}</td>
                  <td>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(plan.priority) }}
                    >
                      {plan.priority}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(plan.status) }}
                    >
                      {getStatusIcon(plan.status)}
                      {plan.status}
                    </span>
                  </td>
                  <td>{plan.auditor}</td>
                  <td>{plan.period}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view" 
                        title="Lihat"
                        onClick={() => openViewModal(plan)}
                      >
                        <FiEye />
                      </button>
                      <button 
                        className="action-btn edit" 
                        title="Edit"
                        onClick={() => openEditModal(plan)}
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="action-btn delete" 
                        title="Hapus"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form for Creating/Viewing/Editing Audit Plan */}
      {showModal && (
        <div className="modal-overlay">
          {renderModalContent()}
        </div>
      )}

      {/* Team Management Modal */}
      <TeamManagementModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        currentTeam={formData.team}
        onSaveTeam={handleSaveTeam}
      />
    </div>
  );
};

export default PerencanaanAudit;
