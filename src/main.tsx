import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// DEV分岐の動的importは本番ビルド時に除去される。通常画面からはリンクしない。
const editorPath = import.meta.env.BASE_URL + 'range-editor'
const Editor = import.meta.env.DEV && window.location.pathname.replace(/\/$/, '') === editorPath
  ? lazy(() => import('./dev/ReferenceRangeEditor'))
  : null

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {Editor ? <Suspense fallback={<p>作成画面を読み込み中…</p>}><Editor /></Suspense> : <App />}
  </React.StrictMode>,
)
