import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const URGENCY_META = {
  hemen: { label: 'Hemen', className: 'urgency-hemen' },
  bu_hafta: { label: 'Bu hafta', className: 'urgency-week' },
  sadece_bilgi: { label: 'Sadece bilgi', className: 'urgency-info' },
};

function formatDate(isoString) {
  // SQLite datetime('now') UTC döner, kullanıcı diline göre göster.
  const d = new Date(isoString + 'Z');
  return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Admin() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Talepler yüklenirken bir sorun oluştu.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Tunç Bilişim</div>
          <h1>Gelen Talepler</h1>
        </div>
        <Link to="/" className="admin-back-link">← Landing page'e dön</Link>
      </header>

      {loading && <p className="admin-status">Yükleniyor...</p>}
      {error && <p className="admin-status admin-error">{error}</p>}

      {!loading && !error && leads.length === 0 && (
        <p className="admin-status">Henüz gelen bir talep yok.</p>
      )}

      {!loading && !error && leads.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>İsim</th>
              <th>İhtiyaç özeti</th>
              <th>Aciliyet</th>
              <th>E-posta</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const meta = URGENCY_META[lead.urgency] || { label: '—', className: 'urgency-info' };
              return (
                <tr key={lead.id}>
                  <td className="admin-name">{lead.name || '—'}</td>
                  <td className="admin-summary">{lead.need_summary || '—'}</td>
                  <td>
                    <span className={`urgency-pill ${meta.className}`}>{meta.label}</span>
                  </td>
                  <td className="admin-email">{lead.email || <em>paylaşılmadı</em>}</td>
                  <td className="admin-date">{formatDate(lead.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
