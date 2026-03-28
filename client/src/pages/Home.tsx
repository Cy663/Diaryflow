import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [childName, setChildName] = useState('Alex');
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const handleGenerate = () => {
    navigate(`/diary?name=${encodeURIComponent(childName)}&date=${today}`);
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-amber-800 mb-3">DiaryFlow</h1>
        <p className="text-amber-600 text-lg mb-8">
          A daily visual diary to help you and your child recall the day together
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <label className="block text-left text-amber-700 text-sm font-medium mb-2">
            Child's Name
          </label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-lg text-center"
            placeholder="Enter name"
          />

          <button
            onClick={handleGenerate}
            disabled={!childName.trim()}
            className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white text-xl font-semibold py-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-amber-500"
          >
            Generate Today's Diary
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
