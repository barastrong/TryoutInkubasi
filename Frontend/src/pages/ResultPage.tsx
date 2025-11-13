import { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa'; // Import FaInfoCircle
import { useLocation } from 'react-router-dom'; // Import useLocation to get state from navigate

interface AnalysisData {
  name: string;
  value: number;
}

interface Result {
  username: string;
  personality_type: string;
  interest_category: string;
  summary: string;
  recommendations: string[] | string; // Can be array or comma-separated string
  analysis_json: { [key: string]: number };
}

interface LocationState {
  userId: number;
  aiErrorMessage?: string; // New: optional message from Homepage
}

const API_BASE_URL = 'http://localhost/inkubasi/backend';

export default function ResultPage() {
  const location = useLocation();
  const state = location.state as LocationState;
  const userId = state?.userId;
  const initialAiErrorMessage = state?.aiErrorMessage || null;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiFallbackMessage, setAiFallbackMessage] = useState<string | null>(initialAiErrorMessage);


  useEffect(() => {
    const fetchResult = async () => {
      if (!userId) {
        setError("User ID tidak ditemukan. Harap login atau berikan User ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const response = await axios.post(`${API_BASE_URL}/get_result.php`, { user_id: userId });

        if (response.data.status === 'success') {
          // Ensure recommendations is an array for consistency
          const fetchedResult = response.data.result;
          if (typeof fetchedResult.recommendations === 'string') {
              fetchedResult.recommendations = fetchedResult.recommendations.split(',').map((rec: string) => rec.trim());
          }
          setResult(fetchedResult);
          // If a fallback message came from process_quiz.php, display it here
          if (response.data.message && response.data.message.includes('Menampilkan hasil default')) {
            setAiFallbackMessage(response.data.message);
          }
        } else {
          setError(response.data.message || "Terjadi kesalahan saat mengambil hasil analisis.");
        }
      } catch (err) {
        console.error("Error fetching result:", err);
        setError("Gagal terhubung ke server atau API. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [userId]); // Depend on userId from location state

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-700">
        <FaSpinner className="animate-spin text-5xl mb-4 text-blue-500" />
        <p className="text-xl font-medium">Memuat hasil analisis kepribadian...</p>
        <p className="text-sm text-gray-500 mt-2">Ini mungkin memakan waktu beberapa saat karena AI sedang menganalisis data Anda.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-6 text-red-700">
        <FaExclamationTriangle className="text-6xl mb-4" />
        <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan!</h1>
        <p className="text-lg text-center">{error}</p>
        <p className="text-sm text-gray-600 mt-4">Mohon coba kembali atau hubungi administrator.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6 text-gray-700">
        <FaExclamationTriangle className="text-6xl mb-4 text-yellow-500" />
        <h1 className="text-2xl font-bold mb-2">Hasil Tidak Ditemukan</h1>
        <p className="text-lg text-center">Tidak ada hasil analisis yang tersedia untuk user ini.</p>
        <p className="text-sm text-gray-600 mt-4">Pastikan Anda telah mengisi kuesioner.</p>
      </div>
    );
  }

  const analysisData: AnalysisData[] = result?.analysis_json
    ? Object.entries(result.analysis_json).map(([key, value]) => ({
        name: key,
        value: Number(value),
      }))
    : [];

  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4'];

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300 hover:scale-105">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6 flex items-center justify-center">
          <FaCheckCircle className="text-green-500 mr-3" /> Hasil Tes Kepribadian
        </h1>

        {aiFallbackMessage && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 flex items-center" role="alert">
            <FaInfoCircle className="mr-3 flex-shrink-0 text-2xl" />
            <div>
              <p className="font-bold">Informasi Penting:</p>
              <p>{aiFallbackMessage}</p>
            </div>
          </div>
        )}

        <div className="border-t border-b border-gray-200 py-6 mb-6">
          <p className="mb-3 text-lg">
            <span className="font-semibold text-gray-700">Nama Pengguna:</span> <span className="text-gray-900">{result.username || 'Tidak Diketahui'}</span>
          </p>
          <p className="mb-3 text-lg">
            <span className="font-semibold text-gray-700">Tipe Kepribadian Utama:</span> <span className="text-indigo-600 font-medium">{result.personality_type}</span>
          </p>
          <p className="mb-3 text-lg">
            <span className="font-semibold text-gray-700">Kategori Minat:</span> <span className="text-teal-600 font-medium">{result.interest_category}</span>
          </p>
          <div className="mb-3 text-lg">
            <span className="font-semibold text-gray-700 block mb-1">Ringkasan Kepribadian:</span>
            <p className="bg-blue-50 p-4 rounded-md text-gray-800 leading-relaxed italic">{result.summary}</p>
          </div>
          <div className="text-lg">
            <span className="font-semibold text-gray-700 block mb-1">Rekomendasi Profesi/Bidang:</span>
            <ul className="list-disc list-inside bg-green-50 p-4 rounded-md text-gray-800">
              {Array.isArray(result.recommendations)
                ? result.recommendations.map((rec, index) => (
                    <li key={index} className="mb-1">{rec.trim()}</li>
                  ))
                : // Fallback for string recommendations if any
                  result.recommendations.split(',').map((rec, index) => (
                    <li key={index} className="mb-1">{rec.trim()}</li>
                  ))}
            </ul>
          </div>
        </div>

        {analysisData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-inner mt-8">
            <h2 className="text-2xl font-bold mb-5 text-center text-gray-800">Visualisasi Aspek Kepribadian</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analysisData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analysisData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
             <p className="text-center text-gray-500 text-sm mt-4">Persentase menunjukkan bobot relatif dari setiap aspek kepribadian Anda.</p>
          </div>
        )}
        {analysisData.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 mt-8 rounded-md" role="alert">
            <p className="font-bold">Informasi</p>
            <p>Data detail analisis kepribadian (diagram lingkaran) tidak tersedia saat ini.</p>
          </div>
        )}
      </div>
       <p className="mt-8 text-gray-600 text-sm text-center">Analisis ini dihasilkan oleh AI dan bersifat sebagai panduan awal.</p>
    </div>
  );
}