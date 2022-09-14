import React from 'react'
import ReactDOM from 'react-dom/client'
import { MainGamePage } from './reactComponents/mainGamePage';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <MainGamePage />
  </React.StrictMode>
);