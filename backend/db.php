<?php
$servername = "localhost"; 
$username_db = "root";     
$password_db = "";         
$dbname = "inkubasi"; 

$conn = new mysqli($servername, $username_db, $password_db, $dbname);

if ($conn->connect_error) {
    error_log("Koneksi database gagal: " . $conn->connect_error);
}
?>