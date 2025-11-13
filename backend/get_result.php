<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db.php';
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Koneksi database gagal: " . $conn->connect_error]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit(0);
}

// Tidak perlu API key Gemini di sini lagi karena AI dipanggil di process_quiz.php
// $api_key = "AIzaSyAVTzcmqJ0aFtL81Cq9mSMgPuxBXjuvBDo";

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? null;

if (!$user_id || !is_numeric($user_id)) {
  echo json_encode(["status" => "error", "message" => "User ID tidak valid atau tidak ditemukan.", "details" => "User ID: " . var_export($user_id, true)]);
  exit;
}

// Cek apakah hasil sudah ada di tabel 'results'
$stmt_check_result = $conn->prepare("SELECT * FROM results WHERE user_id = ?");
if (!$stmt_check_result) {
    echo json_encode(["status" => "error", "message" => "Gagal menyiapkan statement cek hasil: " . $conn->error]);
    exit;
}
$stmt_check_result->bind_param("i", $user_id);
$stmt_check_result->execute();
$existing_result = $stmt_check_result->get_result()->fetch_assoc();
$stmt_check_result->close();

if ($existing_result) {
  // Jika hasil sudah ada, kembalikan langsung dari database (cache)
  $existing_result['analysis_json'] = json_decode($existing_result['analysis_json'], true);
  echo json_encode(["status" => "success", "result" => $existing_result, "source" => "cache"]);
  exit;
}

// Jika tidak ada hasil di tabel 'results', ini menunjukkan bahwa
// process_quiz.php belum pernah dipanggil atau gagal.
// Di sini, kita tidak akan memanggil AI lagi, melainkan memberitahu frontend
// bahwa hasil belum tersedia. Frontend harus memastikan process_quiz.php
// sudah dijalankan dan berhasil sebelum memanggil get_result.php.
echo json_encode(["status" => "error", "message" => "Hasil analisis belum tersedia untuk user ini. Harap lengkapi kuesioner terlebih dahulu.", "user_id" => $user_id]);
exit;


// Bagian di bawah ini (yang memanggil Gemini) dihapus karena sudah dilakukan di process_quiz.php
/*
$q_answers = $conn->prepare("
  SELECT a.question_id, o.label AS option_label
  FROM answers a
  JOIN options o ON a.option_id = o.option_id
  WHERE a.user_id = ?
  ORDER BY a.question_id ASC
");
if (!$q_answers) {
    echo json_encode(["status" => "error", "message" => "Gagal menyiapkan statement mengambil jawaban: " . $conn->error]);
    exit;
}
$q_answers->bind_param("i", $user_id);
$q_answers->execute();
$res_answers = $q_answers->get_result();

$answers = [];
while ($row = $res_answers->fetch_assoc()) {
  $answers[] = $row;
}
$q_answers->close();

if (empty($answers)) {
  echo json_encode(["status" => "error", "message" => "User belum memiliki jawaban untuk dianalisis.", "details" => "User ID: " . $user_id . ", tidak ada jawaban ditemukan."]);
  exit;
}

$user_personality_scores = [];
$user_interest_scores = [];
$personality_dimensions = ["Inisiatif", "Analitis", "Sosial", "Kreatif", "Mandiri", "Teratur", "Empati", "Resilien", "Logis", "Fleksibel", "Disiplin", "Kolaboratif", "Intuisi", "Percaya_Diri", "Introvert", "Ekstrovert", "Adaptif", "Santai", "Praktis", "Diplomatis", "Produktif", "Kejujuran", "Tanggung_Jawab", "Ketegasan", "Keberanian", "Tenang", "Bakat_Alami", "Acuh", "Iri", "Kagum", "Eksternal_Locus_Control", "Auditory", "Visual", "Reading/Writing", "Kinestetik"];
$interest_categories = ["Investigatif", "Artistik", "Sosial_Minat", "Enterprising", "Konvensional", "Realistis", "Alam", "Teknologi"]; // Tambahkan "Teknologi" jika digunakan


foreach ($personality_dimensions as $dim) {
    $user_personality_scores[$dim] = 0;
}
foreach ($interest_categories as $cat) {
    $user_interest_scores[$cat] = 0;
}


foreach ($answers as $user_answer) {
    $q_id = $user_answer['question_id'];
    $option_label = $user_answer['option_label'];

    if (isset($scoring_rules[$q_id][$option_label])) {
        foreach ($scoring_rules[$q_id][$option_label] as $key => $score) {
            if (in_array($key, $interest_categories)) {
                $user_interest_scores[$key] += $score;
            } elseif (in_array($key, $personality_dimensions)) {
                $user_personality_scores[$key] += $score;
            }
        }
    } else {
        error_log("Missing scoring rule for QID: $q_id, Option: $option_label for User: $user_id");
    }
}

$num_questions_answered = count($answers);
if ($num_questions_answered === 0) {
    echo json_encode(["status" => "error", "message" => "Tidak ada jawaban untuk dinormalisasi."]);
    exit;
}

$total_questions_in_test = 30;
$max_score_per_question = 2;
$min_score_per_question = -2;

$max_possible_overall_score = $total_questions_in_test * $max_score_per_question;
$min_possible_overall_score = $total_questions_in_test * $min_score_per_question;

$normalized_personality_scores = [];
foreach ($user_personality_scores as $dimension => $score) {
    if ($max_possible_overall_score - $min_possible_overall_score == 0) {
        $normalized_score = 50;
    } else {
        $normalized_score = (($score - $min_possible_overall_score) / ($max_possible_overall_score - $min_possible_overall_score)) * 100;
    }
    $normalized_personality_scores[$dimension] = round(max(0, min(100, $normalized_score)));
}

$normalized_interest_scores = [];
foreach ($user_interest_scores as $category => $score) {
    if ($max_possible_overall_score - $min_possible_overall_score == 0) {
        $normalized_score = 50;
    } else {
        $normalized_score = (($score - $min_possible_overall_score) / ($max_possible_overall_score - $min_possible_overall_score)) * 100;
    }
    $normalized_interest_scores[$category] = round(max(0, min(100, $normalized_score)));
}

arsort($normalized_interest_scores);
$top_interest_category_name = !empty($normalized_interest_scores) ? key($normalized_interest_scores) : 'Tidak Diketahui';

$username = 'Anonim';
$userQ = $conn->prepare("SELECT username FROM users WHERE id = ?");
if ($userQ) {
    $userQ->bind_param("i", $user_id);
    $userQ->execute();
    $userData = $userQ->get_result()->fetch_assoc();
    if ($userData) {
        $username = $userData['username'];
    }
    $userQ->close();
} else {
    echo json_encode(["status" => "error", "message" => "Gagal menyiapkan statement mengambil username: " . $conn->error]);
    exit;
}

$prompt = "
Kamu adalah seorang psikolog profesional AI yang sangat akurat. Berdasarkan jawaban kuesioner pengguna yang telah dianalisis secara mendalam dan dikonversi menjadi profil skor kepribadian dan minat berikut:

**Profil Kepribadian (Skala 0-100, 100=sangat tinggi):**
" . json_encode($normalized_personality_scores, JSON_PRETTY_PRINT) . "

**Profil Minat (Skala 0-100, 100=sangat tinggi):**
" . json_encode($normalized_interest_scores, JSON_PRETTY_PRINT) . "

Berdasarkan profil di atas, lakukan hal-hal berikut:
1. Identifikasi 'personality_type' utama (misal: Analitis, Kreatif, Sosial, Realistis, dll.) yang paling dominan dari profil kepribadian.
2. Identifikasi 'interest_category' utama (misal: Investigatif, Artistik, Sosial, Enterprising, Konvensional, Realistis) yang paling dominan dari profil minat.
3. Buat 'summary' yang ringkas dan mendalam tentang kepribadian pengguna, menjelaskan kekuatan, potensi, dan mungkin area yang bisa dikembangkan, dengan MERUJUK PADA SKOR yang diberikan.
4. Berikan 'recommendations' profesi atau bidang studi yang sangat relevan, spesifik, dan realistis (dalam format string dipisahkan koma) berdasarkan kombinasi profil kepribadian dan minat.
5. Isi 'analysis_json' dengan 4-5 dimensi kepribadian yang paling relevan dari profil kepribadian di atas, beserta skor persentasenya, pastikan totalnya tidak harus 100% melainkan menunjukkan bobot relatif masing-masing aspek. Pilih dimensi yang paling mencerminkan kepribadian keseluruhan.

Pastikan output Anda HANYA berupa objek JSON murni, tanpa teks pembuka atau penutup. Contoh format JSON yang diharapkan:

{
  \"username\": \"".$username."\",
  \"personality_type\": \"[Tipe Kepribadian Utama]\",
  \"interest_category\": \"[Kategori Minat Terkait]\",
  \"summary\": \"[Ringkasan singkat dan padat tentang kepribadian pengguna berdasarkan jawaban dan skor. Contoh: 'Dengan skor Inisiatif 85% dan Analitis 70%, Anda memiliki pola pikir logis yang kuat dan selalu proaktif dalam menyelesaikan masalah kompleks.']\",
  \"recommendations\": \"[Daftar profesi atau bidang studi yang direkomendasikan, misal: 'Programmer, Data Scientist, Peneliti, Konsultan IT']\",
  \"analysis_json\": {
    \"[Dimensi Teratas 1]\": [Skor Persentase],
    \"[Dimensi Teratas 2]\": [Skor Persentase],
    \"[Dimensi Teratas 3]\": [Skor Persentase],
    \"[Dimensi Teratas 4]\": [Skor Persentase]
  }
}

Gunakan penalaran seorang psikolog berpengalaman untuk menghasilkan analisis yang akurat dan relevan.
";

$ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=$api_key");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "contents" => [
    [
      "parts" => [
        ["text" => $prompt]
      ]
    ]
  ],
  "generationConfig" => [
      "responseMimeType" => "application/json",
  ]
]));

$response = curl_exec($ch);

if (curl_errno($ch)) {
  echo json_encode(["status" => "error", "message" => "Gagal terhubung ke Gemini: " . curl_error($ch), "curl_error_code" => curl_errno($ch)]);
  curl_close($ch);
  exit;
}
curl_close($ch);

$result_gemini = json_decode($response, true);

if (isset($result_gemini['error'])) {
    echo json_encode(["status" => "error", "message" => "Gemini API Error: " . ($result_gemini['error']['message'] ?? 'Unknown error'), "details" => $result_gemini]);
    exit;
}
if (!isset($result_gemini['candidates'][0]['content']['parts'][0]['text'])) {
    echo json_encode(["status" => "error", "message" => "Gemini tidak mengembalikan analisis yang diharapkan (respon kosong atau tidak ada 'text' di parts).", "raw_response" => $result_gemini]);
    exit;
}

$content = $result_gemini['candidates'][0]['content']['parts'][0]['text'];
$analysis = json_decode($content, true);

if (!$analysis) {
  echo json_encode(["status" => "error", "message" => "Gagal memproses hasil dari Gemini. Respons bukan JSON yang valid atau format tidak sesuai. Pastikan Gemini mengembalikan JSON murni.", "raw_gemini_output" => $content, "json_last_error" => json_last_error_msg()]);
  exit;
}

if (!isset($analysis['username']) || empty($analysis['username'])) {
    $analysis['username'] = $username;
}

$stmt_insert = $conn->prepare("
  INSERT INTO results
  (user_id, username, personality_type, interest_category, summary, recommendations, analysis_json)
  VALUES (?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt_insert) {
    echo json_encode(["status" => "error", "message" => "Gagal menyiapkan statement INSERT untuk menyimpan hasil: " . $conn->error]);
    exit;
}

$recommendations_str = is_array($analysis['recommendations']) ? implode(", ", $analysis['recommendations']) : $analysis['recommendations'];
$analysis_json_str = json_encode($analysis['analysis_json']);

$stmt_insert->bind_param(
  "issssss",
  $user_id,
  $analysis['username'],
  $analysis['personality_type'],
  $analysis['interest_category'],
  $analysis['summary'],
  $recommendations_str,
  $analysis_json_str
);

if (!$stmt_insert->execute()) {
    echo json_encode(["status" => "error", "message" => "Gagal menyimpan hasil analisis ke database: " . $stmt_insert->error]);
    $stmt_insert->close();
    exit;
}
$stmt_insert->close();

echo json_encode([
  "status" => "success",
  "result" => $analysis,
  "source" => "gemini_generated"
]);
*/
// End of removed section

$conn->close();
?>