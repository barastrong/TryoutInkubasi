<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit(0);
}

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
  echo json_encode(["error" => "User ID tidak ditemukan"]);
  exit;
}

// Ambil hasil analisis dari tabel results
$q = $conn->prepare("SELECT username, personality_type, interest_category, summary, recommendations, analysis_json FROM results WHERE user_id = ? ORDER BY id DESC LIMIT 1");
$q->bind_param("i", $user_id);
$q->execute();
$res = $q->get_result();

if ($res->num_rows === 0) {
  echo json_encode(["error" => "Hasil belum tersedia untuk user ini"]);
  exit;
}

$data = $res->fetch_assoc();
$data['analysis_json'] = json_decode($data['analysis_json'], true);

echo json_encode(["status" => "success", "result" => $data]);
?>
