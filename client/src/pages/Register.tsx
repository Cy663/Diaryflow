import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { UserRole } from 'shared/types/user';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsTeacher = role === 'student' || role === 'family';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await register({
        email,
        password,
        name,
        role,
        teacherEmail: needsTeacher ? teacherEmail : undefined,
      });
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <h1 className="text-4xl font-bold text-amber-800 text-center mb-2">DiaryFlow</h1>
        <p className="text-amber-600 text-center mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-amber-700 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-amber-700 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-amber-700 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-amber-700 text-sm font-medium mb-2">I am a...</label>
            <div className="flex gap-2">
              {(['teacher', 'family', 'student'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition capitalize ${
                    role === r
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {needsTeacher && (
            <div>
              <label className="block text-amber-700 text-sm font-medium mb-1">Teacher's Email</label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                required
                placeholder="your.teacher@school.com"
                className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-amber-400 text-xs mt-1">The email your teacher registered with</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-amber-600 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
