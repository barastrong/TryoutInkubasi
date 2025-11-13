import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react'; // Import Loader2 icon for loading state

const API_BASE_URL = 'http://localhost/inkubasi/backend';

interface HomepageProps {
  userId: number | null;
  setUserId: (id: number | null) => void;
}

interface Option {
  option_id: number;
  option_text: string;
  is_correct?: boolean;
}

interface Question {
  question_id: number;
  question_text: string;
  options: Option[];
}

export default function Homepage({ userId, setUserId }: HomepageProps) {
  const [username, setUsername] = useState('');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // New state for processing
  const navigate = useNavigate();

  const QUESTIONS_PER_PAGE = 10;

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const startTest = async () => {
    if (!username.trim()) return;
    try {
      const res = await axios.post<{ user_id: number }>(`${API_BASE_URL}/register_user.php`, { username });
      setUserId(res.data.user_id);
      localStorage.setItem('username', username);

      const qRes = await axios.get<Question[]>(`${API_BASE_URL}/get_questions.php`);
      setQuestions(qRes.data);
      setStarted(true);
      setShowNamePopup(false);
      setAiError(null);
    } catch (error) {
      console.error("Error starting test:", error);
      setAiError("Gagal memulai ujian. Pastikan server backend berjalan.");
    }
  };

  const handleSelect = (questionId: number, optionId: number) => {
    setAnswers(prevAnswers => ({ ...prevAnswers, [questionId]: optionId }));
  };

  const handleNext = () => {
    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = async () => {
    const unanswered = questions.filter(q => answers[q.question_id] === undefined);
    if (unanswered.length > 0) {
      setShowPopup(true);
      return;
    }

    if (userId === null) {
      console.error("User ID is null, cannot finish test.");
      setAiError("Sesi pengguna tidak ditemukan. Silakan mulai ulang ujian.");
      return;
    }

    setAiError(null);
    setIsProcessing(true); // Start processing

    try {
      const response = await axios.post(`${API_BASE_URL}/process_quiz.php`, {
        user_id: userId,
        answers: answers
      });

      // Based on the modified PHP, response.data.status will be 'success' if DB save worked,
      // and 'error' if DB save failed. The message will clarify if AI failed.

      if (response.data.status === 'success') {
        // If the database save was successful, navigate to result page.
        // The message will indicate if actual AI data or default was saved.
        // We can optionally show a toast/notification based on response.data.message here.
        if (response.data.message && response.data.message.includes('data default')) {
          // If default data was used, you might want to show a more prominent warning.
          setAiError("Kendala teknis AI: " + response.data.message);
        } else {
          // Clear any previous AI errors if successful with real AI data
          setAiError(null);
        }
        navigate('/result', { state: { userId } });
        localStorage.removeItem('username');
      } else {
        // If status is 'error', it means database save failed.
        // Display the error message from the backend.
        const errorMessage = response.data.message || "Terjadi kesalahan yang tidak diketahui saat memproses jawaban Anda. Silakan coba lagi.";
        console.error("Error from backend processing:", errorMessage);
        setAiError(errorMessage);
        // Do not navigate, keep user on the page to see the error.
      }

    } catch (error) {
      console.error("Error submitting answers or processing quiz:", error);
      let errorMessage = "Terjadi kesalahan koneksi atau server saat mengirim jawaban. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.";

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 503) {
          errorMessage = "Layanan backend atau AI sedang kelebihan beban. Mohon coba lagi beberapa saat.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = `Permintaan gagal: ${error.message}`;
        }
      }
      setAiError(errorMessage);
      // Do not navigate, keep user on the page to see the error.
    } finally {
      setIsProcessing(false); // End processing
    }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Sistem Ujian Online</h1>
          <button
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold"
            onClick={() => setShowNamePopup(true)}
          >
            Mulai Tes Kepribadian
          </button>
        </div>

        {showNamePopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6 text-red-600 text-center">Masukkan Nama Anda</h2>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nama Lengkap"
                className="border border-gray-300 p-3 rounded-lg mb-6 w-full focus:outline-none focus:ring-2 focus:ring-red-600"
                onKeyPress={e => e.key === 'Enter' && startTest()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNamePopup(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={startTest}
                  disabled={!username.trim()}
                >
                  Mulai Ujian
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-xl text-gray-600">Memuat soal...</p>
      </div>
    );
  }

  const labels = ['A', 'B', 'C', 'D', 'E'];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8 mb-6">

          {aiError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-center" role="alert">
              <AlertTriangle className="mr-3 flex-shrink-0" />
              <div>
                <p className="font-bold">Peringatan!</p>
                <p>{aiError}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span></span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-8">
            {currentQuestions.map((question, qIdx) => {
              const questionNumber = startIndex + qIdx + 1;
              return (
                <div key={question.question_id} className="border-b pb-6 last:border-b-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {questionNumber}. {question.question_text}
                  </h3>

                  <div className="space-y-3">
                    {question.options.map((opt: Option, idx: number) => (
                      <label
                        key={opt.option_id}
                        className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition ${
                          answers[question.question_id] === opt.option_id
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.question_id}`}
                          checked={answers[question.question_id] === opt.option_id}
                          onChange={() => handleSelect(question.question_id, opt.option_id)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="font-semibold text-gray-700">{labels[idx]}.</span>
                        <span className="text-gray-800">{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0 || isProcessing}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                currentPage === 0 || isProcessing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Soal Sebelumnya
            </button>

            {!isLastPage ? (
              <button
                onClick={handleNext}
                disabled={isProcessing}
                className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Soal Berikutnya
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isProcessing}
                className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                {isProcessing ? 'Memproses...' : 'Kirim Jawaban'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="text-red-600 w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-red-600">Periksa Kembali Jawabanmu</h2>
            <p className="text-gray-700 mb-6">
              Masih ada beberapa soal yang belum dijawab. Silakan pastikan semuanya terisi sebelum
              melanjutkan.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold"
            >
              Oke, saya periksa lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}