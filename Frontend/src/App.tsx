import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import ResultPage from './pages/ResultPage';

function App() {
  const [userId, setUserId] = useState<number | null>(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage userId={userId} setUserId={setUserId} />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}
export default App;