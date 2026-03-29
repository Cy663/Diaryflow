import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DiaryViewer from './pages/DiaryViewer';
import Create from './pages/Create';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diary" element={<DiaryViewer />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
