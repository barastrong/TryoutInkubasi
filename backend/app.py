import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from openai import OpenAI, OpenAIError
from dotenv import load_dotenv
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'inkubasi',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable tidak diatur.")

client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

MAX_AI_RETRIES = 3
AI_RETRY_DELAY_SECONDS = 5

def extract_openai_error_message(e: OpenAIError):
    error_detail = "API error tidak diketahui"
    try:
        if hasattr(e, 'response') and e.response:
            error_json = e.response.json()
            if 'error' in error_json and 'message' in error_json['error']:
                error_detail = error_json['error']['message']
            else:
                error_detail = str(error_json)
        elif hasattr(e, 'message'):
            error_detail = e.message
        else:
            error_detail = str(e)
    except Exception:
        error_detail = str(e)
    return error_detail

@app.route('/register_user', methods=['POST'])
def register_user():
    if not request.is_json:
        return jsonify({'status': 'error', 'message': 'Content-Type harus application/json'}), 400

    data = request.get_json()

    if not data or 'username' not in data or not data['username']:
        return jsonify({'status': 'error', 'message': 'Username tidak boleh kosong'}), 400

    username = data['username']
    user_id = None
    conn = None

    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            sql = "INSERT INTO users (username) VALUES (%s)"
            cursor.execute(sql, (username,))
            conn.commit()
            user_id = cursor.lastrowid

        return jsonify({'status': 'success', 'user_id': user_id}), 201

    except pymysql.Error as e:
        print(f"Database error: {e}")
        return jsonify({'status': 'error', 'message': 'Terjadi kesalahan pada database'}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({'status': 'error', 'message': 'Terjadi kesalahan internal server'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/generate_questions_ai', methods=['GET'])
def generate_questions_ai():
    ai_response_text = ""
    for attempt in range(MAX_AI_RETRIES):
        try:
            prompt_content = """
            Buatkan 30 pertanyaan pilihan ganda yang dirancang untuk menggali "potensi diri, minat, dan karakter psikologis" seseorang.
            Setiap pertanyaan harus memiliki 4 pilihan jawaban (A, B, C, D) yang relevan dan mencerminkan spektrum respons.
            OUTPUT HANYA DALAM FORMAT JSON array berikut (JANGAN SERTAKAN TEKS PENJELASAN ATAU MARKDOWN SELAIN JSON):
            [
                {
                    "question_id": 1,
                    "question_text": "Ketika dihadapkan pada tugas baru yang menantang, reaksi pertama Anda adalah...",
                    "options": [
                        {"option_id": 1, "option_text": "A. Merasa cemas dan ragu untuk memulai"},
                        {"option_id": 2, "option_text": "B. Antusias dan segera mencari cara untuk menyelesaikannya"},
                        {"option_id": 3, "option_text": "C. Mencari bantuan dari orang lain sebelum mencoba sendiri"},
                        {"option_id": 4, "option_text": "D. Menunda hingga menit terakhir"}
                    ]
                }
            ]
            Pastikan setiap pertanyaan memiliki 'question_id' unik yang berurutan, 'question_text', dan array 'options' yang berisi objek dengan 'option_id' unik dan 'option_text'.
            """

            response = client.chat.completions.create(
                model="gemini-flash-latest",
                messages=[
                    {"role": "system", "content": "Anda adalah asisten yang membantu membuat soal psikologi. Keluarkan output HANYA JSON tanpa teks lain."},
                    {"role": "user", "content": prompt_content}
                ]
            )

            ai_response_text = response.choices[0].message.content
            if not ai_response_text:
                raise Exception("AI gagal menghasilkan teks pertanyaan.")
            break
        except OpenAIError as e:
            error_msg = extract_openai_error_message(e)
            print(f"Percobaan {attempt+1} gagal untuk membuat soal (API Error): {error_msg}")
            if attempt < MAX_AI_RETRIES - 1 and hasattr(e, 'status_code') and e.status_code in [429, 500, 503]:
                time.sleep(AI_RETRY_DELAY_SECONDS * (attempt + 1))
            else:
                return jsonify({'status': 'error', 'message': f'AI gagal membuat soal setelah {MAX_AI_RETRIES} percobaan: {error_msg}'}), 500
        except Exception as e:
            print(f"Percobaan {attempt+1} gagal untuk membuat soal (Internal Error): {e}")
            if attempt < MAX_AI_RETRIES - 1:
                time.sleep(AI_RETRY_DELAY_SECONDS * (attempt + 1))
            else:
                return jsonify({'status': 'error', 'message': f'Terjadi kesalahan tak terduga saat membuat soal setelah {MAX_AI_RETRIES} percobaan: {e}'}), 500

    try:
        raw_json_string = ai_response_text.strip()
        if raw_json_string.startswith("```json"):
            raw_json_string = raw_json_string[len("```json"):].strip()
        if raw_json_string.endswith("```"):
            raw_json_string = raw_json_string[:-len("```")].strip()

        try:
            generated_questions_raw = json.loads(raw_json_string)
        except json.JSONDecodeError:
            json_match = re.search(r'\[\s*{[\s\S]*}\s*\]', raw_json_string)
            if json_match:
                generated_questions_raw = json.loads(json_match.group(0))
            else:
                raise

        formatted_questions = []
        question_id_counter = 1
        for q_data in generated_questions_raw:
            question_obj = {
                'question_id': question_id_counter,
                'question_text': q_data.get('question_text', ''),
                'options': []
            }

            option_id_counter = 1
            for i, option_item in enumerate(q_data.get('options', [])):
                if isinstance(option_item, dict) and 'option_text' in option_item:
                    question_obj['options'].append({
                        'label': chr(65 + i),
                        'option_id': option_item.get('option_id', option_id_counter),
                        'option_text': option_item['option_text'].lstrip(chr(65+i) + '. ').strip()
                    })
                elif isinstance(option_item, str):
                    question_obj['options'].append({
                        'label': chr(65 + i),
                        'option_id': option_id_counter,
                        'option_text': option_item.lstrip(chr(65+i) + '. ').strip()
                    })
                option_id_counter += 1
            formatted_questions.append(question_obj)
            question_id_counter += 1

        return jsonify(formatted_questions), 200

    except json.JSONDecodeError as e:
        print(f"JSON decoding error from AI response: {e}")
        print(f"Raw AI response: \n{ai_response_text}")
        return jsonify({'status': 'error', 'message': 'AI menghasilkan format JSON yang tidak valid. Gagal memproses respons AI.'}), 500
    except Exception as e:
        print(f"An unexpected error occurred during processing AI questions: {e}")
        return jsonify({'status': 'error', 'message': f'Terjadi kesalahan internal server saat memproses soal AI: {e}'}), 500

@app.route('/submit_answers', methods=['POST'])
def submit_answers():
    if not request.is_json:
        return jsonify({'status': 'error', 'message': 'Content-Type harus application/json'}), 400

    data = request.get_json()
    user_id = data.get('user_id')
    username = data.get('username')
    user_answers_formatted = data.get('answers_for_ai')

    if not user_id or not username or not user_answers_formatted:
        return jsonify({'status': 'error', 'message': 'Data tidak lengkap (user_id, username, atau answers_for_ai kosong)'}), 400

    conn = None
    ai_fallback_message = None
    ai_analysis_text = ""
    for attempt in range(MAX_AI_RETRIES):
        try:
            answers_text = json.dumps(user_answers_formatted, indent=2)

            analysis_prompt = f"""
            Anda adalah seorang psikolog ahli. Berikan analisis tes kepribadian berdasarkan daftar pertanyaan dan jawaban yang dipilih oleh pengguna.
            OUTPUT HANYA DALAM FORMAT JSON BERIKUT (JANGAN SERTAKAN TEKS PENJELASAN ATAU MARKDOWN SELAIN JSON):

            {{
              "personality_type": "Tipe Kepribadian (contoh: 'Intuitif Analitis')",
              "interest_category": "Kategori Minat (contoh: 'Seni dan Kreativitas')",
              "summary": "Ringkasan komprehensif tentang kepribadian pengguna (minimal 200 kata, maksimal 400 kata).",
              "recommendations": ["Rekomendasi profesi 1", "Rekomendasi profesi 2", "Rekomendasi profesi 3", "Rekomendasi profesi 4", "Rekomendasi profesi 5"],
              "analysis_json": {{
                "Aspek_A": persentase_skor_A,
                "Aspek_B": persentase_skor_B,
                "Aspek_C": persentase_skor_C,
                "Aspek_D": persentase_skor_D,
                "Aspek_E": persentase_skor_E
              }}
            }}

            Pastikan analysis_json memiliki 5 aspek yang berbeda (gunakan underscore, misal: Aspek_A) dan total persentase mendekati 100.
            Berikut adalah data pertanyaan dan jawaban pengguna:
            {answers_text}
            """

            response = client.chat.completions.create(
                model="gemini-flash-latest",
                messages=[
                    {"role": "system", "content": "Anda adalah psikolog ahli yang menganalisis tes kepribadian. Keluarkan output HANYA JSON tanpa teks lain."},
                    {"role": "user", "content": analysis_prompt}
                ]
            )
            ai_analysis_text = response.choices[0].message.content

            if not ai_analysis_text:
                raise Exception("AI gagal menghasilkan teks analisis.")
            break
        except OpenAIError as e:
            error_msg = extract_openai_error_message(e)
            print(f"Percobaan {attempt+1} gagal untuk analisis (API Error): {error_msg}")
            # FIX: Added the list of status codes for the 'in' operator
            if attempt < MAX_AI_RETRIES - 1 and hasattr(e, 'status_code') and e.status_code in [429, 500, 503]:
                time.sleep(AI_RETRY_DELAY_SECONDS * (attempt + 1))
            else:
                ai_fallback_message = f"AI gagal menganalisis jawaban setelah {MAX_AI_RETRIES} percobaan: {error_msg}"
                return jsonify({'status': 'error', 'message': ai_fallback_message}), 500
        except Exception as e:
            print(f"Percobaan {attempt+1} gagal untuk analisis (Internal Error): {e}")
            if attempt < MAX_AI_RETRIES - 1:
                time.sleep(AI_RETRY_DELAY_SECONDS * (attempt + 1))
            else:
                ai_fallback_message = f"Terjadi kesalahan tak terduga saat menganalisis jawaban setelah {MAX_AI_RETRIES} percobaan: {e}"
                return jsonify({'status': 'error', 'message': ai_fallback_message}), 500

    try:
        cleaned_ai_output = ai_analysis_text.strip()
        if cleaned_ai_output.startswith("```json"):
            cleaned_ai_output = cleaned_ai_output[len("```json"):].strip()
        if cleaned_ai_output.endswith("```"):
            cleaned_ai_output = cleaned_ai_output[:-len("```")].strip()

        try:
            parsed_analysis = json.loads(cleaned_ai_output)
        except json.JSONDecodeError:
            json_match = re.search(r'{[\s\S]*}', cleaned_ai_output)
            if json_match:
                parsed_analysis = json.loads(json_match.group(0))
            else:
                raise

        if not all(k in parsed_analysis for k in ["personality_type", "interest_category", "summary", "recommendations", "analysis_json"]):
            raise ValueError("Struktur analisis AI tidak sesuai format yang diharapkan.")

        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO results (user_id, username, personality_type, interest_category, summary, recommendations, analysis_json)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                user_id,
                username,
                parsed_analysis['personality_type'],
                parsed_analysis['interest_category'],
                parsed_analysis['summary'],
                json.dumps(parsed_analysis['recommendations']),
                json.dumps(parsed_analysis['analysis_json'])
            ))
            conn.commit()

        return jsonify({'status': 'success', 'message': 'Hasil analisis berhasil disimpan.'}), 200

    except json.JSONDecodeError as e:
        print(f"JSON decoding error from AI analysis response: {e}")
        print(f"Raw AI analysis response: \n{ai_analysis_text}")
        ai_fallback_message = "AI menghasilkan format JSON analisis yang tidak valid. Mohon coba lagi atau hubungi admin."
        return jsonify({'status': 'error', 'message': ai_fallback_message}), 500
    except ValueError as e:
        print(f"AI response validation error: {e}")
        ai_fallback_message = f"AI menghasilkan analisis dengan struktur tidak lengkap: {e}. Mohon coba lagi."
        return jsonify({'status': 'error', 'message': ai_fallback_message}), 500
    except pymysql.Error as e:
        print(f"Database error during result save: {e}")
        ai_fallback_message = f"Database Error: Pastikan tabel 'results' sudah dibuat dengan benar dan koneksi DB stabil. Detail: {e}"
        return jsonify({'status': 'error', 'message': ai_fallback_message}), 500
    except Exception as e:
        print(f"An unexpected error occurred during analysis: {e}")
        ai_fallback_message = f"Terjadi kesalahan internal server saat menganalisis: {e}. Mohon coba lagi nanti."
        return jsonify({'status': 'error', 'message': ai_fallback_message}), 500
    finally:
        if conn:
            conn.close()

@app.route('/get_result', methods=['POST'])
def get_result():
    if not request.is_json:
        return jsonify({'status': 'error', 'message': 'Content-Type harus application/json'}), 400

    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'status': 'error', 'message': 'User ID tidak ditemukan.'}), 400

    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            sql = "SELECT username, personality_type, interest_category, summary, recommendations, analysis_json FROM results WHERE user_id = %s ORDER BY created_at DESC LIMIT 1"
            cursor.execute(sql, (user_id,))
            result = cursor.fetchone()

            if result:
                if isinstance(result['recommendations'], str):
                    result['recommendations'] = json.loads(result['recommendations'])
                if isinstance(result['analysis_json'], str):
                    result['analysis_json'] = json.loads(result['analysis_json'])

                return jsonify({'status': 'success', 'result': result}), 200
            else:
                return jsonify({'status': 'error', 'message': 'Hasil tes tidak ditemukan untuk user ini.'}), 404

    except pymysql.Error as e:
        print(f"Database error during get_result: {e}")
        return jsonify({'status': 'error', 'message': f'Terjadi kesalahan pada database saat mengambil hasil. Detail: {e}'}), 500
    except Exception as e:
        print(f"An unexpected error occurred during get_result: {e}")
        return jsonify({'status': 'error', 'message': 'Terjadi kesalahan internal server saat mengambil hasil.'}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)