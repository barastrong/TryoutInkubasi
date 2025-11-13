<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit();
}

$gemini_api_key = 'AIzaSyAVTzcmqJ0aFtL81Cq9mSMgPuxBXjuvBDo'; // Pastikan ini adalah API key yang valid dan aktif
$gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $gemini_api_key;
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id']) || !isset($input['answers']) || !is_array($input['answers'])) {
    error_log("Invalid input data received: " . print_r($input, true));
    echo json_encode(['status' => 'error', 'message' => 'Data input tidak valid. Mohon lengkapi data user_id dan jawaban.']);
    exit();
}

$user_id = $input['user_id'];
$user_answers = $input['answers'];

$username = 'Anonim';
$stmt_username = $conn->prepare("SELECT username FROM users WHERE user_id = ?");
if ($stmt_username) {
    $stmt_username->bind_param("i", $user_id);
    $stmt_username->execute();
    $result_username = $stmt_username->get_result();
    if ($row_username = $result_username->fetch_assoc()) {
        $username = $row_username['username'];
    } else {
        error_log("Username not found for user_id: " . $user_id);
    }
    $stmt_username->close();
} else {
    error_log("Failed to prepare statement for fetching username: " . $conn->error);
}

$quiz_data = [
    [
    "question_id" => "1",
    "question_text" => "1. Ketika menghadapi tugas baru di sekolah, apa yang biasanya kamu lakukan?",
    "options" => [
      ["label" => "A", "option_id" => "1", "option_text" => "Mencoba memahaminya sendiri dulu"],
      ["label" => "B", "option_id" => "2", "option_text" => "Bertanya pada teman atau guru"],
      ["label" => "C", "option_id" => "3", "option_text" => "Menunda sampai paham betul caranya"],
      ["label" => "D", "option_id" => "4", "option_text" => "Mencari referensi dari internet"],
      ["label" => "E", "option_id" => "5", "option_text" => "Menunggu penjelasan lebih lanjut dari guru"]
    ]
  ],
  [
    "question_id" => "2",
    "question_text" => "2. Dalam bekerja kelompok, kamu lebih suka...",
    "options" => [
      ["label" => "A", "option_id" => "6", "option_text" => "Memimpin dan mengatur tugas"],
      ["label" => "B", "option_id" => "7", "option_text" => "Menjalankan tugas sesuai arahan"],
      ["label" => "C", "option_id" => "8", "option_text" => "Mendukung dengan ide dan semangat"],
      ["label" => "D", "option_id" => "9", "option_text" => "Mengamati dari belakang"],
      ["label" => "E", "option_id" => "10", "option_text" => "Mengerjakan bagian sendiri dengan tenang"]
    ]
  ],
  [
    "question_id" => "3",
    "question_text" => "3. Jika ada lomba yang menantang, kamu akan...",
    "options" => [
      ["label" => "A", "option_id" => "11", "option_text" => "Langsung mendaftar dan mencoba"],
      ["label" => "B", "option_id" => "12", "option_text" => "Menunggu teman yang ikut dulu"],
      ["label" => "C", "option_id" => "13", "option_text" => "Mempertimbangkan untung ruginya"],
      ["label" => "D", "option_id" => "14", "option_text" => "Tidak tertarik jika terlalu sulit"],
      ["label" => "E", "option_id" => "15", "option_text" => "Mendukung dari belakang layar"]
    ]
  ],
  [
    "question_id" => "4",
    "question_text" => "4. Saat ujian, kamu lebih nyaman belajar dengan...",
    "options" => [
      ["label" => "A", "option_id" => "16", "option_text" => "Belajar bersama teman"],
      ["label" => "B", "option_id" => "17", "option_text" => "Belajar sendiri di tempat tenang"],
      ["label" => "C", "option_id" => "18", "option_text" => "Belajar dengan musik"],
      ["label" => "D", "option_id" => "19", "option_text" => "Belajar lewat video"],
      ["label" => "E", "option_id" => "20", "option_text" => "Belajar lewat praktik langsung"]
    ]
  ],
  [
    "question_id" => "5",
    "question_text" => "5. Ketika guru memberikan tugas tanpa batas waktu, kamu akan...",
    "options" => [
      ["label" => "A", "option_id" => "21", "option_text" => "Langsung mengerjakannya supaya cepat selesai"],
      ["label" => "B", "option_id" => "22", "option_text" => "Menunda hingga waktu mendesak"],
      ["label" => "C", "option_id" => "23", "option_text" => "Mengerjakannya sedikit demi sedikit"],
      ["label" => "D", "option_id" => "24", "option_text" => "Menunggu inspirasi datang"],
      ["label" => "E", "option_id" => "25", "option_text" => "Menunggu teman mengingatkan"]
    ]
  ],
  [
    "question_id" => "6",
    "question_text" => "6. Dalam mengambil keputusan penting, kamu lebih mengandalkan...",
    "options" => [
      ["label" => "A", "option_id" => "26", "option_text" => "Pertimbangan logika dan data"],
      ["label" => "B", "option_id" => "27", "option_text" => "Intuisi dan perasaan"],
      ["label" => "C", "option_id" => "28", "option_text" => "Pendapat orang lain"],
      ["label" => "D", "option_id" => "29", "option_text" => "Keuntungan pribadi"],
      ["label" => "E", "option_id" => "30", "option_text" => "Gabungan semua pertimbangan di atas"]
    ]
  ],
  [
    "question_id" => "7",
    "question_text" => "7. Kamu merasa paling bersemangat ketika...",
    "options" => [
      ["label" => "A", "option_id" => "31", "option_text" => "Bekerja dalam tim yang solid"],
      ["label" => "B", "option_id" => "32", "option_text" => "Belajar hal baru yang menarik"],
      ["label" => "C", "option_id" => "33", "option_text" => "Membantu orang lain"],
      ["label" => "D", "option_id" => "34", "option_text" => "Mencapai target pribadi"],
      ["label" => "E", "option_id" => "35", "option_text" => "Mendapat pengakuan atas hasil kerja"]
    ]
  ],
  [
    "question_id" => "8",
    "question_text" => "8. Jika ada teman yang sedang kesulitan, kamu akan...",
    "options" => [
      ["label" => "A", "option_id" => "36", "option_text" => "Langsung membantu semampunya"],
      ["label" => "B", "option_id" => "37", "option_text" => "Memberi saran agar mandiri"],
      ["label" => "C", "option_id" => "38", "option_text" => "Membiarkannya hingga diminta"],
      ["label" => "D", "option_id" => "39", "option_text" => "Meminta orang lain untuk bantu"],
      ["label" => "E", "option_id" => "40", "option_text" => "Menemani agar tidak merasa sendiri"]
    ]
  ],
  [
    "question_id" => "9",
    "question_text" => "9. Kamu merasa waktu paling produktif untuk belajar adalah...",
    "options" => [
      ["label" => "A", "option_id" => "41", "option_text" => "Pagi hari"],
      ["label" => "B", "option_id" => "42", "option_text" => "Siang hari"],
      ["label" => "C", "option_id" => "43", "option_text" => "Sore hari"],
      ["label" => "D", "option_id" => "44", "option_text" => "Malam hari"],
      ["label" => "E", "option_id" => "45", "option_text" => "Kapan saja tergantung suasana hati"]
    ]
  ],
  [
    "question_id" => "10",
    "question_text" => "10. Dalam memecahkan masalah, kamu lebih suka...",
    "options" => [
      ["label" => "A", "option_id" => "46", "option_text" => "Berpikir logis dan sistematis"],
      ["label" => "B", "option_id" => "47", "option_text" => "Mencoba berbagai cara"],
      ["label" => "C", "option_id" => "48", "option_text" => "Berdiskusi dengan orang lain"],
      ["label" => "D", "option_id" => "49", "option_text" => "Mengikuti intuisi"],
      ["label" => "E", "option_id" => "50", "option_text" => "Menunggu waktu yang tepat"]
    ]
  ],
  [
    "question_id" => "11",
    "question_text" => "11. Kamu lebih suka menghabiskan waktu dengan...",
    "options" => [
      ["label" => "A", "option_id" => "51", "option_text" => "Banyak orang dan ramai"],
      ["label" => "B", "option_id" => "52", "option_text" => "Beberapa teman dekat"],
      ["label" => "C", "option_id" => "53", "option_text" => "Sendiri dan tenang"],
      ["label" => "D", "option_id" => "54", "option_text" => "Siapa saja, asal suasananya seru"],
      ["label" => "E", "option_id" => "55", "option_text" => "Dengan orang yang bisa diajak diskusi"]
    ]
  ],
  [
    "question_id" => "12",
    "question_text" => "12. Ketika berbicara di depan kelas, kamu merasa...",
    "options" => [
      ["label" => "A", "option_id" => "56", "option_text" => "Sangat percaya diri"],
      ["label" => "B", "option_id" => "57", "option_text" => "Sedikit gugup tapi bisa mengatasinya"],
      ["label" => "C", "option_id" => "58", "option_text" => "Gugup dan sulit bicara"],
      ["label" => "D", "option_id" => "59", "option_text" => "Lebih suka diam dan mendengarkan"],
      ["label" => "E", "option_id" => "60", "option_text" => "Lebih suka menulis daripada berbicara"]
    ]
  ],
  [
    "question_id" => "13",
    "question_text" => "13. Jika gagal dalam ujian, kamu biasanya...",
    "options" => [
      ["label" => "A", "option_id" => "61", "option_text" => "Mencoba memperbaiki kesalahan"],
      ["label" => "B", "option_id" => "62", "option_text" => "Merasa kecewa tapi bangkit lagi"],
      ["label" => "C", "option_id" => "63", "option_text" => "Menyalahkan keadaan"],
      ["label" => "D", "option_id" => "64", "option_text" => "Tidak peduli karena sudah terbiasa"],
      ["label" => "E", "option_id" => "65", "option_text" => "Mencari cara belajar yang lebih baik"]
    ]
  ],
  [
    "question_id" => "14",
    "question_text" => "14. Dalam pelajaran, kamu lebih tertarik pada...",
    "options" => [
      ["label" => "A", "option_id" => "66", "option_text" => "Pelajaran logika seperti matematika"],
      ["label" => "B", "option_id" => "67", "option_text" => "Pelajaran sosial dan diskusi"],
      ["label" => "C", "option_id" => "68", "option_text" => "Pelajaran seni dan kreativitas"],
      ["label" => "D", "option_id" => "69", "option_text" => "Pelajaran yang berhubungan dengan teknologi"],
      ["label" => "E", "option_id" => "70", "option_text" => "Pelajaran yang berhubungan dengan alam"]
    ]
  ],
  [
    "question_id" => "15",
    "question_text" => "15. Saat dihadapkan dengan beberapa pilihan, kamu...",
    "options" => [
      ["label" => "A", "option_id" => "71", "option_text" => "Cepat memutuskan"],
      ["label" => "B", "option_id" => "72", "option_text" => "Memikirkan semua risiko dulu"],
      ["label" => "C", "option_id" => "73", "option_text" => "Menunggu pendapat orang lain"],
      ["label" => "D", "option_id" => "74", "option_text" => "Menghindari keputusan sulit"],
      ["label" => "E", "option_id" => "75", "option_text" => "Membuat keputusan berdasarkan intuisi"]
    ]
  ],
  [
    "question_id" => "16",
    "question_text" => "16. Kamu paling menikmati kegiatan yang...",
    "options" => [
      ["label" => "A", "option_id" => "76", "option_text" => "Menantang dan penuh tanggung jawab"],
      ["label" => "B", "option_id" => "77", "option_text" => "Santai dan tidak menegangkan"],
      ["label" => "C", "option_id" => "78", "option_text" => "Bersifat sosial dan gotong royong"],
      ["label" => "D", "option_id" => "79", "option_text" => "Berkaitan dengan ide dan kreativitas"],
      ["label" => "E", "option_id" => "80", "option_text" => "Memberikan hasil nyata yang bermanfaat"]
    ]
  ],
  [
    "question_id" => "17",
    "question_text" => "17. Ketika mendapat kritik dari guru, kamu...",
    "options" => [
      ["label" => "A", "option_id" => "81", "option_text" => "Menerima dan memperbaiki diri"],
      ["label" => "B", "option_id" => "82", "option_text" => "Sedikit tersinggung tapi berusaha berubah"],
      ["label" => "C", "option_id" => "83", "option_text" => "Tidak peduli"],
      ["label" => "D", "option_id" => "84", "option_text" => "Membantah dengan alasan sendiri"],
      ["label" => "E", "option_id" => "85", "option_text" => "Merenung dan memperbaiki diam-diam"]
    ]
  ],
  [
    "question_id" => "18",
    "question_text" => "18. Kamu merasa paling percaya diri ketika...",
    "options" => [
      ["label" => "A", "option_id" => "86", "option_text" => "Saat tampil di depan umum"],
      ["label" => "B", "option_id" => "87", "option_text" => "Saat menyelesaikan masalah"],
      ["label" => "C", "option_id" => "88", "option_text" => "Saat mendapat pujian"],
      ["label" => "D", "option_id" => "89", "option_text" => "Saat membantu orang lain"],
      ["label" => "E", "option_id" => "90", "option_text" => "Saat ideku dihargai orang lain"]
    ]
  ],
  [
    "question_id" => "19",
    "question_text" => "19. Dalam organisasi sekolah, kamu ingin berperan sebagai...",
    "options" => [
      ["label" => "A", "option_id" => "91", "option_text" => "Pemimpin atau ketua"],
      ["label" => "B", "option_id" => "92", "option_text" => "Sekretaris atau pencatat"],
      ["label" => "C", "option_id" => "93", "option_text" => "Anggota aktif"],
      ["label" => "D", "option_id" => "94", "option_text" => "Pendukung di belakang layar"],
      ["label" => "E", "option_id" => "95", "option_text" => "Pengamat yang memberi masukan"]
    ]
  ],
  [
    "question_id" => "20",
    "question_text" => "20. Kamu lebih mudah memahami sesuatu jika...",
    "options" => [
      ["label" => "A", "option_id" => "96", "option_text" => "Mendengarkan penjelasan guru"],
      ["label" => "B", "option_id" => "97", "option_text" => "Melihat contoh langsung"],
      ["label" => "C", "option_id" => "98", "option_text" => "Membaca dan mencatat"],
      ["label" => "D", "option_id" => "99", "option_text" => "Mencoba sendiri"],
      ["label" => "E", "option_id" => "100", "option_text" => "Diskusi dengan teman"]
    ]
  ],
  [
    "question_id" => "21",
    "question_text" => "21. Ketika waktu luang, kamu lebih suka...",
    "options" => [
      ["label" => "A", "option_id" => "101", "option_text" => "Main game atau menonton film"],
      ["label" => "B", "option_id" => "102", "option_text" => "Membaca atau belajar hal baru"],
      ["label" => "C", "option_id" => "103", "option_text" => "Ngobrol dengan teman"],
      ["label" => "D", "option_id" => "104", "option_text" => "Berolahraga atau kegiatan fisik"],
      ["label" => "E", "option_id" => "105", "option_text" => "Menulis atau menggambar"]
    ]
  ],
  [
    "question_id" => "22",
    "question_text" => "22. Saat ada konflik di kelas, kamu...",
    "options" => [
      ["label" => "A", "option_id" => "106", "option_text" => "Mencoba jadi penengah"],
      ["label" => "B", "option_id" => "107", "option_text" => "Membiarkan hingga reda sendiri"],
      ["label" => "C", "option_id" => "108", "option_text" => "Langsung menyelesaikan dengan tegas"],
      ["label" => "D", "option_id" => "109", "option_text" => "Menghindar dari konflik"],
      ["label" => "E", "option_id" => "110", "option_text" => "Mendengarkan dua sisi sebelum bertindak"]
    ]
  ],
  [
    "question_id" => "23",
    "question_text" => "23. Kamu lebih fokus pada...",
    "options" => [
      ["label" => "A", "option_id" => "111", "option_text" => "Proses yang berjalan"],
      ["label" => "B", "option_id" => "112", "option_text" => "Hasil akhirnya"],
      ["label" => "C", "option_id" => "113", "option_text" => "Kenyamanan diri sendiri"],
      ["label" => "D", "option_id" => "114", "option_text" => "Pendapat orang lain"],
      ["label" => "E", "option_id" => "115", "option_text" => "Keseimbangan antara proses dan hasil"]
    ]
  ],
  [
    "question_id" => "24",
    "question_text" => "24. Kamu merasa kesuksesan ditentukan oleh...",
    "options" => [
      ["label" => "A", "option_id" => "116", "option_text" => "Kerja keras dan disiplin"],
      ["label" => "B", "option_id" => "117", "option_text" => "Keberuntungan"],
      ["label" => "C", "option_id" => "118", "option_text" => "Relasi dan dukungan orang lain"],
      ["label" => "D", "option_id" => "119", "option_text" => "Bakat alami"],
      ["label" => "E", "option_id" => "120", "option_text" => "Kesempatan yang datang"]
    ]
  ],
  [
    "question_id" => "25",
    "question_text" => "25. Saat melihat orang sukses, kamu merasa...",
    "options" => [
      ["label" => "A", "option_id" => "121", "option_text" => "Termotivasi untuk ikut sukses"],
      ["label" => "B", "option_id" => "122", "option_text" => "Iri dan ingin mengalahkan"],
      ["label" => "C", "option_id" => "123", "option_text" => "Acuh tak acuh"],
      ["label" => "D", "option_id" => "124", "option_text" => "Kagum tapi tidak ingin meniru"],
      ["label" => "E", "option_id" => "125", "option_text" => "Menjadikannya inspirasi untuk berkembang"]
    ]
  ],
  [
    "question_id" => "26",
    "question_text" => "26. Dalam belajar hal baru, kamu lebih suka...",
    "options" => [
      ["label" => "A", "option_id" => "126", "option_text" => "Mencoba langsung"],
      ["label" => "B", "option_id" => "127", "option_text" => "Mendengarkan penjelasan"],
      ["label" => "C", "option_id" => "128", "option_text" => "Membaca teori dulu"],
      ["label" => "D", "option_id" => "129", "option_text" => "Melihat orang lain melakukannya"],
      ["label" => "E", "option_id" => "130", "option_text" => "Berdiskusi sambil mencoba"]
    ]
  ],
  [
    "question_id" => "27",
    "question_text" => "27. Kamu lebih menghargai...",
    "options" => [
      ["label" => "A", "option_id" => "131", "option_text" => "Kejujuran dan tanggung jawab"],
      ["label" => "B", "option_id" => "132", "option_text" => "Kreativitas dan kebebasan"],
      ["label" => "C", "option_id" => "133", "option_text" => "Ketegasan dan keberanian"],
      ["label" => "D", "option_id" => "134", "option_text" => "Ketenangan dan empati"],
      ["label" => "E", "option_id" => "135", "option_text" => "Kerjasama dan rasa hormat"]
    ]
  ],
  [
    "question_id" => "28",
    "question_text" => "28. Dalam menyelesaikan tugas besar, kamu...",
    "options" => [
      ["label" => "A", "option_id" => "136", "option_text" => "Membuat rencana dan jadwal"],
      ["label" => "B", "option_id" => "137", "option_text" => "Langsung mulai tanpa banyak pikir"],
      ["label" => "C", "option_id" => "138", "option_text" => "Menunggu mood baik"],
      ["label" => "D", "option_id" => "139", "option_text" => "Bekerja bersama teman"],
      ["label" => "E", "option_id" => "140", "option_text" => "Membagi waktu agar efisien"]
    ]
  ],
  [
    "question_id" => "29",
    "question_text" => "29. Kamu lebih nyaman bekerja di lingkungan yang...",
    "options" => [
      ["label" => "A", "option_id" => "141", "option_text" => "Tertib dan teratur"],
      ["label" => "B", "option_id" => "142", "option_text" => "Santai tapi produktif"],
      ["label" => "C", "option_id" => "143", "option_text" => "Kreatif dan fleksibel"],
      ["label" => "D", "option_id" => "144", "option_text" => "Bebas tanpa aturan ketat"],
      ["label" => "E", "option_id" => "145", "option_text" => "Kolaboratif dan mendukung"]
    ]
  ],
  [
    "question_id" => "30",
    "question_text" => "30. Ketika menghadapi tekanan, kamu biasanya...",
    "options" => [
      ["label" => "A", "option_id" => "146", "option_text" => "Tetap tenang dan mencari solusi"],
      ["label" => "B", "option_id" => "147", "option_text" => "Sedikit panik tapi tetap mencoba"],
      ["label" => "C", "option_id" => "148", "option_text" => "Langsung menyerah"],
      ["label" => "D", "option_id" => "149", "option_text" => "Membiarkan waktu yang menyelesaikan"],
      ["label" => "E", "option_id" => "150", "option_text" => "Mencari bantuan dari orang yang dipercaya"]
    ]
  ]
];

$prompt_text = "Analisis kepribadian dari jawaban kuesioner berikut. Output harus dalam format JSON yang spesifik:\n\n";
$prompt_text .= "Format Output JSON:\n";
$prompt_text .= "{\n";
$prompt_text .= "  \"personality_type\": \"[Tipe kepribadian singkat, misal: The Innovator]\",\n";
$prompt_text .= "  \"interest_category\": \"[Kategori minat umum, misal: Technology, Arts, Social]\",\n";
$prompt_text .= "  \"summary\": \"[Ringkasan kepribadian panjang]\",\n";
$prompt_text .= "  \"recommendations\": [\"[Profesi 1]\", \"[Profesi 2]\", ...],\n";
$prompt_text .= "  \"analysis_json\": { \"[Aspek1]\": [persen], \"[Aspek2]\": [persen], ... }\n";
$prompt_text .= "}\n\n";
$prompt_text .= "Pastikan \"analysis_json\" memiliki setidaknya 3 aspek dengan persentase yang totalnya tidak harus 100%, melainkan menunjukkan bobot relatif. Pastikan juga 'recommendations' adalah array string. Jika tidak ada respons dari AI, berikan respons JSON default yang valid.\n\n";
$prompt_text .= "Jawaban Kuesioner untuk pengguna ".$username.":\n";

foreach ($user_answers as $question_id => $selected_option_id) {
    $question = null;
    foreach ($quiz_data as $q) {
        if ((string)$q['question_id'] === (string)$question_id) {
            $question = $q;
            break;
        }
    }

    if ($question) {
        $selected_option_text = "Tidak diketahui";
        foreach ($question['options'] as $option) {
            if ((string)$option['option_id'] === (string)$selected_option_id) {
                $selected_option_text = $option['option_text'];
                break;
            }
        }
        $prompt_text .= $question['question_text'] . " Pilihan Anda: " . $selected_option_text . "\n";
    } else {
        error_log("Question ID " . $question_id . " not found in quiz_data.");
    }
}

error_log("Generated Prompt for Gemini: " . $prompt_text);

$post_fields = json_encode([
    'contents' => [
        [
            'parts' => [
                ['text' => $prompt_text]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.7,
        'topP' => 0.95,
        'topK' => 40,
        'maxOutputTokens' => 800,
        "responseMimeType" => "application/json",
    ],
    'safetySettings' => [
        [
            'category' => 'HARM_CATEGORY_HARASSMENT',
            'threshold' => 'BLOCK_NONE',
        ],
        [
            'category' => 'HARM_CATEGORY_HATE_SPEECH',
            'threshold' => 'BLOCK_NONE',
        ],
        [
            'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            'threshold' => 'BLOCK_NONE',
        ],
        [
            'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
            'threshold' => 'BLOCK_NONE',
        ],
    ],
]);

error_log("Sending to Gemini API. Post fields: " . $post_fields);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $gemini_api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

error_log("Gemini API HTTP Code: " . $http_code);
error_log("Gemini API cURL Error: " . $curl_error);
error_log("Gemini API Raw Response: " . $response);

// --- START: Default / Fallback AI Response Logic ---
$default_ai_response = [
    'personality_type' => 'Pembelajar Adaptif',
    'interest_category' => 'Generalis',
    'summary' => 'Maaf, kami tidak dapat menganalisis kepribadian Anda secara mendalam saat ini karena kendala teknis pada layanan AI. Namun, berdasarkan jawaban Anda, Anda tampak memiliki minat yang luas dan kemampuan adaptasi yang baik.',
    'recommendations' => ['Pekerjaan Umum', 'Pekerjaan Fleksibel', 'Pengembangan Diri Berkelanjutan'],
    'analysis_json' => ['Adaptabilitas' => 40, 'Minat_Luas' => 30, 'Potensi_Belajar' => 30]
];
// --- END: Default / Fallback AI Response Logic ---

$ai_parsed_result = $default_ai_response; // Initialize with default
$gemini_api_success = false;
$gemini_message = ''; // To store specific Gemini error/success messages

if ($curl_error) {
    error_log('cURL Error: ' . $curl_error);
    $gemini_message = 'cURL Error saat terhubung ke AI.';
} elseif ($http_code !== 200) {
    $error_details = json_decode($response, true);
    $gemini_error_message = isset($error_details['error']['message']) ? $error_details['error']['message'] : 'Unknown error from Gemini API';
    error_log('Gemini API Error: HTTP ' . $http_code . ' - ' . $gemini_error_message);
    $gemini_message = 'Gemini API Error: ' . $gemini_error_message . ' (HTTP ' . $http_code . ').';
} else {
    $gemini_result = json_decode($response, true);

    if (isset($gemini_result['candidates'][0]['finishReason']) && $gemini_result['candidates'][0]['finishReason'] === 'SAFETY') {
        $safety_ratings = $gemini_result['candidates'][0]['safetyRatings'] ?? [];
        $blocked_categories = [];
        foreach ($safety_ratings as $rating) {
            if ($rating['probability'] === 'HIGH' || $rating['probability'] === 'UNSPECIFIED') {
                $blocked_categories[] = $rating['category'];
            }
        }
        $block_message = 'Konten diblokir oleh filter keamanan AI. Kategori: ' . implode(', ', $blocked_categories);
        error_log('AI response blocked by safety filter: ' . $block_message . '. Raw response: ' . $response);
        $gemini_message = 'Respons AI diblokir oleh filter keamanan.';
    } else {
        $ai_response_text = $gemini_result['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if ($ai_response_text === null) {
            error_log('Unexpected response format from Gemini API: Missing content parts. Raw response: ' . $response);
            $gemini_message = 'Respons AI tidak lengkap.';
        } else {
            error_log("AI Raw Response Text: " . $ai_response_text);
            $cleaned_ai_response_text = preg_replace('/```json\s*|\s*```/', '', $ai_response_text);
            $cleaned_ai_response_text = trim($cleaned_ai_response_text);
            error_log("AI Cleaned Response Text: " . $cleaned_ai_response_text);

            $parsed_temp = json_decode($cleaned_ai_response_text, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('Failed to parse AI response as JSON. JSON Error: ' . json_last_error_msg() . '. Cleaned response: ' . $cleaned_ai_response_text);
                $gemini_message = 'Gagal memproses format AI (JSON invalid).';
            } else {
                $required_keys = ['personality_type', 'interest_category', 'summary', 'recommendations', 'analysis_json'];
                $all_keys_present = true;
                foreach ($required_keys as $key) {
                    if (!isset($parsed_temp[$key])) {
                        error_log("Missing required key in AI parsed result: " . $key . ". Parsed result: " . print_r($parsed_temp, true));
                        $gemini_message = 'Respons AI tidak lengkap (missing ' . $key . ').';
                        $all_keys_present = false;
                        break;
                    }
                }

                if ($all_keys_present) {
                    // Ensure recommendations is always an array
                    if (!is_array($parsed_temp['recommendations'])) {
                        if (is_string($parsed_temp['recommendations']) && !empty($parsed_temp['recommendations'])) {
                            $parsed_temp['recommendations'] = array_map('trim', explode(',', $parsed_temp['recommendations']));
                        } else {
                            $parsed_temp['recommendations'] = [];
                        }
                    }
                    $ai_parsed_result = $parsed_temp;
                    $gemini_api_success = true;
                }
            }
        }
    }
}

// Prepare data for database insertion (either AI result or default fallback)
$data_to_save = $ai_parsed_result; // Start with the AI result (or default if AI failed to parse/generate)
$data_to_save['username'] = $username; // Add username for consistency if needed later

// Override summary with a message if Gemini failed, but we're still saving the default result
if (!$gemini_api_success) {
    $data_to_save['summary'] = $default_ai_response['summary'] . " (Detail error: " . $gemini_message . ")";
    $data_to_save['personality_type'] = $default_ai_response['personality_type'];
    $data_to_save['interest_category'] = $default_ai_response['interest_category'];
    $data_to_save['recommendations'] = $default_ai_response['recommendations'];
    $data_to_save['analysis_json'] = $default_ai_response['analysis_json'];
}


error_log("Attempting to save result to DB. Data: " . print_r($data_to_save, true));

$stmt_insert = $conn->prepare("
  INSERT INTO results
  (user_id, personality_type, interest_category, summary, recommendations, analysis_json)
  VALUES (?, ?, ?, ?, ?, ?)
");

if (!$stmt_insert) {
    error_log("Failed to prepare INSERT statement: " . $conn->error);
    echo json_encode(["status" => "error", "message" => "Terjadi kesalahan server: Gagal menyiapkan penyimpanan data hasil. Mohon coba lagi.", 'result' => array_merge(['username' => $username], $default_ai_response)]);
    $conn->close();
    exit();
}

$recommendations_str = json_encode($data_to_save['recommendations']);
$analysis_json_str = json_encode($data_to_save['analysis_json']);

$personality_type = (string)$data_to_save['personality_type'];
$interest_category = (string)$data_to_save['interest_category'];
$summary = (string)$data_to_save['summary'];

$stmt_insert->bind_param(
  "isssss",
  $user_id,
  $personality_type,
  $interest_category,
  $summary,
  $recommendations_str,
  $analysis_json_str
);

if (!$stmt_insert->execute()) {
    error_log("Failed to save AI analysis result to database: " . $stmt_insert->error);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal menyimpan hasil analisis ke database. Anda bisa coba kembali nanti. (Detail: " . $stmt_insert->error . ")",
        'result' => array_merge(['username' => $username], $default_ai_response) // Still provide default for display
    ]);
    $stmt_insert->close();
    $conn->close();
    exit();
}
$stmt_insert->close();

error_log("Quiz processing successful for user_id: " . $user_id . ". Result saved to DB.");
echo json_encode([
    'status' => 'success',
    'message' => $gemini_api_success ? 'Analisis kepribadian berhasil disimpan.' : 'Analisis kepribadian berhasil disimpan (menggunakan data default karena kendala AI).',
    'result' => $data_to_save // Send the data that was successfully saved
]);
$conn->close();

?>