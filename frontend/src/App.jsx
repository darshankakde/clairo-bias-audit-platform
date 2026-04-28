import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import UploadScreen from './pages/UploadScreen';
import ConfirmScreen from './pages/ConfirmScreen';
import DashboardScreen from './pages/DashboardScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/confirm/:datasetId" element={<ConfirmScreen />} />
          <Route path="/results/:auditId" element={<DashboardScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
