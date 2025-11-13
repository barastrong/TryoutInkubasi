import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User, Briefcase, Target, Award, AlertCircle, Loader2, CheckCircle, Home, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost/inkubasi/backend';

interface AnalysisData {
  name: string;
  value: number;
}

interface Result {
  username: string;
  personality_type: string;
  interest_category: string;
  summary: string;
  recommendations: string[] | string;
  analysis_json: { [key: string]: number };
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const initialAiErrorMessage = location.state?.aiErrorMessage;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiFallbackMessage, setAiFallbackMessage] = useState<string | null>(initialAiErrorMessage);

  useEffect(() => {
    const fetchResult = async () => {
      if (!userId) {
        setError("User ID tidak ditemukan. Harap kembali ke halaman utama dan mulai ujian kembali.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/get_result.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.result) {
          const fetchedResult = data.result;
          if (typeof fetchedResult.recommendations === 'string') {
            fetchedResult.recommendations = fetchedResult.recommendations.split(',').map((rec: string) => rec.trim());
          }
          setResult(fetchedResult);
        } else {
          setError(data.message || "Terjadi kesalahan saat mengambil hasil analisis.");
        }
      } catch (err) {
        console.error("Error fetching result:", err);
        setError("Gagal terhubung ke server. Pastikan backend server berjalan dan dapat diakses.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [userId]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBackHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loader2 className="animate-spin h-16 w-16 text-red-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Menganalisis Kepribadian Anda</h2>
        <p className="text-gray-600 text-center max-w-md">AI sedang memproses jawaban Anda untuk memberikan hasil yang akurat</p>
        <div className="mt-8 flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
        <div className="max-w-lg w-full bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-900">Terjadi Kesalahan</h1>
            <div className="bg-white border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-gray-800 text-left leading-relaxed">{error}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Coba Lagi
            </button>
            <button
              onClick={handleBackHome}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-colors flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-red-200">
            <h3 className="font-semibold text-gray-900 mb-3">Kemungkinan Penyebab:</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Server backend tidak berjalan atau tidak dapat diakses</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Koneksi internet terputus</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Data hasil belum tersimpan di database</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Session atau User ID tidak valid</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
        <div className="max-w-lg w-full bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-gray-900">Hasil Tidak Ditemukan</h1>
            <p className="text-gray-700 mb-2">Tidak ada hasil analisis yang tersedia untuk user ini.</p>
            <p className="text-sm text-gray-600">Pastikan Anda telah menyelesaikan dan mengirim semua jawaban kuesioner.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleBackHome}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const analysisData: AnalysisData[] = result?.analysis_json
    ? Object.entries(result.analysis_json).map(([key, value]) => ({
        name: key,
        value: Number(value),
      }))
    : [];

  const COLORS = ['#DC2626', '#EA580C', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Hasil Tes Kepribadian
          </h1>
          <p className="text-gray-600">Analisis lengkap tentang kepribadian dan potensi Anda</p>
        </div>

        {aiFallbackMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-8 rounded-r-lg max-w-4xl mx-auto">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Informasi Penting:</p>
                <p className="text-sm">{aiFallbackMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center mb-2">
              <User className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-bold">Informasi Pribadi</h2>
            </div>
            <p className="text-red-100 text-sm">Detail hasil analisis kepribadian Anda</p>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Nama Pengguna</p>
                    <p className="text-lg font-bold text-gray-900">{result.username || 'Tidak Diketahui'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Tipe Kepribadian</p>
                    <p className="text-lg font-bold text-blue-600">{result.personality_type}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 md:col-span-2">
                <div className="flex items-start mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Kategori Minat</p>
                    <p className="text-lg font-bold text-green-600">{result.interest_category}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-blue-600">📝</span>
                </div>
                Ringkasan Kepribadian
              </h3>
              <p className="text-gray-800 leading-relaxed">{result.summary}</p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
                Rekomendasi Profesi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.isArray(result.recommendations)
                  ? result.recommendations.map((rec, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-green-200 flex items-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-800 font-medium">{rec.trim()}</span>
                      </div>
                    ))
                  : result.recommendations.split(',').map((rec, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-green-200 flex items-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-800 font-medium">{rec.trim()}</span>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>

        {analysisData.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Visualisasi Aspek Kepribadian</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Distribusi Persentase</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysisData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
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
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Perbandingan Skor</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysisData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {analysisData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-center text-gray-600 text-sm">
                <strong>Catatan:</strong> Persentase menunjukkan bobot relatif dari setiap aspek kepribadian Anda berdasarkan hasil analisis.
              </p>
            </div>
          </div>
        )}
        
        {analysisData.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Informasi</p>
                <p className="text-sm">Data detail analisis kepribadian (diagram visualisasi) tidak tersedia saat ini.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Analisis ini dihasilkan oleh AI dan bersifat sebagai panduan awal untuk pengembangan diri Anda.
          </p>
          <button
            onClick={handleBackHome}
            className="inline-flex items-center bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}