<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? null;

if (!$user_id) {
  echo json_encode(["error" => "User ID tidak ditemukan"]);
  exit;
}

// Ambil jawaban user dari database
$q = $conn->prepare("SELECT a.question_id, o.option_value 
                     FROM answers a 
                     JOIN options o ON a.option_id = o.option_id 
                     WHERE a.user_id = ?");
$q->bind_param("i", $user_id);
$q->execute();
$res = $q->get_result();
$answers = [];

while ($row = $res->fetch_assoc()) {
  $answers[] = $row;
}

// API key Gemini
$api_key = "AIzaSyAVTzcmqJ0aFtL81Cq9mSMgPuxBXjuvBDo";

$prompt = "
Kamu adalah sistem analisis kepribadian berbasis psikotes. Berdasarkan jawaban berikut ini:
" . json_encode($answers, JSON_PRETTY_PRINT) . "

Analisislah kepribadian pengguna dengan format JSON seperti ini:

{
  \"personality_type\": \"Analitis\",
  \"interest_category\": \"Investigatif\",
  \"summary\": \"Kamu senang memecahkan masalah dan berpikir logis.\",
  \"recommendations\": \"Data Analyst, Peneliti, Programmer\",
  \"analysis_json\": {
    \"Logika\": 45,
    \"Kreativitas\": 25,
    \"Ketelitian\": 20,
    \"Rasa Ingin Tahu\": 10
  }
}

Jangan tambahkan teks lain selain JSON.
";

// Kirim ke Gemini API
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
  ]
]));

$response = curl_exec($ch);
curl_close($ch);

// Ambil hasil JSON dari Gemini
$result = json_decode($response, true);
$content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

$analysis = json_decode($content, true);
if (!$analysis) {
  echo json_encode(["error" => "Gagal memproses hasil dari Gemini", "raw" => $content]);
  exit;
}

// Ambil username user
$userQ = $conn->prepare("SELECT username FROM users WHERE id = ?");
$userQ->bind_param("i", $user_id);
$userQ->execute();
$userData = $userQ->get_result()->fetch_assoc();
$username = $userData['username'] ?? 'Unknown';

// Simpan hasil ke database
$stmt = $conn->prepare("INSERT INTO results (user_id, username, personality_type, interest_category, summary, recommendations, analysis_json) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param(
  "issssss",
  $user_id,
  $username,
  $analysis['personality_type'],
  $analysis['interest_category'],
  $analysis['summary'],
  $analysis['recommendations'],
  json_encode($analysis['analysis_json'])
);
$stmt->execute();

echo json_encode([
  "status" => "success",
  "result" => $analysis
]);
?>
