import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const URGENCY_META = {
  hemen: {
    label: 'Hemen',
    className: 'urgency-hemen',
  },
  bu_hafta: {
    label: 'Bu hafta',
    className: 'urgency-week',
  },
  sadece_bilgi: {
    label: 'Sadece bilgi',
    className: 'urgency-info',
  },
};

function formatDate(dateString) {
  if (!dateString) {
    return '—';
  }

  const date = new Date(
    dateString.endsWith('Z') ? dateString : `${dateString}Z`
  );

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Admin() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/leads')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Veriler alınamadı.');
        }

        return response.json();
      })
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Talepler yüklenirken bir sorun oluştu.');
        setLoading(false);
      });
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const search = searchTerm.toLocaleLowerCase('tr-TR');

    return (
      (lead.name || '').toLocaleLowerCase('tr-TR').includes(search) ||
      (lead.email || '').toLocaleLowerCase('tr-TR').includes(search) ||
      (lead.need_summary || '')
        .toLocaleLowerCase('tr-TR')
        .includes(search)
    );
  });

  return (
    <main className="admin">
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Tunç Bilişim</div>
          <h1>Gelen Talepler</h1>
        </div>

        <Link to="/" className="admin-back-link">
          ← Ana sayfaya dön
        </Link>
      </header>

      {loading && (
        <p className="admin-status">Talepler yükleniyor...</p>
      )}

      {error && (
        <p className="admin-status admin-error">{error}</p>
      )}

      {!loading && !error && leads.length === 0 && (
        <p className="admin-status">Henüz gelen bir talep yok.</p>
      )}

      {!loading && !error && leads.length > 0 && (
        <>
          <div className="admin-toolbar">
            <input
              className="admin-search"
              type="search"
              placeholder="İsim, e-posta veya ihtiyaç ara..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <span className="admin-result-count">
              {filteredLeads.length} talep
            </span>
          </div>

          {filteredLeads.length === 0 ? (
            <p className="admin-status">
              Aramanızla eşleşen talep bulunamadı.
            </p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>İsim</th>
                    <th>İhtiyaç Özeti</th>
                    <th>Aciliyet</th>
                    <th>E-posta</th>
                    <th>Tarih</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => {
                    const urgency =
                      URGENCY_META[lead.urgency] || {
                        label: 'Belirtilmedi',
                        className: 'urgency-info',
                      };

                    return (
                      <tr key={lead.id}>
                        <td className="admin-name">
                          {lead.name || '—'}
                        </td>

                        <td className="admin-summary">
                          {lead.need_summary || '—'}
                        </td>

                        <td>
                          <span
                            className={`urgency-pill ${urgency.className}`}
                          >
                            {urgency.label}
                          </span>
                        </td>

                        <td className="admin-email">
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`}>
                              {lead.email}
                            </a>
                          ) : (
                            <em>Paylaşılmadı</em>
                          )}
                        </td>

                        <td className="admin-date">
                          {formatDate(lead.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}