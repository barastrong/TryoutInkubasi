import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

const API_BASE_URL = 'http://localhost/inkubasi/backend'

export default function Homepage() {
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [showPopup, setShowPopup] = useState(false)
  const [showNamePopup, setShowNamePopup] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
      return () => clearInterval(timer)
    } else if (started && timeLeft === 0) {
      handleFinish()
    }
  }, [started, timeLeft])

  const startTest = async () => {
    if (!username.trim()) return
    const res = await axios.post(`${API_BASE_URL}/register_user.php`, { username })
    setUserId(res.data.user_id)
    const qRes = await axios.get(`${API_BASE_URL}/get_questions.php`)
    setQuestions(qRes.data)
    setStarted(true)
    setShowNamePopup(false)
  }

  const handleSelect = (questionId: number, optionId: number) => {
    setAnswers({ ...answers, [questionId]: optionId })
  }

  const handleNext = async () => {
    const currentQuestion = questions[currentIndex]
    const selectedOption = answers[currentQuestion.question_id]

    if (selectedOption) {
      await axios.post(`${API_BASE_URL}/save_answer.php`, {
        user_id: userId,
        question_id: currentQuestion.question_id,
        option_id: selectedOption
      })
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleFinish = async () => {
    const unanswered = questions.filter(q => !answers[q.question_id])
    if (unanswered.length > 0) {
      setShowPopup(true)
      return
    }

    if (!userId) return
    await axios.post(`${API_BASE_URL}/generate_result.php`, { user_id: userId })
    navigate('/result', { state: { userId } })
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Sistem Ujian Online</h1>
          <button
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold"
            onClick={() => setShowNamePopup(true)}
          >
            Masukkan Nama
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
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-xl text-gray-600">Memuat soal...</p>
      </div>
    )
  }

  const question = questions[currentIndex]
  const labels = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto flex gap-6">
        <div className="bg-white shadow rounded-lg p-8 flex-1">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Soal {currentIndex + 1} / {questions.length}
            </h2>
            <p className="font-bold text-red-600 text-xl">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </p>
          </div>

          <p className="text-lg mb-6 text-gray-800">{question.question_text}</p>

          <div className="space-y-3">
            {question.options.map((opt: any, idx: number) => (
              <label 
                key={opt.option_id} 
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition ${
                  answers[question.question_id] === opt.option_id
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300 hover:border-red-400'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.question_id}`}
                  checked={answers[question.question_id] === opt.option_id}
                  onChange={() => handleSelect(question.question_id, opt.option_id)}
                  className="h-4 w-4 text-red-600"
                />
                <span className="font-semibold text-gray-700">{labels[idx]}.</span>
                <span className="text-gray-800">{opt.option_text}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                currentIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Soal Sebelum
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              {currentIndex + 1 < questions.length ? 'Soal Berikutnya' : 'Kirim Jawaban'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 w-64">
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">Nomor Soal</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const answered = answers[q.question_id]
              return (
                <button
                  key={q.question_id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 font-semibold transition rounded-lg 
                    ${idx === currentIndex
                      ? 'bg-red-600 text-white'
                      : answered
                      ? 'bg-red-100 text-red-600 border border-red-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleFinish}
            className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold"
          >
            Selesai Ujian
          </button>
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
  )
}