import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3005';

// Only a display order. Any category the API returns that is not listed here still gets
// its own column, appended at the end. That is what keeps "add a category, change no
// other file" honest.
const COLUMN_ORDER = ['debt', 'billing', 'payment', 'unknown'];

export default function App() {
  const [state, setState] = useState({ status: 'idle' });
  const [open, setOpen] = useState(null);
  const [samples, setSamples] = useState(null);
  const [showSamples, setShowSamples] = useState(false);
  const [query, setQuery] = useState('');

  // Shows the raw pile on its own, so you can read exactly what was sent to the API
  // before anything classified it. Input and output side by side is how you check the
  // machine rather than trust it.
  async function toggleSamples() {
    try {
      if (!samples) {
        const raw = await fetch(`${API}/api/samples`).then((r) => r.json());
        setSamples(raw.emails);
      }
      setShowSamples((v) => !v);
    } catch (error) {
      setState({ status: 'error', message: `${error.message}` });
    }
  }

  async function seed() {
    setState({ status: 'loading' });
    try {
      // Step 1: fetch the raw, unclassified pile, exactly as it would land in a mailbox.
      const raw = await fetch(`${API}/api/samples`).then((r) => r.json());
      // Step 2: send that raw pile to the classifier. Nothing is pre-labelled.
      const res = await fetch(`${API}/api/classify/batch`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ emails: raw.emails }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      const data = await res.json();
      const bySubject = Object.fromEntries(raw.emails.map((e) => [e.emailId, e]));
      setState({ status: 'done', data, raw: bySubject });
    } catch (error) {
      setState({ status: 'error', message: `${error.message}` });
    }
  }

  // One matcher for both views. Searches everything an agent might remember about an
  // email: its id, the verdict, the explanation, the evidence, and the raw text itself.
  const q = query.trim().toLowerCase();
  function matches(result, raw) {
    if (!q) return true;
    return [
      result?.emailId,
      result?.category,
      result?.description,
      ...(result?.keywords ?? []),
      raw?.subject,
      raw?.body,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
  }

  const data = state.data;
  const categories = data
    ? [
        ...COLUMN_ORDER.filter((c) => data.summary[c]),
        ...Object.keys(data.summary).filter((c) => !COLUMN_ORDER.includes(c)),
      ]
    : [];

  return (
    <main>
      <header>
        <div>
          <h1>Customer email triage</h1>
          <p className="sub">
            First pass over the overnight mailbox. Sorts the queue for an agent. It never
            contacts a customer and never changes an account.
          </p>
        </div>
        <div className="actions">
          <input
            className="search"
            type="search"
            placeholder="Search id, category, keyword or text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="ghost" onClick={toggleSamples}>
            {showSamples ? 'Hide seed samples' : 'Show seed samples'}
          </button>
          <button onClick={seed} disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Classifying...' : 'Seed sample emails'}
          </button>
        </div>
      </header>

      {showSamples && samples && (
        <section className="samples">
          <div className="samples-head">
            <h2>Raw seed data</h2>
            <p>
              {samples.length} emails exactly as they are sent to the API. Nothing here is
              labelled, and the classifier sees only the body text. Verdicts appear in the
              right hand column once you have clicked Seed sample emails.
            </p>
          </div>
          <div className="samples-scroll">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Body sent to the API</th>
                <th>What came back</th>
              </tr>
            </thead>
            <tbody>
              {samples
                .filter((e) => matches(state.data?.results.find((x) => x.emailId === e.emailId), e))
                .map((e) => {
                const r = state.data?.results.find((x) => x.emailId === e.emailId);
                return (
                  <tr key={e.emailId}>
                    <td>
                      <span className="id">{e.emailId}</span>
                      <span className="subject-cell">{e.subject}</span>
                    </td>
                    <td className="body-cell">{e.body}</td>
                    <td className="verdict-cell">
                      {r ? (
                        <>
                          <span className={`pill ${r.category}`}>{r.category}</span>
                          {r.vulnerability && <span className="badge">POSSIBLE - REVIEW</span>}
                          <span className="kw">{r.keywords.join(' | ') || 'no signals found'}</span>
                        </>
                      ) : (
                        <span className="kw">not classified yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {state.status === 'idle' && !showSamples && (
        <p className="empty">
          Click <strong>Seed sample emails</strong>. The dashboard pulls 14 raw, unlabelled
          emails from the API, posts them straight back to the classifier, and shows only
          what came back.
        </p>
      )}

      {state.status === 'error' && <p className="error">{state.message}</p>}

      {data && (
        <>
          <section className="tiles">
            {categories.map((c) => (
              <div key={c} className={`tile ${c}`}>
                <span className="count">{data.summary[c]}</span>
                <span className="label">{c}</span>
              </div>
            ))}
            <div className="tile review">
              <span className="count">{data.flaggedForReview}</span>
              <span className="label">flagged for review</span>
            </div>
          </section>

          {q && (
            <p className="match-count">
              Showing{' '}
              {data.results.filter((r) => matches(r, state.raw[r.emailId])).length} of{' '}
              {data.results.length} emails matching "{query}"
            </p>
          )}

          <section className="board">
            {categories.map((category) => (
              <div className="column" key={category}>
                <h2>
                  {category} <span>{data.summary[category]}</span>
                </h2>
                {data.results
                  .filter((r) => r.category === category && matches(r, state.raw[r.emailId]))
                  // Anything a human should see sooner floats to the top of its column.
                  .sort((a, b) => Number(b.vulnerability) - Number(a.vulnerability))
                  .map((r) => (
                    <article
                      key={r.emailId}
                      className={`card ${r.vulnerability ? 'flagged' : ''}`}
                      onClick={() => setOpen(open === r.emailId ? null : r.emailId)}
                    >
                      <div className="card-top">
                        <span className="id">{r.emailId}</span>
                        {r.vulnerability && <span className="badge">POSSIBLE - REVIEW</span>}
                      </div>
                      <p className="subject">{state.raw[r.emailId]?.subject}</p>
                      <p className="desc">{r.description}</p>
                      <div className="chips">
                        {r.keywords.length ? (
                          r.keywords.map((k) => (
                            <span className="chip" key={k}>
                              {k}
                            </span>
                          ))
                        ) : (
                          <span className="chip muted">no signals found</span>
                        )}
                      </div>
                      {open === r.emailId && (
                        <div className="raw">
                          <strong>What the customer actually wrote</strong>
                          <p>{state.raw[r.emailId]?.body}</p>
                          <strong>Why it landed here</strong>
                          <ul>
                            {r.signals.length ? (
                              r.signals.map((s) => (
                                <li key={s.id}>
                                  {s.says} <em>"{s.matched}"</em>{' '}
                                  <span className="w">{s.weight >= 0 ? `+${s.weight}` : s.weight}</span>
                                </li>
                              ))
                            ) : (
                              <li>Nothing matched, so we did not guess.</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
              </div>
            ))}
          </section>
        </>
      )}

      <footer>
        Assistive triage only. A review flag means this email contains language worth a
        human look, not that the customer has been assessed as vulnerable. No automated
        action is taken from this screen.
      </footer>
    </main>
  );
}
