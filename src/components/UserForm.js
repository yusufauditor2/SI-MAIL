import React from 'react';

const inputStyle = { width: '100%' };
const cardStyle = { background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(16,24,40,0.08)' };

export default function UserForm({ form, submitting, error, success, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>Tambah User Baru</h3>
      {error && <div style={{ color: '#b42318', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: '#027a48', marginBottom: 8 }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>Nama</label>
          <input name="name" value={form.name} onChange={onChange} required style={inputStyle} />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} required style={inputStyle} />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} style={inputStyle} />
        </div>
        <div>
          <label>Role</label>
          <select name="role" value={form.role} onChange={onChange} style={inputStyle}>
            <option value="Administrator">Administrator</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Auditor">Auditor</option>
          </select>
        </div>
        <div>
          <label>OPD</label>
          <input name="department" value={form.department} onChange={onChange} style={inputStyle} />
        </div>
        <div>
          <label>No. Telepon</label>
          <input name="phone" value={form.phone} onChange={onChange} style={inputStyle} />
        </div>
        <div>
          <label>Jabatan</label>
          <input name="position" value={form.position} onChange={onChange} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Buat User'}
        </button>
      </div>
    </form>
  );
}





