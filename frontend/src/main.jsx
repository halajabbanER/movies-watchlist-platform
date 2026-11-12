import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">React dynamic interface</p>
      <h1>Your movie watchlist</h1>
      <p className="intro">Search movies, save favorites, and manage your watchlist.</p>
      <button type="button" onClick={() => window.alert('TMDB search will be connected here.')}>Search movies</button>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
