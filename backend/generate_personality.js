// generate_personality.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fetch from 'node-fetch'; // Perlu diinstal: npm install node-fetch

// Ganti dengan API Key Gemini Anda
const GEMINI_API_KEY = "AIzaSyAVTzcmqJ0aFtL81Cq9mSMgPuxBXjuvBDo"; // <-- GANTI DENGAN KUNCI API ANDA
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const quizData = [
  {
    question_id: "1",
    question_text: "1. Ketika menghadapi tugas baru di sekolah, apa yang biasanya kamu lakukan?",
    options: [
      { label: "A", option_id: "1", option_text: "Mencoba memahaminya sendiri dulu" },
      { label: "B", option_id: "2", option_text: "Bertanya pada teman atau guru" },
      { label: "C", option_id: "3", option_text: "Menunda sampai paham betul caranya" },
      { label: "D", option_id: "4", option_text: "Mencari referensi dari internet" },
      { label: "E", option_id: "5", option_text: "Menunggu penjelasan lebih lanjut dari guru" }
    ]
  },
  {
    question_id: "2",
    question_text: "2. Dalam bekerja kelompok, kamu lebih suka...",
    options: [
      { label: "A", option_id: "6", option_text: "Memimpin dan mengatur tugas" },
      { label: "B", option_id: "7", option_text: "Menjalankan tugas sesuai arahan" },
      { label: "C", option_id: "8", option_text: "Mendukung dengan ide dan semangat" },
      { label: "D", option_id: "9", option_text: "Mengamati dari belakang" },
      { label: "E", option_id: "10", option_text: "Mengerjakan bagian sendiri dengan tenang" }
    ]
  },
  {
    question_id: "3",
    question_text: "3. Jika ada lomba yang menantang, kamu akan...",
    options: [
      { label: "A", option_id: "11", option_text: "Langsung mendaftar dan mencoba" },
      { label: "B", option_id: "12", option_text: "Menunggu teman yang ikut dulu" },
      { label: "C", option_id: "13", option_text: "Mempertimbangkan untung ruginya" },
      { label: "D", option_id: "14", option_text: "Tidak tertarik jika terlalu sulit" },
      { label: "E", option_id: "15", option_text: "Mendukung dari belakang layar" }
    ]
  },
  {
    question_id: "4",
    question_text: "4. Saat ujian, kamu lebih nyaman belajar dengan...",
    options: [
      { label: "A", option_id: "16", option_text: "Belajar bersama teman" },
      { label: "B", option_id: "17", option_text: "Belajar sendiri di tempat tenang" },
      { label: "C", option_id: "18", option_text: "Belajar dengan musik" },
      { label: "D", option_id: "19", option_text: "Belajar lewat video" },
      { label: "E", option_id: "20", option_text: "Belajar lewat praktik langsung" }
    ]
  },
  {
    question_id: "5",
    question_text: "5. Ketika guru memberikan tugas tanpa batas waktu, kamu akan...",
    options: [
      { label: "A", option_id: "21", option_text: "Langsung mengerjakannya supaya cepat selesai" },
      { label: "B", option_id: "22", option_text: "Menunda hingga waktu mendesak" },
      { label: "C", option_id: "23", option_text: "Mengerjakannya sedikit demi sedikit" },
      { label: "D", option_id: "24", option_text: "Menunggu inspirasi datang" },
      { label: "E", option_id: "25", option_text: "Menunggu teman mengingatkan" }
    ]
  },
  {
    question_id: "6",
    question_text: "6. Dalam mengambil keputusan penting, kamu lebih mengandalkan...",
    options: [
      { label: "A", option_id: "26", option_text: "Pertimbangan logika dan data" },
      { label: "B", option_id: "27", option_text: "Intuisi dan perasaan" },
      { label: "C", option_id: "28", option_text: "Pendapat orang lain" },
      { label: "D", option_id: "29", option_text: "Keuntungan pribadi" },
      { label: "E", option_id: "30", option_text: "Gabungan semua pertimbangan di atas" }
    ]
  },
  {
    question_id: "7",
    question_text: "7. Kamu merasa paling bersemangat ketika...",
    options: [
      { label: "A", option_id: "31", option_text: "Bekerja dalam tim yang solid" },
      { label: "B", option_id: "32", option_text: "Belajar hal baru yang menarik" },
      { label: "C", option_id: "33", option_text: "Membantu orang lain" },
      { label: "D", option_id: "34", option_text: "Mencapai target pribadi" },
      { label: "E", option_id: "35", option_text: "Mendapat pengakuan atas hasil kerja" }
    ]
  },
  {
    question_id: "8",
    question_text: "8. Jika ada teman yang sedang kesulitan, kamu akan...",
    options: [
      { label: "A", option_id: "36", option_text: "Langsung membantu semampunya" },
      { label: "B", option_id: "37", option_text: "Memberi saran agar mandiri" },
      { label: "C", option_id: "38", option_text: "Membiarkannya hingga diminta" },
      { label: "D", option_id: "39", option_text: "Meminta orang lain untuk bantu" },
      { label: "E", option_id: "40", option_text: "Menemani agar tidak merasa sendiri" }
    ]
  },
  {
    question_id: "9",
    question_text: "9. Kamu merasa waktu paling produktif untuk belajar adalah...",
    options: [
      { label: "A", option_id: "41", option_text: "Pagi hari" },
      { label: "B", option_id: "42", option_text: "Siang hari" },
      { label: "C", option_id: "43", option_text: "Sore hari" },
      { label: "D", option_id: "44", option_text: "Malam hari" },
      { label: "E", option_id: "45", option_text: "Kapan saja tergantung suasana hati" }
    ]
  },
  {
    question_id: "10",
    question_text: "10. Dalam memecahkan masalah, kamu lebih suka...",
    options: [
      { label: "A", option_id: "46", option_text: "Berpikir logis dan sistematis" },
      { label: "B", option_id: "47", option_text: "Mencoba berbagai cara" },
      { label: "C", option_id: "48", option_text: "Berdiskusi dengan orang lain" },
      { label: "D", option_id: "49", option_text: "Mengikuti intuisi" },
      { label: "E", option_id: "50", option_text: "Menunggu waktu yang tepat" }
    ]
  },
  {
    question_id: "11",
    question_text: "11. Kamu lebih suka menghabiskan waktu dengan...",
    options: [
      { label: "A", option_id: "51", option_text: "Banyak orang dan ramai" },
      { label: "B", option_id: "52", option_text: "Beberapa teman dekat" },
      { label: "C", option_id: "53", option_text: "Sendiri dan tenang" },
      { label: "D", option_id: "54", option_text: "Siapa saja, asal suasananya seru" },
      { label: "E", option_id: "55", option_text: "Dengan orang yang bisa diajak diskusi" }
    ]
  },
  {
    question_id: "12",
    question_text: "12. Ketika berbicara di depan kelas, kamu merasa...",
    options: [
      { label: "A", option_id: "56", option_text: "Sangat percaya diri" },
      { label: "B", option_id: "57", option_text: "Sedikit gugup tapi bisa mengatasinya" },
      { label: "C", option_id: "58", option_text: "Gugup dan sulit bicara" },
      { label: "D", option_id: "59", option_text: "Lebih suka diam dan mendengarkan" },
      { label: "E", option_id: "60", option_text: "Lebih suka menulis daripada berbicara" }
    ]
  },
  {
    question_id: "13",
    question_text: "13. Jika gagal dalam ujian, kamu biasanya...",
    options: [
      { label: "A", option_id: "61", option_text: "Mencoba memperbaiki kesalahan" },
      { label: "B", option_id: "62", option_text: "Merasa kecewa tapi bangkit lagi" },
      { label: "C", option_id: "63", option_text: "Menyalahkan keadaan" },
      { label: "D", option_id: "64", option_text: "Tidak peduli karena sudah terbiasa" },
      { label: "E", option_id: "65", option_text: "Mencari cara belajar yang lebih baik" }
    ]
  },
  {
    question_id: "14",
    question_text: "14. Dalam pelajaran, kamu lebih tertarik pada...",
    options: [
      { label: "A", option_id: "66", option_text: "Pelajaran logika seperti matematika" },
      { label: "B", option_id: "67", option_text: "Pelajaran sosial dan diskusi" },
      { label: "C", option_id: "68", option_text: "Pelajaran seni dan kreativitas" },
      { label: "D", option_id: "69", option_text: "Pelajaran yang berhubungan dengan teknologi" },
      { label: "E", option_id: "70", option_text: "Pelajaran yang berhubungan dengan alam" }
    ]
  },
  {
    question_id: "15",
    question_text: "15. Saat dihadapkan dengan beberapa pilihan, kamu...",
    options: [
      { label: "A", option_id: "71", option_text: "Cepat memutuskan" },
      { label: "B", option_id: "72", option_text: "Memikirkan semua risiko dulu" },
      { label: "C", option_id: "73", option_text: "Menunggu pendapat orang lain" },
      { label: "D", option_id: "74", option_text: "Menghindari keputusan sulit" },
      { label: "E", option_id: "75", option_text: "Membuat keputusan berdasarkan intuisi" }
    ]
  },
  {
    question_id: "16",
    question_text: "16. Kamu paling menikmati kegiatan yang...",
    options: [
      { label: "A", option_id: "76", option_text: "Menantang dan penuh tanggung jawab" },
      { label: "B", option_id: "77", option_text: "Santai dan tidak menegangkan" },
      { label: "C", option_id: "78", option_text: "Bersifat sosial dan gotong royong" },
      { label: "D", option_id: "79", option_text: "Berkaitan dengan ide dan kreativitas" },
      { label: "E", option_id: "80", option_text: "Memberikan hasil nyata yang bermanfaat" }
    ]
  },
  {
    question_id: "17",
    question_text: "17. Ketika mendapat kritik dari guru, kamu...",
    options: [
      { label: "A", option_id: "81", option_text: "Menerima dan memperbaiki diri" },
      { label: "B", option_id: "82", option_text: "Sedikit tersinggung tapi berusaha berubah" },
      { label: "C", option_id: "83", option_text: "Tidak peduli" },
      { label: "D", option_id: "84", option_text: "Membantah dengan alasan sendiri" },
      { label: "E", option_id: "85", option_text: "Merenung dan memperbaiki diam-diam" }
    ]
  },
  {
    question_id: "18",
    question_text: "18. Kamu merasa paling percaya diri ketika...",
    options: [
      { label: "A", option_id: "86", option_text: "Saat tampil di depan umum" },
      { label: "B", option_id: "87", option_text: "Saat menyelesaikan masalah" },
      { label: "C", option_id: "88", option_text: "Saat mendapat pujian" },
      { label: "D", option_id: "89", option_text: "Saat membantu orang lain" },
      { label: "E", option_id: "90", option_text: "Saat ideku dihargai orang lain" }
    ]
  },
  {
    question_id: "19",
    question_text: "19. Dalam organisasi sekolah, kamu ingin berperan sebagai...",
    options: [
      { label: "A", option_id: "91", option_text: "Pemimpin atau ketua" },
      { label: "B", option_id: "92", option_text: "Sekretaris atau pencatat" },
      { label: "C", option_id: "93", option_text: "Anggota aktif" },
      { label: "D", option_id: "94", option_text: "Pendukung di belakang layar" },
      { label: "E", option_id: "95", option_text: "Pengamat yang memberi masukan" }
    ]
  },
  {
    question_id: "20",
    question_text: "20. Kamu lebih mudah memahami sesuatu jika...",
    options: [
      { label: "A", option_id: "96", option_text: "Mendengarkan penjelasan guru" },
      { label: "B", option_id: "97", option_text: "Melihat contoh langsung" },
      { label: "C", option_id: "98", option_text: "Membaca dan mencatat" },
      { label: "D", option_id: "99", option_text: "Mencoba sendiri" },
      { label: "E", option_id: "100", option_text: "Diskusi dengan teman" }
    ]
  },
  {
    question_id: "21",
    question_text: "21. Ketika waktu luang, kamu lebih suka...",
    options: [
      { label: "A", option_id: "101", option_text: "Main game atau menonton film" },
      { label: "B", option_id: "102", option_text: "Membaca atau belajar hal baru" },
      { label: "C", option_id: "103", option_text: "Ngobrol dengan teman" },
      { label: "D", option_id: "104", option_text: "Berolahraga atau kegiatan fisik" },
      { label: "E", option_id: "105", option_text: "Menulis atau menggambar" }
    ]
  },
  {
    question_id: "22",
    question_text: "22. Saat ada konflik di kelas, kamu...",
    options: [
      { label: "A", option_id: "106", option_text: "Mencoba jadi penengah" },
      { label: "B", option_id: "107", option_text: "Membiarkan hingga reda sendiri" },
      { label: "C", option_id: "108", option_text: "Langsung menyelesaikan dengan tegas" },
      { label: "D", option_id: "109", option_text: "Menghindar dari konflik" },
      { label: "E", option_id: "110", option_text: "Mendengarkan dua sisi sebelum bertindak" }
    ]
  },
  {
    question_id: "23",
    question_text: "23. Kamu lebih fokus pada...",
    options: [
      { label: "A", option_id: "111", option_text: "Proses yang berjalan" },
      { label: "B", option_id: "112", option_text: "Hasil akhirnya" },
      { label: "C", option_id: "113", option_text: "Kenyamanan diri sendiri" },
      { label: "D", option_id: "114", option_text: "Pendapat orang lain" },
      { label: "E", option_id: "115", option_text: "Keseimbangan antara proses dan hasil" }
    ]
  },
  {
    question_id: "24",
    question_text: "24. Kamu merasa kesuksesan ditentukan oleh...",
    options: [
      { label: "A", option_id: "116", option_text: "Kerja keras dan disiplin" },
      { label: "B", option_id: "117", option_text: "Keberuntungan" },
      { label: "C", option_id: "118", option_text: "Relasi dan dukungan orang lain" },
      { label: "D", option_id: "119", option_text: "Bakat alami" },
      { label: "E", option_id: "120", option_text: "Kesempatan yang datang" }
    ]
  },
  {
    question_id: "25",
    question_text: "25. Saat melihat orang sukses, kamu merasa...",
    options: [
      { label: "A", option_id: "121", option_text: "Termotivasi untuk ikut sukses" },
      { label: "B", option_id: "122", option_text: "Iri dan ingin mengalahkan" },
      { label: "C", option_id: "123", option_text: "Acuh tak acuh" },
      { label: "D", option_id: "124", option_text: "Kagum tapi tidak ingin meniru" },
      { label: "E", option_id: "125", option_text: "Menjadikannya inspirasi untuk berkembang" }
    ]
  },
  {
    question_id: "26",
    question_text: "26. Dalam belajar hal baru, kamu lebih suka...",
    options: [
      { label: "A", option_id: "126", option_text: "Mencoba langsung" },
      { label: "B", option_id: "127", option_text: "Mendengarkan penjelasan" },
      { label: "C", option_id: "128", option_text: "Membaca teori dulu" },
      { label: "D", option_id: "129", option_text: "Melihat orang lain melakukannya" },
      { label: "E", option_id: "130", option_text: "Berdiskusi sambil mencoba" }
    ]
  },
  {
    question_id: "27",
    question_text: "27. Kamu lebih menghargai...",
    options: [
      { label: "A", option_id: "131", option_text: "Kejujuran dan tanggung jawab" },
      { label: "B", option_id: "132", option_text: "Kreativitas dan kebebasan" },
      { label: "C", option_id: "133", option_text: "Ketegasan dan keberanian" },
      { label: "D", option_id: "134", option_text: "Ketenangan dan empati" },
      { label: "E", option_id: "135", option_text: "Kerjasama dan rasa hormat" }
    ]
  },
  {
    question_id: "28",
    question_text: "28. Dalam menyelesaikan tugas besar, kamu...",
    options: [
      { label: "A", option_id: "136", option_text: "Membuat rencana dan jadwal" },
      { label: "B", option_id: "137", option_text: "Langsung mulai tanpa banyak pikir" },
      { label: "C", option_id: "138", option_text: "Menunggu mood baik" },
      { label: "D", option_id: "139", option_text: "Bekerja bersama teman" },
      { label: "E", option_id: "140", option_text: "Membagi waktu agar efisien" }
    ]
  },
  {
    question_id: "29",
    question_text: "29. Kamu lebih nyaman bekerja di lingkungan yang...",
    options: [
      { label: "A", option_id: "141", option_text: "Tertib dan teratur" },
      { label: "B", option_id: "142", option_text: "Santai tapi produktif" },
      { label: "C", option_id: "143", option_text: "Kreatif dan fleksibel" },
      { label: "D", option_id: "144", option_text: "Bebas tanpa aturan ketat" },
      { label: "E", option_id: "145", option_text: "Kolaboratif dan mendukung" }
    ]
  },
  {
    question_id: "30",
    question_text: "30. Ketika menghadapi tekanan, kamu biasanya...",
    options: [
      { label: "A", option_id: "146", option_text: "Tetap tenang dan mencari solusi" },
      { label: "B", option_id: "147", option_text: "Sedikit panik tapi tetap mencoba" },
      { label: "C", option_id: "148", option_text: "Langsung menyerah" },
      { label: "D", option_id: "149", option_text: "Membiarkan waktu yang menyelesaikan" },
      { label: "E", option_id: "150", option_text: "Mencari bantuan dari orang yang dipercaya" }
    ]
  }
];

// Fungsi untuk membangun prompt dari jawaban pengguna
function buildPrompt(username, userAnswers) {
  let promptText = "Anda adalah seorang analis kepribadian profesional. Berikan analisis kepribadian dari jawaban kuesioner berikut ini. Output harus dalam format JSON yang spesifik, **tanpa teks tambahan sebelum atau sesudah blok JSON**, dan dibungkus dengan ```json```.\n\n";
  promptText += "Format Output JSON:\n";
  promptText += "```json\n";
  promptText += "{\n";
  promptText += "  \"personality_type\": \"[Tipe kepribadian singkat, misal: The Innovator]\",\n";
  promptText += "  \"interest_category\": \"[Kategori minat umum, misal: Technology, Arts, Social]\",\n";
  promptText += "  \"summary\": \"[Ringkasan kepribadian panjang, maksimal 5 paragraf]\",\n";
  promptText += "  \"recommendations\": [\"[Profesi 1]\", \"[Profesi 2]\", \"[Profesi 3]\", \"[Profesi 4]\"],\n";
  promptText += "  \"analysis_json\": { \"[Aspek1]\": [persen], \"[Aspek2]\": [persen], \"[Aspek3]\": [persen], \"[Aspek4]\": [persen] }\n";
  promptText += "}\n";
  promptText += "```\n\n";
  promptText += "Pastikan \"analysis_json\" memiliki setidaknya 4 aspek dengan persentase (angka) yang totalnya tidak harus 100%, melainkan menunjukkan bobot relatif. Pastikan juga 'recommendations' adalah array string dengan 4 profesi yang relevan. Jika Anda tidak dapat menghasilkan analisis yang valid, berikan pesan error yang jelas di dalam field 'summary' dan berikan nilai null/kosong untuk field lainnya. Jangan berikan respons JSON default yang valid.\n\n";
  promptText += `Berikut jawaban kuesioner dari pengguna ${username}:\n`;

  for (const qId in userAnswers) {
    const selectedOptionId = userAnswers[qId];
    const question = quizData.find(q => q.question_id === qId);

    if (question) {
      const selectedOption = question.options.find(opt => opt.option_id === selectedOptionId);
      const selectedOptionText = selectedOption ? selectedOption.option_text : "Tidak diketahui";
      promptText += `${question.question_text} Pilihan Anda: ${selectedOptionText}\n`;
    } else {
      console.warn(`Question ID ${qId} not found in quiz_data.`);
    }
  }
  return promptText;
}

// Fungsi utama untuk memproses kuesioner
async function processQuiz(userId, username, userAnswers) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = buildPrompt(username, userAnswers);
  console.log("Generated Prompt for Gemini:", prompt);

  let aiParsedResult = {
    personality_type: null,
    interest_category: null,
    summary: 'Maaf, analisis kepribadian tidak dapat dilakukan.',
    recommendations: [],
    analysis_json: {},
  };
  let geminiApiSuccess = false;
  let geminiMessage = '';

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4000, // Tingkatkan ini berdasarkan log sebelumnya
        responseMimeType: "application/json",
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const response = await result.response;
    const finishReason = response.candidates?.[0]?.finishReason;

    if (finishReason === 'SAFETY') {
      const safetyRatings = response.candidates?.[0]?.safetyRatings || [];
      const blockedCategories = safetyRatings.filter(r => r.probability === 'HIGH' || r.probability === 'UNSPECIFIED').map(r => r.category);
      geminiMessage = `Respons AI diblokir oleh filter keamanan. Kategori: ${blockedCategories.join(', ')}.`;
      console.warn("AI response blocked by safety filter:", geminiMessage);
    } else if (finishReason === 'MAX_TOKENS') {
        geminiMessage = `Analisis AI tidak lengkap karena mencapai batas token (${response.usageMetadata?.totalTokenCount || 'unknown'} / ${response.usageMetadata?.maxOutputTokens || 'unknown'}). Coba lagi atau persingkat permintaan.`;
        console.error("AI response hit MAX_TOKENS:", geminiMessage);
    }
    else {
      const aiResponseText = response.text();
      console.log("AI Raw Response Text:", aiResponseText);

      // Membersihkan pembungkus JSON
      const cleanedAiResponseText = aiResponseText.replace(/```json\s*|```/g, '').trim();
      console.log("AI Cleaned Response Text:", cleanedAiResponseText);

      try {
        const parsedTemp = JSON.parse(cleanedAiResponseText);

        const requiredKeys = ['personality_type', 'interest_category', 'summary', 'recommendations', 'analysis_json'];
        const allKeysPresent = requiredKeys.every(key => parsedTemp.hasOwnProperty(key));

        if (allKeysPresent) {
          if (!Array.isArray(parsedTemp.recommendations)) {
            parsedTemp.recommendations = String(parsedTemp.recommendations).split(',').map(s => s.trim()).filter(s => s);
          }
          if (typeof parsedTemp.analysis_json !== 'object' || parsedTemp.analysis_json === null) {
            parsedTemp.analysis_json = {};
          }
          aiParsedResult = parsedTemp;
          geminiApiSuccess = true;
          geminiMessage = 'Analisis AI berhasil.';
        } else {
          geminiMessage = 'Respons AI tidak lengkap (missing key).';
          console.error("Missing required keys in AI response:", parsedTemp);
        }
      } catch (jsonError) {
        geminiMessage = `Gagal memproses format AI (JSON invalid): ${jsonError.message}.`;
        console.error("Failed to parse AI response as JSON:", jsonError, "Cleaned response:", cleanedAiResponseText);
      }
    }
  } catch (error) {
    geminiMessage = `Terjadi kesalahan saat memanggil API Gemini: ${error.message}.`;
    console.error("Error calling Gemini API:", error);
  }

  if (!geminiApiSuccess) {
    aiParsedResult.personality_type = null;
    aiParsedResult.interest_category = null;
    aiParsedResult.summary = `Maaf, analisis kepribadian gagal. ${geminiMessage}`;
    aiParsedResult.recommendations = [];
    aiParsedResult.analysis_json = {};
  }

  // Siapkan data untuk dikirim ke PHP
  const dataToSave = {
    user_id: userId,
    username: username,
    personality_type: aiParsedResult.personality_type,
    interest_category: aiParsedResult.interest_category,
    summary: aiParsedResult.summary,
    recommendations: aiParsedResult.recommendations,
    analysis_json: aiParsedResult.analysis_json,
  };

  // Mengirim data ke PHP endpoint
  const phpEndpoint = 'http://localhost/YOUR_PHP_ENDPOINT.php'; // GANTI DENGAN URL PHP ENDPOINT ANDA
  try {
    console.log("Sending data to PHP endpoint:", dataToSave);
    const phpResponse = await fetch(phpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    });

    const phpResult = await phpResponse.json();
    console.log("PHP Endpoint Response:", phpResult);
    return { status: 'success', aiResult: aiParsedResult, phpResult: phpResult };
  } catch (phpError) {
    console.error("Error sending data to PHP endpoint:", phpError);
    return { status: 'error', message: `Gagal mengirim data ke PHP: ${phpError.message}`, aiResult: aiParsedResult };
  }
}

// Contoh penggunaan (ini bisa dipanggil dari API lain atau scheduler)
// Anda bisa membuat endpoint Node.js yang menerima POST request dengan user_id dan jawaban,
// lalu memanggil processQuiz dari situ.
// Misal, menggunakan Express.js:
/*
import express from 'express';
const app = express();
app.use(express.json());

app.post('/analyze-quiz', async (req, res) => {
    const { user_id, username, answers } = req.body;
    if (!user_id || !username || !answers) {
        return res.status(400).json({ status: 'error', message: 'Missing user_id, username, or answers' });
    }
    const result = await processQuiz(user_id, username, answers);
    res.json(result);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Node.js server running on port ${PORT}`));
*/

// Untuk testing langsung:
// const testUserId = 50;
// const testUsername = "asa";
// const testUserAnswers = {
//   "1": "3", "2": "6", "3": "11", "4": "16", "5": "24", "6": "29", "7": "35", "8": "36", "9": "42", "10": "47",
//   "11": "53", "12": "56", "13": "61", "14": "68", "15": "73", "16": "79", "17": "81", "18": "86", "19": "94", "20": "99",
//   "21": "105", "22": "106", "23": "112", "24": "116", "25": "124", "26": "128", "27": "133", "28": "137", "29": "144", "30": "146"
// };
// processQuiz(testUserId, testUsername, testUserAnswers).then(console.log);