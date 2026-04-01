import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DiaryViewer from './pages/DiaryViewer';
import Create from './pages/Create';
import GpsCreate from './pages/GpsCreate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diary" element={<DiaryViewer />} />
        <Route path="/create" element={<Create />} />
        <Route path="/gps-create" element={<GpsCreate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
