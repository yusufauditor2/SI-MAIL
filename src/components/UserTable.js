import React from 'react';

const cardStyle = { background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(16,24,40,0.08)' };

export default function UserTable({ users, loading }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>Daftar User</h3>
      {loading ? (
        <div>Memuat...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Nama</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Role</th>
                <th style={{ textAlign: 'left', padding: 8 }}>OPD</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>{u.role}</td>
                  <td style={{ padding: 8 }}>{u.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}





