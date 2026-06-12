'use client'
// app/anime/[slug]/episodio-[number]/loading.tsx
export default function EpisodePlayerLoading() {
  return (
    <div className="loading-player">
      <div className="loading-player-layout">
        {/* Zona del reproductor */}
        <div className="loading-player-main">
          {/* Video skeleton */}
          <div className="skeleton loading-video" />
          {/* Info skeleton */}
          <div className="loading-info">
            <div className="skeleton loading-info-title" />
            <div className="skeleton loading-info-sub" />
          </div>
          {/* Nav skeleton */}
          <div className="loading-nav">
            <div className="skeleton loading-nav-btn" />
            <div className="skeleton loading-nav-btn" />
          </div>
        </div>
        {/* Chat skeleton */}
        <div className="loading-chat">
          <div className="loading-chat-header">
            <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
          </div>
          <div className="loading-chat-msgs">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="loading-chat-msg">
                <div className="skeleton loading-chat-avatar" />
                <div className="loading-chat-content">
                  <div className="skeleton" style={{ height: 11, width: 70, borderRadius: 3 }} />
                  <div className="skeleton" style={{ height: 13, width: '90%', borderRadius: 3, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .loading-player { height: calc(100vh - var(--total-nav)); overflow: hidden; }
        .loading-player-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          height: 100%;
        }
        .loading-player-main {
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .loading-video {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 0;
        }
        .loading-info {
          padding: 0 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .loading-info-title { height: 20px; width: 60%; border-radius: 5px; }
        .loading-info-sub   { height: 14px; width: 35%; border-radius: 4px; }
        .loading-nav {
          padding: 0 1.25rem;
          display: flex;
          gap: 0.75rem;
        }
        .loading-nav-btn { height: 36px; width: 100px; border-radius: 8px; }
        .loading-chat {
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        .loading-chat-header {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .loading-chat-msgs {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .loading-chat-msg { display: flex; gap: 0.5rem; }
        .loading-chat-avatar { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
        .loading-chat-content { flex: 1; }
        @media (max-width: 900px) {
          .loading-player-layout { grid-template-columns: 1fr; }
          .loading-chat { display: none; }
        }
      `}</style>
    </div>
  )
}
