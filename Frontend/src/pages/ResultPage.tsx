import { useEffect, useState } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ResultPageProps {
  userId: number
}

const API_BASE_URL = 'http://localhost/inkubasi/backend'

export default function ResultPage({ userId }: ResultPageProps) {
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (userId) {
      axios
        .get(`${API_BASE_URL}/get_result.php?user_id=${userId}`)
        .then((res) => {
          if (res.data.status === 'success') {
            setResult(res.data.result)
          }
        })
        .catch((err) => console.error(err))
    }
  }, [userId])

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl">Memuat hasil...</p>
      </div>
    )
  }

  // Cegah error jika analysis_json kosong
  const analysisData = result?.analysis_json
    ? Object.entries(result.analysis_json).map(([key, value]) => ({
        name: key,
        value: Number(value),
      }))
    : []

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Hasil Tes</h1>
      <div className="bg-white p-6 rounded shadow w-full max-w-md mb-8">
        <p className="mb-2">
          <span className="font-semibold">Nama:</span> {result.username}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Tipe Kepribadian:</span> {result.personality_type}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Kategori Minat:</span> {result.interest_category}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Ringkasan:</span> {result.summary}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Rekomendasi:</span> {result.recommendations}
        </p>
      </div>

      {analysisData.length > 0 && (
        <div className="bg-white p-6 rounded shadow w-full max-w-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center">Analisis Kepribadian</h2>
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analysisData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
