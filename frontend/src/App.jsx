import { Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin" element={<Admin />} />
      <Route
        path="*"
        element={
          <div style={{ padding: 40, fontFamily: 'var(--font-body)' }}>
            Sayfa bulunamadı. <Link to="/">Ana sayfaya dön</Link>
          </div>
        }
      />
    </Routes>
  );
}
