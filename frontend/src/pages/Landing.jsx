import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget.jsx';
import './Landing.css';

const FEATURES = [
  {
    title: 'Gerçek zamanlı satış analizi',
    desc: 'Hangi ürün, hangi kampanya işe yarıyor; anlık verilerle görün, tahmin etmeyin.',
  },
  {
    title: 'Stok ve talep tahmini',
    desc: 'Geçmiş satış verinizden yola çıkarak önümüzdeki dönem talebi öngörün.',
  },
  {
    title: 'Kampanya performans takibi',
    desc: 'Her kampanyanın gerçek ROI’sini tek ekrandan izleyin, karşılaştırın.',
  },
];

const STATS = [
  { value: '340+', label: 'e-ticaret firması' },
  { value: '%98', label: 'müşteri memnuniyeti' },
  { value: '12 dk', label: 'ortalama kurulum süresi' },
];

export default function Landing() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-logo">TUNÇ BİLİŞİM</div>
        <Link to="/admin" className="landing-admin-link">Ekip Girişi</Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />
        <span className="landing-badge">
          <span className="landing-badge-dot" />
          E-ticaret analitiği
        </span>
        <h1>
          Satışlarınızın hikayesini,
          <br />
          rakamlar anlatsın.
        </h1>
        <p>
          Tunç Bilişim, orta ölçekli e-ticaret ekipleri için gerçek zamanlı
          analitik dashboard'u sunar. Stoktan kampanyaya, hangi kararın işe
          yaradığını dakikalar içinde görün.
        </p>
        <div className="landing-cta-row">
          <button className="landing-cta" onClick={() => setChatOpen(true)}>
            Bize Ulaşın
          </button>
          <a href="#features" className="landing-cta-ghost">Neler yapabilirsiniz →</a>
        </div>
      </section>

      <section className="landing-stats">
        {STATS.map((s) => (
          <div className="landing-stat" key={s.label}>
            <div className="landing-stat-value">{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="landing-features" id="features">
        <span className="landing-eyebrow landing-eyebrow-center">Neler yapabilirsiniz</span>
        <h2>Tek dashboard, üç soruya cevap</h2>
        <div className="landing-feature-grid">
          {FEATURES.map((f, i) => (
            <div className="landing-feature-card" key={f.title}>
              <span className="landing-feature-number">{String(i + 1).padStart(2, '0')}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-logo landing-logo-footer">TUNÇ BİLİŞİM</div>
        <p>© 2026 Tunç Bilişim. Tüm hakları saklıdır.</p>
      </footer>

      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}

      {!chatOpen && (
        <button
          className="chat-launcher"
          onClick={() => setChatOpen(true)}
          aria-label="Sohbeti aç"
        >
          💬
        </button>
      )}
    </div>
  );
}