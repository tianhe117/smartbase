import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Manage from './pages/Manage'
import Learn from './pages/Learn'
import Review from './pages/Review'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/learn/:volumeId" element={<Learn />} />
          <Route path="/review/:volumeId" element={<Review />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
