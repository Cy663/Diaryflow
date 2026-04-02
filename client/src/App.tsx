import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherCreate from './pages/teacher/TeacherCreate';
import TeacherDiary from './pages/teacher/TeacherDiary';
import StudentHome from './pages/student/StudentHome';
import StudentDiary from './pages/student/StudentDiary';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role redirect */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleRedirect />} />
          </Route>

          {/* Teacher routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherHome />} />
            <Route path="/teacher/create" element={<TeacherCreate />} />
            <Route path="/teacher/diary/:date" element={<TeacherDiary />} />
          </Route>

          {/* Student/Family routes */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'family']} />}>
            <Route path="/student" element={<StudentHome />} />
            <Route path="/student/diary/:date" element={<StudentDiary />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
