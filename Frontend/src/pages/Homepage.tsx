import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Clock, Target, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://192.168.101.181:5000';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'link';
  children: React.ReactNode;
}

const Button: React.FC<CustomButtonProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  let variantClasses = "";
  if (variant === 'default') {
    variantClasses = "bg-[#FF006B] text-white hover:bg-[#E6005F] shadow-lg hover:shadow-xl focus-visible:ring-[#FF006B]";
  } else if (variant === 'outline') {
    variantClasses = "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-400";
  } else if (variant === 'link') {
    variantClasses = "text-red-700 hover:text-red-900 underline h-auto p-0 focus-visible:ring-red-700";
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CustomCardProps> = ({ className, children, ...props }) => {
  const baseClasses = "rounded-xl"; 
  return (
    <div
      className={`${baseClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

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

interface FormattedAnswerForAI {
  question_text: string;
  chosen_option_text: string;
}

export default function Homepage({ userId, setUserId }: HomepageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<'registering' | 'generating_questions' | 'submitting_answers' | null>(null);

  const QUESTIONS_PER_PAGE = 10;

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const startTest = async () => {
    if (!username.trim()) {
      setErrorMessage("Nama pengguna tidak boleh kosong.");
      return;
    }
    setErrorMessage(null); 
    setIsProcessing(true);
    setProcessingStage('registering');
    
    try {
      const res = await fetch(`${API_BASE_URL}/register_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
  if (!res.ok) {
    let errorData = null;

    try {
      errorData = await res.json();
    } catch {
      throw new Error(
        `Gagal registrasi pengguna: Status HTTP ${res.status}. Response bukan JSON`
      );
    }

    const msg = errorData?.message || `Gagal registrasi pengguna: Status HTTP ${res.status}`;
    throw new Error(msg);
  }

      const userData = await res.json();
      setUserId(userData.user_id);
      localStorage.setItem('username', username);

      setProcessingStage('generating_questions');
      const qRes = await fetch(`${API_BASE_URL}/generate_questions_ai`);
      
    if (!qRes.ok) {
      let errorData = null;

      try {
        errorData = await qRes.json();
      } catch {
        throw new Error(
          `Gagal mengambil soal dari AI: Status HTTP ${qRes.status}. Server response bukan JSON.`
        );
      }

      const message =
        errorData?.message ||
        `Gagal mengambil soal dari AI: Status HTTP ${qRes.status}`;

      throw new Error(message);
    }

      const questionsData = await qRes.json();
      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        throw new Error("AI tidak menghasilkan soal atau formatnya tidak sesuai.");
      }
      setQuestions(questionsData);
      setStarted(true);
      setShowNamePopup(false);

    } catch (error) {
      console.error("Error starting test:", error);
      setErrorMessage(`Gagal memulai ujian: ${(error as Error).message || "Kesalahan jaringan atau server."}.`);
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
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
      setErrorMessage("Sesi pengguna tidak ditemukan. Silakan mulai ulang ujian.");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStage('submitting_answers');

    try {
      const answersForAI: FormattedAnswerForAI[] = questions.map(q => {
        const chosenOptionId = answers[q.question_id];
        const chosenOption = q.options.find(opt => opt.option_id === chosenOptionId);
        return {
          question_text: q.question_text,
          chosen_option_text: chosenOption ? chosenOption.option_text : "Tidak dipilih"
        };
      });

      const response = await fetch(`${API_BASE_URL}/submit_answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          username: username,
          answers_for_ai: answersForAI
        })
      });
      
    if (!response.ok) {
      let errorData = null;

      try {
        errorData = await response.json();
      } catch{
        throw new Error(
          `Gagal memproses jawaban: Status HTTP ${response.status}. Server response bukan JSON.`
        );
      }

      const message =
        errorData?.message ||
        `Gagal memproses jawaban: Status HTTP ${response.status}`;

      throw new Error(message);
    }

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.removeItem('username');
        setUserId(null); 
        setQuestions([]); 
        setAnswers({}); 
        setStarted(false); 
        navigate('/result', { state: { userId: userId } });
      } else {
        const msg = data.message || "Terjadi kesalahan yang tidak diketahui saat memproses jawaban Anda. Silakan coba lagi.";
        console.error("Error from backend processing:", msg);
        setErrorMessage(msg);
        navigate('/result', { state: { userId: userId, aiErrorMessage: msg } });
      }

    } catch (error) {
      console.error("Error submitting answers or processing quiz:", error);
      const msg = `Terjadi kesalahan koneksi atau server saat mengirim jawaban: ${(error as Error).message || "Kesalahan jaringan."}`;
      setErrorMessage(msg);
      navigate('/result', { state: { userId: userId, aiErrorMessage: msg } });
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'registering':
        return 'Loading....';
      case 'generating_questions':
        return 'Loading...';
      case 'submitting_answers':
        return 'Loading....';
      default:
        return 'Loading....';
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <section 
          className="relative bg-[#3D0E61] py-20 md:py-32 w-full px-4 sm:px-6 lg:px-8"
          style={{ 
            backgroundImage: `linear-gradient(rgba(61, 14, 97, 0.85), rgba(61, 14, 97, 0.85)), url('https://images.unsplash.com/photo-1758599543378-ba892b220c89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJlZXJzJTIwYnVzaW5lc3MlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYzMDM3MzMxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-5xl mx-auto text-center relative z-10 rounded-2xl shadow-xl overflow-hidden">
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6">
              Recognize
            </h1>
            <p className="text-[#FFF0F5] text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              Temukan potensi diri Anda dengan analisis kepribadian berbasis AI yang mendalam.
            </p>
            <Button 
              className="px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl font-semibold transition-all duration-200 transform hover:scale-105"
              onClick={() => { setShowNamePopup(true); setErrorMessage(null); }}
            >
              Mulai Tes Kepribadian
            </Button>
          </div>
        </section>

        <section id="features" className="py-16 md:py-20 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-[#3D0E61] text-3xl md:text-4xl font-bold mb-4">
                Bagaimana Recognize Bekerja
              </h2>
              <p className="text-[#3D0E61] opacity-80 text-md md:text-lg max-w-2xl mx-auto">
                Pendekatan komprehensif kami menggabungkan kerangka kerja psikologis yang terbukti dengan AI mutakhir untuk memberikan wawasan yang akurat dan personal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Card className="p-6 md:p-8 bg-white border border-[#FF006B]/20 hover:border-[#FF006B] transition-all hover:shadow-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#FF006B]/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-[#FF006B]" />
                </div>
                <h3 className="text-[#3D0E61] text-xl font-semibold mb-2 text-center">Cepat & Akurat</h3>
                <p className="text-[#3D0E61] opacity-70 text-sm md:text-base text-center">
                  Selesaikan asesmen psikologi pribadi Anda hanya dalam 15-20 menit dengan pertanyaan yang divalidasi secara ilmiah.
                </p>
              </Card>

              <Card className="p-6 md:p-8 bg-white border border-[#FF006B]/20 hover:border-[#FF006B] transition-all hover:shadow-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#FF006B]/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-[#FF006B]" />
                </div>
                <h3 className="text-[#3D0E61] text-xl font-semibold mb-2 text-center">Analisis Bertenaga AI</h3>
                <p className="text-[#3D0E61] opacity-70 text-sm md:text-base text-center">
                  AI canggih kami menganalisis jawaban Anda menggunakan model psikologis yang telah ditetapkan untuk memberikan wawasan mendalam.
                </p>
              </Card>

              <Card className="p-6 md:p-8 bg-white border border-[#FF006B]/20 hover:border-[#FF006B] transition-all hover:shadow-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#FF006B]/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-[#FF006B]" />
                </div>
                <h3 className="text-[#3D0E61] text-xl font-semibold mb-2 text-center">Hasil Mendetail</h3>
                <p className="text-[#3D0E61] opacity-70 text-sm md:text-base text-center">
                  Dapatkan laporan komprehensif dengan wawasan yang dapat ditindaklanjuti yang disesuaikan dengan profil kepribadian unik Anda.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {showNamePopup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="p-8 rounded-2xl shadow-2xl max-w-md w-full bg-white border-none">
              <h2 className="text-2xl font-bold mb-2 text-[#3D0E61] text-center">Selamat Datang!</h2>
              <p className="text-gray-600 text-center mb-6">Masukkan nama lengkap Anda untuk memulai</p>
              
              {errorMessage && ( 
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-3 mb-4 rounded-r-lg text-sm" role="alert">
                  <div className="flex items-center">
                    <AlertTriangle className="mr-2 flex-shrink-0" size={18} />
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Contoh: Ahmad Zainuddin"
                className="border-2 border-gray-300 p-3 rounded-lg mb-6 w-full focus:outline-none focus:border-[#FF006B] transition-colors"
                onKeyPress={e => e.key === 'Enter' && !isProcessing && username.trim() && startTest()}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowNamePopup(false)}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 px-6 py-3 font-semibold disabled:opacity-50"
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 px-6 py-3 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  onClick={startTest}
                  disabled={!username.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      {getProcessingMessage()}
                    </>
                  ) : (
                    'Mulai Ujian'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        {errorMessage ? ( 
          <Card className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-r-lg max-w-md w-full border-none shadow-sm" role="alert">
            <div className="flex items-start">
              <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold mb-1">Terjadi Kesalahan!</p>
                <p className="text-sm">{errorMessage}</p>
                <Button onClick={() => { setStarted(false); setErrorMessage(null); setQuestions([]); }} variant="link" className="mt-2 text-red-700">Coba Lagi</Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-12 w-12 text-[#FF006B] mb-4" />
            <p className="text-xl text-[#3D0E61] font-medium">{getProcessingMessage()}</p>
          </div>
        )}
      </div>
    );
  }

  const labels = ['A', 'B', 'C', 'D']; 
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="min-h-screen bg-[#FFF0F5] py-6 md:py-12 w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white border border-[#FF006B]/20 rounded-2xl p-6 md:p-10 mb-6 shadow-md">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 sm:gap-0">
              <h2 className="text-3xl md:text-4xl font-bold text-[#3D0E61] text-center sm:text-left">Tes Kepribadian</h2>
              <span className="text-sm font-semibold text-[#3D0E61] bg-[#FF006B]/10 px-4 py-2 rounded-full">
                Halaman {currentPage + 1} dari {totalPages}
              </span>
            </div>
          </div>

          {errorMessage && ( 
            <Card className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-r-lg max-w-full border-none shadow-sm" role="alert">
              <div className="flex items-start">
                <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold mb-1">Peringatan!</p>
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </div>
            </Card>
          )}

          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-[#3D0E61] mb-2">
              <span>Progress Pengisian</span>
              <span>{answeredCount} dari {questions.length} soal</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#FF006B] h-3 rounded-full transition-all duration-500 ease-out"
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
                <Card key={question.question_id} className="p-6 border border-[#FF006B]/10 shadow-sm bg-white">
                  <div className="flex items-start mb-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 flex-shrink-0 font-semibold text-sm ${
                      isAnswered ? 'bg-[#FF006B] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {questionNumber}
                    </span>
                    <h3 className="text-lg font-medium text-[#3D0E61] leading-relaxed">
                      {question.question_text}
                    </h3>
                  </div>

                  <div className="space-y-3 ml-11">
                    {question.options.map((opt, idx) => (
                      <label
                        key={opt.option_id}
                        className={`flex items-start space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                          answers[question.question_id] === opt.option_id
                            ? 'border-[#FF006B] bg-[#FFF0F5] shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.question_id}`}
                          checked={answers[question.question_id] === opt.option_id}
                          onChange={() => handleSelect(question.question_id, opt.option_id)}
                          className="h-5 w-5 text-[#FF006B] focus:ring-[#FF006B] mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-[#3D0E61] mr-2">{labels[idx]}.</span>
                          <span className="text-gray-700">{opt.option_text}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentPage === 0 || isProcessing}
              variant="outline"
              className={`w-full sm:w-auto px-8 py-3 font-semibold transition-all duration-200 ${
                currentPage === 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              ← Soal Sebelumnya
            </Button>

            {!isLastPage ? (
              <Button
                onClick={handleNext}
                disabled={isProcessing}
                className={`w-full sm:w-auto px-8 py-3 font-semibold transition-all duration-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Soal Berikutnya →
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={isProcessing}
                className={`w-full sm:w-auto px-8 py-3 font-semibold flex items-center justify-center transition-all duration-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                {isProcessing ? getProcessingMessage() : 'Kirim Jawaban ✓'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-none">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#FF006B]/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-[#FF006B] w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[#3D0E61]">Periksa Kembali Jawaban</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Masih ada beberapa soal yang belum dijawab. Silakan pastikan semuanya terisi sebelum
              melanjutkan.
            </p>
            <Button
              onClick={() => setShowPopup(false)}
              className="px-8 py-3 font-semibold w-full transition-colors"
            >
              Oke, Saya Periksa Lagi
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}