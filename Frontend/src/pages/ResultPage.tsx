import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User, Briefcase, Target, Award, AlertCircle, Loader2, CheckCircle, Home, RefreshCw, Download, Share2, TrendingUp } from 'lucide-react';

const API_BASE_URL = 'http://192.168.101.181:5000';

interface AnalysisData {
  name: string;
  value: number;
}

interface Result {
  username: string;
  personality_type: string;
  interest_category: string;
  summary: string;
  recommendations: string[];
  analysis_json: { [key: string]: number };
}
  
export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const initialAiErrorMessage = location.state?.aiErrorMessage;
  const resultRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiFallbackMessage, setAiFallbackMessage] = useState<string | null>(initialAiErrorMessage);
  const [downloading, setDownloading] = useState(false);

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
        const response = await fetch(`${API_BASE_URL}/get_result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.result) {
          const fetchedResult = data.result;
          
          if (typeof fetchedResult.recommendations === 'string') {
            try {
              fetchedResult.recommendations = JSON.parse(fetchedResult.recommendations);
              if (!Array.isArray(fetchedResult.recommendations)) {
                fetchedResult.recommendations = [];
              }
            } catch (e) {
              console.error("Error parsing recommendations JSON:", e);
              fetchedResult.recommendations = fetchedResult.recommendations.split(',').map((rec: string) => rec.trim());
            }
          } else if (!Array.isArray(fetchedResult.recommendations)) {
            fetchedResult.recommendations = [];
          }

          if (typeof fetchedResult.analysis_json === 'string') {
            try {
              fetchedResult.analysis_json = JSON.parse(fetchedResult.analysis_json);
              if (typeof fetchedResult.analysis_json !== 'object' || fetchedResult.analysis_json === null) {
                fetchedResult.analysis_json = {};
              }
            } catch (e) {
              console.error("Error parsing analysis_json JSON:", e);
              fetchedResult.analysis_json = {};
            }
          } else if (typeof fetchedResult.analysis_json !== 'object' || fetchedResult.analysis_json === null) {
            fetchedResult.analysis_json = {};
          }

          setResult(fetchedResult);
        } else {
          setError(data.message || "Terjadi kesalahan saat mengambil hasil analisis.");
        }
      } catch (err: any) {
        console.error("Error fetching result:", err);
        setError(`Gagal terhubung ke server atau mengambil data: ${err.message || "Kesalahan tidak diketahui"}. Pastikan backend server berjalan dan dapat diakses.`);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [userId]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')).default;
      
      const element = resultRef.current;
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `hasil-tes-kepribadian-${result?.username || 'user'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBackHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF0F5] p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-[#FF006B] opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <Loader2 className="relative animate-spin h-20 w-20 text-[#3D0E61] mb-6" />
        </div>
        <h2 className="text-3xl font-bold text-[#3D0E61] mb-3 animate-fade-in">Menganalisis Kepribadian Anda</h2>
        <p className="text-[#3D0E61] opacity-80 text-center max-w-md animate-fade-in">AI sedang memproses jawaban Anda untuk memberikan hasil yang akurat</p>
        <div className="mt-8 flex space-x-2">
          <div className="w-3 h-3 bg-[#FF006B] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-3 h-3 bg-[#3D0E61] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-3 h-3 bg-[#FF006B] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF0F5] p-6">
        <div className="max-w-2xl w-full bg-white border-2 border-[#FF006B] rounded-3xl shadow-2xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-[#FF006B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-[#3D0E61]">Terjadi Kesalahan</h1>
            <div className="bg-[#FFF0F5] border-l-4 border-[#FF006B] rounded-r-lg p-5 mb-6">
              <p className="text-[#3D0E61] text-left leading-relaxed">{error}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-[#FF006B] text-white px-6 py-4 rounded-xl hover:bg-[#E6005F] font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Coba Lagi
            </button>
            <button
              onClick={handleBackHome}
              className="w-full bg-white border-2 border-[#3D0E61] text-[#3D0E61] px-6 py-4 rounded-xl hover:bg-[#FFF0F5] font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-[#FFF0F5]">
            <h3 className="font-bold text-[#3D0E61] mb-4 text-lg">Kemungkinan Penyebab:</h3>
            <ul className="text-sm text-[#3D0E61] opacity-80 space-y-3">
              <li className="flex items-start bg-[#FFF0F5] p-3 rounded-lg">
                <span className="text-[#FF006B] mr-3 mt-0.5">•</span>
                <span>Server backend tidak berjalan atau tidak dapat diakses</span>
              </li>
              <li className="flex items-start bg-[#FFF0F5] p-3 rounded-lg">
                <span className="text-[#FF006B] mr-3 mt-0.5">•</span>
                <span>Koneksi internet terputus</span>
              </li>
              <li className="flex items-start bg-[#FFF0F5] p-3 rounded-lg">
                <span className="text-[#FF006B] mr-3 mt-0.5">•</span>
                <span>Data hasil belum tersimpan di database</span>
              </li>
              <li className="flex items-start bg-[#FFF0F5] p-3 rounded-lg">
                <span className="text-[#FF006B] mr-3 mt-0.5">•</span>
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF0F5] p-6">
        <div className="max-w-2xl w-full bg-white border-2 border-[#3D0E61] rounded-3xl shadow-2xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-[#3D0E61] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-[#3D0E61]">Hasil Tidak Ditemukan</h1>
            <p className="text-[#3D0E61] opacity-80 mb-2 text-lg">Tidak ada hasil analisis yang tersedia untuk user ini.</p>
            <p className="text-sm text-[#3D0E61] opacity-70">Pastikan Anda telah menyelesaikan dan mengirim semua jawaban kuesioner.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleBackHome}
              className="w-full bg-[#FF006B] text-white px-6 py-4 rounded-xl hover:bg-[#E6005F] font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
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
    <div className="min-h-screen bg-[#FFF0F5] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FF006B] rounded-full mb-6 shadow-2xl transform hover:scale-110 transition-transform">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-[#3D0E61] mb-4">
            Hasil Tes Kepribadian
          </h1>
          <p className="text-[#3D0E61] opacity-80 text-lg">Analisis lengkap tentang kepribadian dan potensi Anda</p>
        </div>

        {aiFallbackMessage && (
          <div className="bg-[#FFF0F5] border-l-4 border-[#FF006B] text-gray-900 p-6 mb-8 rounded-r-2xl max-w-5xl mx-auto shadow-lg animate-fade-in">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5 text-[#FF006B]" />
              <div>
                <p className="font-bold mb-1 text-lg text-[#3D0E61]">Informasi Penting:</p>
                <p className="text-sm text-[#3D0E61]">{aiFallbackMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={resultRef} className="space-y-8">
          <div className="bg-white border-2 border-[#FF006B]/20 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-[#FF006B] text-white p-8">
              <div className="flex items-center mb-3">
                <User className="w-8 h-8 mr-3" />
                <h2 className="text-3xl font-bold">Informasi Pribadi</h2>
              </div>
              <p className="text-white opacity-90">Detail hasil analisis kepribadian Anda</p>
            </div>
            
            <div className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#FFF0F5] p-6 rounded-2xl border-2 border-[#FF006B]/20 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-14 h-14 bg-[#FF006B] rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#3D0E61] opacity-70 font-semibold mb-1">Nama Pengguna</p>
                      <p className="text-xl font-bold text-[#3D0E61]">{result.username || 'Tidak Diketahui'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF0F5] p-6 rounded-2xl border-2 border-[#FF006B]/20 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-14 h-14 bg-[#3D0E61] rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <Award className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#3D0E61] opacity-70 font-semibold mb-1">Tipe Kepribadian</p>
                      <p className="text-xl font-bold text-[#3D0E61]">{result.personality_type}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF0F5] p-6 rounded-2xl border-2 border-[#FF006B]/20 md:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start mb-3">
                    <div className="w-14 h-14 bg-[#FF006B] rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#3D0E61] opacity-70 font-semibold mb-2">Kategori Minat</p>
                      <p className="text-xl font-bold text-[#3D0E61]">{result.interest_category}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFF0F5] p-8 rounded-2xl border-2 border-[#FF006B]/20 shadow-lg">
                <h3 className="font-bold text-[#3D0E61] mb-4 flex items-center text-xl">
                  <div className="w-10 h-10 bg-[#3D0E61] rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  Ringkasan Kepribadian
                </h3>
                <p className="text-[#3D0E61] opacity-90 leading-relaxed text-lg">{result.summary}</p>
              </div>

              <div className="bg-white border-2 border-[#FF006B]/20 p-8 rounded-2xl shadow-lg">
                <h3 className="font-bold text-[#3D0E61] mb-6 flex items-center text-xl">
                  <div className="w-10 h-10 bg-[#FF006B] rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  Rekomendasi Profesi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.isArray(result.recommendations) && result.recommendations.length > 0
                    ? result.recommendations.map((rec, index) => (
                        <div key={index} className="bg-[#FFF0F5] p-4 rounded-xl border-2 border-[#FF006B]/20 flex items-center shadow-md hover:shadow-lg transition-shadow">
                          <div className="w-3 h-3 bg-[#FF006B] rounded-full mr-3 flex-shrink-0"></div>
                          <span className="text-[#3D0E61] font-semibold">{rec.trim()}</span>
                        </div>
                      ))
                    : <p className="text-[#3D0E61] opacity-70 text-sm col-span-2">Tidak ada rekomendasi profesi.</p>}
                </div>
              </div>
            </div>
          </div>

          {analysisData.length > 0 && (
            <div className="bg-white border-2 border-[#FF006B]/20 rounded-3xl shadow-2xl p-8 md:p-10 animate-fade-in">
              <h2 className="text-3xl font-bold mb-8 text-[#3D0E61] text-center">Visualisasi Aspek Kepribadian</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-[#FFF0F5] p-6 rounded-2xl border-2 border-[#FF006B]/20 shadow-lg">
                  <h3 className="text-xl font-bold text-[#3D0E61] mb-6 text-center">Distribusi Persentase</h3>
                  <div className="flex justify-center items-center" style={{minHeight: '380px'}}>
                    <ResponsiveContainer width="100%" height={380}>
                      <PieChart>
                        <Pie
                          data={analysisData}
                          cx="50%"
                          cy="45%"
                          labelLine={true}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          style={{ fontSize: '13px', fontWeight: '600', }}
                        >
                          {analysisData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${value}%`}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '2px solid #FF006B',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        />
                        <Legend 
                          layout="horizontal" 
                          align="center" 
                          verticalAlign="bottom"
                          wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: '600' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#FFF0F5] p-6 rounded-2xl border-2 border-[#FF006B]/20 shadow-lg">
                  <h3 className="text-xl font-bold text-[#3D0E61] mb-6 text-center">Perbandingan Skor</h3>
                  <div className="flex justify-center items-center" style={{minHeight: '380px'}}>
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{fontSize: 10, fill: '#3D0E61', fontWeight: 600}} 
                          angle={-25}
                          textAnchor="end"
                          height={90}
                          interval={0}
                        />
                        <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#3D0E61', fontWeight: 600}} />
                        <Tooltip 
                          formatter={(value: number) => `${value}%`}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '2px solid #FF006B',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                          {analysisData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white border-2 border-[#FF006B]/20 p-6 rounded-2xl shadow-md">
                <p className="text-center text-[#3D0E61] opacity-90 text-base leading-relaxed">
                  <strong className="text-[#3D0E61]">Catatan:</strong> Persentase menunjukkan bobot relatif dari setiap aspek kepribadian Anda berdasarkan hasil analisis AI yang komprehensif.
                </p>
              </div>
            </div>
          )}
          
          {analysisData.length === 0 && (
            <div className="bg-[#FFF0F5] border-l-4 border-[#FF006B] text-[#3D0E61] p-8 rounded-r-2xl shadow-lg animate-fade-in">
              <div className="flex items-start">
                <AlertCircle className="w-7 h-7 mr-4 flex-shrink-0 mt-0.5 text-[#FF006B]" />
                <div>
                  <p className="font-bold mb-2 text-lg text-[#3D0E61]">Informasi</p>
                  <p className="text-base text-[#3D0E61] opacity-80">Data detail analisis kepribadian (diagram visualisasi) tidak tersedia saat ini.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 text-center bg-white border-2 border-[#FF006B]/20 rounded-2xl p-8 shadow-lg">
            <p className="text-[#3D0E61] opacity-80 mb-6 text-base leading-relaxed max-w-3xl mx-auto">
              Analisis ini dihasilkan oleh AI dan bersifat sebagai panduan awal untuk pengembangan diri Anda. Hasil ini dapat membantu Anda memahami kepribadian dan potensi yang Anda miliki.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center bg-[#3D0E61] text-white px-8 py-4 rounded-xl hover:bg-[#2D0A4D] font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Unduh PDF
                  </>
                )}
              </button>
              <button
                onClick={handleBackHome}
                className="inline-flex items-center bg-white border-2 border-[#3D0E61] text-[#3D0E61] px-8 py-4 rounded-xl hover:bg-[#FFF0F5] font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}