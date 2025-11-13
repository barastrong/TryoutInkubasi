import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, CheckCircle, Clock } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const QUESTIONS_PER_PAGE = 10;

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const startTest = async () => {
    if (!username.trim()) return;
    setAiError(null);
    setIsProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/register_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const userData = await res.json();
      setUserId(userData.user_id);
      localStorage.setItem('username', username);

      const qRes = await fetch(`${API_BASE_URL}/get_questions.php`);
      const questionsData = await qRes.json();
      setQuestions(questionsData);
      setStarted(true);
      setShowNamePopup(false);
    } catch (error) {
      console.error("Error starting test:", error);
      setAiError("Gagal memulai ujian. Pastikan server backend berjalan.");
    } finally {
      setIsProcessing(false);
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
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/process_quiz.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          answers: answers
        })
      });
      const data = await response.json();

      if (data.status === 'success') {
        if (data.message && data.message.includes('data default')) {
          setAiError("Kendala teknis AI: " + data.message);
        } else {
          setAiError(null);
        }
        localStorage.removeItem('username');
      } else {
        const errorMessage = data.message || "Terjadi kesalahan yang tidak diketahui saat memproses jawaban Anda. Silakan coba lagi.";
        console.error("Error from backend processing:", errorMessage);
        setAiError(errorMessage);
      }

    } catch (error) {
      console.error("Error submitting answers or processing quiz:", error);
      const  errorMessage = "Terjadi kesalahan koneksi atau server saat mengirim jawaban. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.";
      setAiError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Sistem Ujian Online
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Temukan tipe kepribadian Anda melalui serangkaian pertanyaan yang telah dirancang khusus
            </p>
            <button
              className="bg-red-600 text-white px-10 py-4 rounded-lg hover:bg-red-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => setShowNamePopup(true)}
            >
              Mulai Tes Kepribadian
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cepat & Akurat</h3>
              <p className="text-sm text-gray-600">Hasil analisis dalam hitungan menit</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Terpercaya</h3>
              <p className="text-sm text-gray-600">Berbasis penelitian psikologi</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Detail</h3>
              <p className="text-sm text-gray-600">Analisis mendalam tentang karakter Anda</p>
            </div>
          </div>
        </div>

        {showNamePopup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">Selamat Datang!</h2>
              <p className="text-gray-600 text-center mb-6">Masukkan nama lengkap Anda untuk memulai</p>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Contoh: Ahmad Zainuddin"
                className="border-2 border-gray-300 p-3 rounded-lg mb-6 w-full focus:outline-none focus:border-red-600 transition-colors"
                onKeyPress={e => e.key === 'Enter' && !isProcessing && username.trim() && startTest()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNamePopup(false)}
                  disabled={isProcessing}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  onClick={startTest}
                  disabled={!username.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Memproses...
                    </>
                  ) : (
                    'Mulai Ujian'
                  )}
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loader2 className="animate-spin h-12 w-12 text-red-600 mb-4" />
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
    <div className="min-h-screen bg-white py-6 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 mb-6 shadow-sm">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Tes Kepribadian</h2>
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                Halaman {currentPage + 1} dari {totalPages}
              </span>
            </div>
          </div>

          {aiError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-r-lg" role="alert">
              <div className="flex items-start">
                <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold mb-1">Peringatan!</p>
                  <p className="text-sm">{aiError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Progress Pengisian</span>
              <span>{answeredCount} dari {questions.length} soal</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-red-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">{Math.round(progressPercentage)}% selesai</p>
          </div>

          <div className="space-y-8">
            {currentQuestions.map((question, qIdx) => {
              const questionNumber = startIndex + qIdx + 1;
              const isAnswered = answers[question.question_id] !== undefined;
              
              return (
                <div key={question.question_id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="flex items-start mb-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 flex-shrink-0 font-semibold text-sm ${
                      isAnswered ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {questionNumber}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                      {question.question_text}
                    </h3>
                  </div>

                  <div className="space-y-3 ml-11">
                    {question.options.map((opt: Option, idx: number) => (
                      <label
                        key={opt.option_id}
                        className={`flex items-start space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                          answers[question.question_id] === opt.option_id
                            ? 'border-red-600 bg-red-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.question_id}`}
                          checked={answers[question.question_id] === opt.option_id}
                          onChange={() => handleSelect(question.question_id, opt.option_id)}
                          className="h-5 w-5 text-red-600 focus:ring-red-500 mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800 mr-2">{labels[idx]}.</span>
                          <span className="text-gray-700">{opt.option_text}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0 || isProcessing}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                currentPage === 0 || isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              ← Soal Sebelumnya
            </button>

            {!isLastPage ? (
              <button
                onClick={handleNext}
                disabled={isProcessing}
                className={`w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Soal Berikutnya →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isProcessing}
                className={`w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                {isProcessing ? 'Memproses Hasil...' : 'Kirim Jawaban ✓'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600 w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Periksa Kembali Jawaban</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Masih ada beberapa soal yang belum dijawab. Silakan pastikan semuanya terisi sebelum
              melanjutkan.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold w-full transition-colors"
            >
              Oke, Saya Periksa Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}