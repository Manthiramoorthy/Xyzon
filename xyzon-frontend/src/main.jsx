import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
// Bootstrap's JS (includes Popper) is required to enable components that use data-bs-* attributes
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import AppRouter from './router.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
