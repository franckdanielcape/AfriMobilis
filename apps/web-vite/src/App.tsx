import { Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  )
}

export default App
