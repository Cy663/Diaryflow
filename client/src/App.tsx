import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DiaryViewer from './pages/DiaryViewer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diary" element={<DiaryViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
