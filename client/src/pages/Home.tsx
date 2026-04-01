import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-amber-800 mb-3">DiaryFlow</h1>
        <p className="text-amber-600 text-lg mb-8">
          A daily visual diary to help you and your child recall the day together
        </p>

        {/* Showcase card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
          <h2 className="text-amber-700 font-semibold text-lg mb-3">Showcase Demo</h2>
          <p className="text-amber-500 text-sm mb-5">
            See a pre-built diary for Alex's school day
          </p>
          <button
            onClick={() => navigate(`/diary?name=Alex&date=${today}`)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg"
          >
            View Demo Diary
          </button>
        </div>

        {/* GPS Diary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
          <h2 className="text-amber-700 font-semibold text-lg mb-2">GPS Diary</h2>
          <p className="text-amber-500 text-sm mb-4">
            Generate a diary from GPS coordinates alone — no photos needed
          </p>
          <button
            onClick={() => navigate('/gps-create')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg"
          >
            GPS &rarr; Diary
          </button>
        </div>

        {/* Create your own */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-amber-700 font-semibold text-lg mb-2">Create Your Own</h2>
          <p className="text-amber-500 text-sm mb-4">
            Upload a schedule and photos to generate a real diary
          </p>
          <button
            onClick={() => navigate('/create')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg"
          >
            Upload Photos &amp; Create
          </button>
        </div>

        <p className="text-amber-400 text-sm">
          Auto-generated from GPS tracks, class schedule, and photos
        </p>
      </div>
    </div>
  );
}

export default Home;
