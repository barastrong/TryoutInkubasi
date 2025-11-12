<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? null;
$question_id = $data['question_id'] ?? null;
$option_id = $data['option_id'] ?? null;

if (!$user_id || !$question_id || !$option_id) {
  echo json_encode(["error" => "Data tidak lengkap"]);
  exit;
}

$stmt = $conn->prepare("INSERT INTO answers (user_id, question_id, option_id) VALUES (?, ?, ?)");
$stmt->bind_param("iii", $user_id, $question_id, $option_id);
$stmt->execute();

echo json_encode(["status" => "success"]);
?>
