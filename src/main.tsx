import React, { lazy, Suspense, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// DEV分岐の動的importは本番ビルド時に除去される。通常画面からはリンクしない。
const editorPath = import.meta.env.BASE_URL + 'range-editor'
const Editor = import.meta.env.DEV && window.location.pathname.replace(/\/$/, '') === editorPath
  ? lazy(() => import('./dev/ReferenceRangeEditor'))
  : null

const Trainer = lazy(() => import('./trainer/Trainer'))
function Router() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const change = () => setHash(window.location.hash)
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  if (Editor) return <Suspense fallback={<p>作成画面を読み込み中…</p>}><Editor /></Suspense>
  return <><div hidden={hash === '#/trainer'}><App /></div>{hash === '#/trainer' && <Suspense fallback={<p>Trainerを読み込み中…</p>}><Trainer /></Suspense>}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
