import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Models from './pages/Models'

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/models" element={<Models />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
