import React from 'react'
import ReactDOM from 'react-dom/client'
import { EditorPage } from './editorPage';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <EditorPage />
  </React.StrictMode>
);