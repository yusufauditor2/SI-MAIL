import React, { useState, useEffect } from 'react';
import { FiX, FiUsers, FiUserPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import { userService } from '../services/firebaseService';
import './TeamManagementModal.css';

const TeamManagementModal = ({ isOpen, onClose, currentTeam = [], onSaveTeam }) => {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [teamLeader, setTeamLeader] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Set current team as selected members
      setSelectedMembers(currentTeam || []);
      // Find team leader from current team
      const leader = (currentTeam || []).find(member => member.role === 'Ketua Tim');
      setTeamLeader(leader?.userId || null);
    }
  }, [isOpen, currentTeam]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const users = await userService.getAllUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (user) => {
    // Check if user already in team
    const isAlreadyMember = selectedMembers.some(member => member.userId === user.id);
    if (isAlreadyMember) {
      alert('User sudah menjadi anggota tim');
      return;
    }

    const newMember = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: 'Anggota Tim',
      position: user.position || 'Auditor',
      department: user.department || '',
      addedAt: new Date().toISOString()
    };

    setSelectedMembers([...selectedMembers, newMember]);
  };

  const handleRemoveMember = (userId) => {
    if (teamLeader === userId) {
      setTeamLeader(null);
    }
    setSelectedMembers(selectedMembers.filter(member => member.userId !== userId));
  };

  const handleSetTeamLeader = (userId) => {
    // Update the team leader
    setTeamLeader(userId);
    
    // Update selected members to reflect the new roles
    setSelectedMembers(selectedMembers.map(member => ({
      ...member,
      role: member.userId === userId ? 'Ketua Tim' : 'Anggota Tim'
    })));
  };

  const handleSave = () => {
    if (selectedMembers.length === 0) {
      alert('Tim audit harus memiliki minimal 1 anggota');
      return;
    }

    if (!teamLeader) {
      alert('Harap tentukan ketua tim terlebih dahulu');
      return;
    }

    // Ensure team leader role is set correctly
    const finalTeam = selectedMembers.map(member => ({
      ...member,
      role: member.userId === teamLeader ? 'Ketua Tim' : 'Anggota Tim'
    }));

    onSaveTeam(finalTeam);
    onClose();
  };

  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Don't show users already in team
    const notInTeam = !selectedMembers.some(member => member.userId === user.id);
    
    return matchesSearch && notInTeam;
  });

  if (!isOpen) return null;

  return (
    <div className="team-modal-overlay" onClick={onClose}>
      <div className="team-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="team-modal-header">
          <div className="header-title">
            <FiUsers size={24} />
            <h2>Kelola Tim Audit</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="team-modal-content">
          {/* Current Team Section */}
          <div className="current-team-section">
            <h3>
              <FiUsers /> Tim Audit Saat Ini 
              <span className="team-count">({selectedMembers.length} anggota)</span>
            </h3>
            
            {selectedMembers.length === 0 ? (
              <div className="empty-team">
                <FiUsers size={48} />
                <p>Belum ada anggota tim</p>
                <small>Pilih user dari daftar di bawah untuk menambah anggota</small>
              </div>
            ) : (
              <div className="team-members-list">
                {selectedMembers.map((member) => (
                  <div key={member.userId} className="team-member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <h4>{member.name}</h4>
                        <p>{member.position || 'Auditor'}</p>
                        <small>{member.email}</small>
                      </div>
                    </div>
                    
                    <div className="member-actions">
                      <div className="member-role">
                        {member.userId === teamLeader ? (
                          <span className="role-badge leader">Ketua Tim</span>
                        ) : (
                          <span className="role-badge member">Anggota</span>
                        )}
                      </div>
                      
                      <div className="action-buttons">
                        {member.userId !== teamLeader ? (
                          <button
                            className="set-leader-btn"
                            onClick={() => handleSetTeamLeader(member.userId)}
                            title="Jadikan Ketua Tim"
                          >
                            Jadikan Ketua
                          </button>
                        ) : (
                          <span className="leader-indicator">★ Ketua</span>
                        )}
                        
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Hapus dari tim"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Users Section */}
          <div className="available-users-section">
            <h3>
              <FiUserPlus /> Tambah Anggota Tim
            </h3>
            
            <div className="search-users">
              <FiSearch />
              <input
                type="text"
                placeholder="Cari user berdasarkan nama, email, atau posisi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading-users">Memuat data user...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>
                  {searchTerm 
                    ? 'Tidak ada user yang sesuai dengan pencarian' 
                    : 'Semua user sudah menjadi anggota tim'}
                </p>
              </div>
            ) : (
              <div className="available-users-list">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <h4>{user.name}</h4>
                        <p>{user.position || 'Auditor'} • {user.department || 'Inspektorat'}</p>
                        <small>{user.email}</small>
                      </div>
                    </div>
                    <button
                      className="add-member-btn"
                      onClick={() => handleAddMember(user)}
                    >
                      <FiUserPlus /> Tambah
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="team-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Batal
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={selectedMembers.length === 0 || !teamLeader}
          >
            <FiUsers /> Simpan Tim ({selectedMembers.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementModal;

