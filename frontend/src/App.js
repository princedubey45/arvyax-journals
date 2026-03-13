import React, { useState, useEffect } from 'react';

const API = 'https://arvyax-journal-1-2oap.onrender.com/api/journal';
const DEFAULT_USER = 'user_123';

function App() {
  const [userId] = useState(DEFAULT_USER);
  const [ambience, setAmbience] = useState('forest');
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchEntries(); fetchInsights(); }, []);

 async function fetchEntries() {
  try {
    const res = await fetch(`${API}/${userId}`);
    const data = await res.json();

    // ensure entries is always an array
    if (Array.isArray(data)) {
      setEntries(data);
    } else {
      console.error("API returned non-array:", data);
      setEntries([]);
    }
  } catch (err) {
    console.error("Fetch entries error:", err);
    setEntries([]);
  }
}

  async function fetchInsights() {
    try {
      const res = await fetch(`${API}/insights/${userId}`);
      const data = await res.json();
      setInsights(data);
    } catch (err) {
      console.error("Fetch insights error:", err);
      setInsights(null);
    }
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ambience, text })
      });
      if (res.ok) {
        setText('');
        setMsg('Entry saved!');
        await fetchEntries();
        await fetchInsights();
      }
    } catch {
      setMsg('Error saving entry.');
    }
    setLoading(false);
  }

  async function handleAnalyze(entryId) {
    setAnalyzing(entryId);
    try {
      await fetch(`${API}/${entryId}/analyze`, { method: 'POST' });
      await fetchEntries();
      await fetchInsights();
    } catch {
      alert('Analysis failed.');
    }
    setAnalyzing(null);
  }

  const styles = {
    container: { maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'sans-serif', background: '#f0f4f0', minHeight: '100vh' },
    card: { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    h1: { color: '#2d6a4f', margin: 0 },
    h2: { color: '#40916c', marginTop: 0 },
    label: { display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#333' },
    select: { width: '100%', padding: 8, marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' },
    textarea: { width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' },
    btn: { background: '#40916c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', marginRight: 8 },
    btnSmall: { background: '#52b788', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
    tag: { display: 'inline-block', background: '#d8f3dc', color: '#2d6a4f', borderRadius: 12, padding: '2px 10px', marginRight: 6, fontSize: 13 },
    entry: { borderLeft: '4px solid #52b788', paddingLeft: 12, marginBottom: 16 },
    insights: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    insightBox: { background: '#d8f3dc', borderRadius: 6, padding: 12, textAlign: 'center' },
    insightVal: { fontSize: 22, fontWeight: 'bold', color: '#2d6a4f' },
    insightLabel: { fontSize: 13, color: '#52b788' },
    msg: { color: '#40916c', marginTop: 8 }
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={styles.h1}>🌿 ArvyaX Journal</h1>
        <span style={{ color: '#888', fontSize: 14 }}>User: {userId}</span>
      </div>

      {/* Write Entry */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Write Journal Entry</h2>
        <label style={styles.label}>Ambience</label>
        <select style={styles.select} value={ambience} onChange={e => setAmbience(e.target.value)}>
          <option value="forest">🌲 Forest</option>
          <option value="ocean">🌊 Ocean</option>
          <option value="mountain">🏔️ Mountain</option>
        </select>
        <label style={styles.label}>Your Thoughts</label>
        <textarea
          style={styles.textarea}
          rows={4}
          placeholder="How did you feel during your session?"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
          {msg && <span style={styles.msg}>{msg}</span>}
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div style={styles.card}>
          <h2 style={styles.h2}>📊 Insights</h2>
          <div style={styles.insights}>
            <div style={styles.insightBox}>
              <div style={styles.insightVal}>{insights?.totalEntries || 0}</div>
              <div style={styles.insightLabel}>Total Entries</div>
            </div>
            <div style={styles.insightBox}>
              <div style={styles.insightVal}>{insights.topEmotion || '—'}</div>
              <div style={styles.insightLabel}>Top Emotion</div>
            </div>
            <div style={styles.insightBox}>
              <div style={styles.insightVal}>{insights.mostUsedAmbience || '—'}</div>
              <div style={styles.insightLabel}>Favourite Ambience</div>
            </div>
            <div style={{ ...styles.insightBox, gridColumn: '1 / -1', textAlign: 'left' }}>
              <div style={styles.insightLabel}>Recent Keywords</div>
              <div style={{ marginTop: 6 }}>
                {(insights?.recentKeywords || []).length > 0
          ? (insights?.recentKeywords || []).map(k => (
          <span key={k} style={styles.tag}>{k}</span>
    ))
  : <span style={{ color: '#aaa' }}>No keywords yet</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      <div style={styles.card}>
        <h2 style={styles.h2}>📖 Previous Entries</h2>
        {entries.length === 0 && <p style={{ color: '#888' }}>No entries yet. Write your first one above!</p>}
        {Array.isArray(entries) && entries.map(entry => (
          <div key={entry.id} style={styles.entry}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ textTransform: 'capitalize' }}>
                  {entry.ambience === 'forest' ? '🌲' : entry.ambience === 'ocean' ? '🌊' : '🏔️'} {entry.ambience}
                </strong>
                <span style={{ color: '#aaa', fontSize: 12, marginLeft: 8 }}>
                  {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                </span>
              </div>
              <button
                style={styles.btnSmall}
                onClick={() => handleAnalyze(entry.id)}
                disabled={analyzing === entry.id}
              >
                {analyzing === entry.id ? 'Analyzing...' : '🔍 Analyze'}
              </button>
            </div>
            <p style={{ margin: '8px 0', color: '#333' }}>{entry.text}</p>
            {entry.emotion && (
              <div style={{ marginTop: 6 }}>
                <span style={styles.tag}>😊 {entry.emotion}</span>
                {(entry.keywords || []).map(k => (
                <span key={k} style={styles.tag}>{k}</span>
                ))}
                {entry.summary && <p style={{ color: '#555', fontSize: 13, margin: '6px 0 0' }}><em>{entry.summary}</em></p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
