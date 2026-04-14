import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { UserRole } from 'shared/types/user';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ErrorAlert from '../components/ui/ErrorAlert';

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'teacher', label: 'Teacher', icon: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5', desc: 'Create diaries' },
  { value: 'family', label: 'Family', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25', desc: 'View diaries' },
  { value: 'student', label: 'Student', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', desc: 'View diaries' },
];

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-secondary-800 tracking-tight">DiaryFlow</h1>
          <p className="text-secondary-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your full name"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@school.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Min 6 characters"
          />

          {/* Role selector with icons */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl text-center transition-all border-2 ${
                    role === r.value
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-secondary-100 hover:border-secondary-200 bg-white'
                  }`}
                >
                  <svg className={`w-6 h-6 mb-1 ${role === r.value ? 'text-primary-600' : 'text-secondary-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
                  </svg>
                  <span className={`text-xs font-semibold ${role === r.value ? 'text-primary-700' : 'text-secondary-600'}`}>
                    {r.label}
                  </span>
                  <span className="text-[10px] text-secondary-400 mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {needsTeacher && (
            <Input
              label="Teacher's Email"
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              required
              placeholder="your.teacher@school.com"
              helperText="The email your teacher registered with"
            />
          )}

          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-secondary-500 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
