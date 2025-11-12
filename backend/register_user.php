<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

header('Content-Type: application/json');
include 'db.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if(!isset($data['username']) || empty($data['username'])){
    echo json_encode(['status'=>'error','message'=>'Username tidak boleh kosong']);
    exit;
}

$username = $data['username'];

$stmt = $conn->prepare("INSERT INTO users (username) VALUES (?)");
$stmt->bind_param("s", $username);
$stmt->execute();

$user_id = $stmt->insert_id;
$stmt->close();

echo json_encode(['status'=>'success','user_id'=>$user_id]);
$conn->close();
?>
