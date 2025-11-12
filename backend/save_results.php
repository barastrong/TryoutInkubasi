<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

header('Content-Type: application/json');
include 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'];
$personality_type = $data['personality_type'];
$interest_category = $data['interest_category'];
$summary = $data['summary'];
$recommendations = $data['recommendations'];

$stmt = $conn->prepare("INSERT INTO results (user_id, personality_type, interest_category, summary, recommendations) VALUES (?,?,?,?,?)");
$stmt->bind_param("issss", $user_id, $personality_type, $interest_category, $summary, $recommendations);
$stmt->execute();
$stmt->close();

echo json_encode(['status'=>'success']);
$conn->close();
?>
