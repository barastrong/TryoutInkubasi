<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit(0);
}

// Pastikan kolom di tabel questions adalah 'text'
$result = $conn->query("
  SELECT q.id AS question_id, q.text AS question_text, o.option_id, o.option_value 
  FROM questions q 
  JOIN options o ON q.id = o.question_id
  ORDER BY q.id ASC, o.option_id ASC
");

$questions = [];
while ($row = $result->fetch_assoc()) {
  $id = $row['question_id'];

  if (!isset($questions[$id])) {
    $questions[$id] = [
      'question_id' => $id,
      'question_text' => $row['question_text'],
      'options' => []
    ];
  }

  $optionIndex = count($questions[$id]['options']);
  $label = chr(65 + $optionIndex); // A, B, C, D ...

  $questions[$id]['options'][] = [
    'label' => $label,
    'option_id' => $row['option_id'],
    'option_text' => $row['option_value']
  ];
}

echo json_encode(array_values($questions));
$conn->close();
?>
