import React from 'react'
import ReactDOM from 'react-dom/client'
import { EditorPage } from './editorPage'
import { WaitForRequest } from './widgets/waitForRequest'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <WaitForRequest url={'/api/v1/'}>
      <EditorPage />
    </WaitForRequest>
  </React.StrictMode>,
)
