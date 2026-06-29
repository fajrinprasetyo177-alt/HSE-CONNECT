/**
 * HSE Connect v2.0 - Advanced Script State Engine Core
 */

// Objek Penyimpan Status Utama (State Management)
let systemState = {
    judul: "",
    kategori: "",
    risiko: "",
    lokasi: "",
    fotoHazard: "",    // Menyimpan string Base64 kondisi sebelum
    fotoPerbaikan: "", // Menyimpan string Base64 kondisi sesudah
    /**
     * Kodifikasi Status Alur Kasus:
     * -2 = Belum Diinisialisasi
     * 1 = Menunggu Verifikasi Awal Admin HSE
     * 2 = Laporan Valid, Menunggu PIC Mengambil Tindakan Lapangan
     * 3 = Penanganan Sedang Berlangsung oleh PIC
     * 4 = Pekerjaan Rampung Lapangan, Menunggu Audit Penutupan HSE
     * 5 = Selesai Penuh (Case Closed & Approved)
     * 0 = Ditolak Penuh oleh HSE pada Fase Verifikasi Awal
     */
    currentStatus: -2 
};

// Inisialisasi Tombol saat Halaman Pertama Kali Dimuat
window.onload = function() {
    sinkronisasiTombolOtoritas();
};

/**
 * Fungsi Pembantu: Mengolah File Gambar Secara Lokal dan Membuat Base64 Data URL
 */
function prosesUnggahGambar(input, containerId, imgId, jenis) {
    const berkas = input.files[0];
    if (berkas) {
        const pembaca = new FileReader();
        pembaca.onload = function(e) {
            document.getElementById(imgId).src = e.target.result;
            document.getElementById(containerId).classList.remove('hidden');
            
            if (jenis === 'hazard') {
                systemState.fotoHazard = e.target.result;
            } else if (jenis === 'perbaikan') {
                systemState.fotoPerbaikan = e.target.result;
                // Jika status sedang dikerjakan dan gambar sesudah dimasukkan, pic bisa mengajukan review
                sinkronisasiTombolOtoritas();
            }
        }
        pembaca.readAsDataURL(berkas);
    }
}

/**
 * LANGKAH 1: Pekerja Mengirim Laporan Temuan
 */
function submitLaporan() {
    systemState.judul = document.getElementById('form-judul').value;
    systemState.kategori = document.getElementById('form-kategori').value;
    systemState.risiko = document.getElementById('form-risiko').value;
    systemState.lokasi = document.getElementById('form-lokasi').value;
    systemState.currentStatus = 1;

    // Menampilkan Gambar di Monitor Pemantauan Utama
    const displaySebelum = document.getElementById('display-foto-sebelum');
    const labelNoSebelum = document.getElementById('no-foto-sebelum');
    
    if (systemState.fotoHazard) {
        displaySebelum.src = systemState.fotoHazard;
        displaySebelum.classList.remove('hidden');
        labelNoSebelum.classList.add('hidden');
    } else {
        displaySebelum.classList.add('hidden');
        labelNoSebelum.classList.remove('hidden');
        labelNoSebelum.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber-500 mb-1"></i> Dilaporkan tanpa lampiran foto`;
    }

    // Reset Monitor Sisi Perbaikan (Sesudah)
    document.getElementById('display-foto-sesudah').classList.add('hidden');
    const labelNoSesudah = document.getElementById('no-foto-sesudah');
    labelNoSesudah.classList.remove('hidden');
    labelNoSesudah.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-blue-500 text-xl mb-1"></i> Menunggu tinjauan tim HSE`;

    // Reset Isian Form Metadata Atribut K3
    document.getElementById('meta-risiko').innerText = "-";
    document.getElementById('meta-pic').innerText = "-";
    document.getElementById('meta-catatan-hse').innerText = "-";
    document.getElementById('meta-deadline').innerText = "-";
    document.getElementById('meta-progress').innerText = "-";
    document.getElementById('meta-catatan-pic').innerText = "-";

    // Set Notifikasi Terminal
    document.getElementById('notif-pekerja').innerHTML = `<div class="text-emerald-600 font-bold text-xs"><i class="fa-solid fa-circle-check text-base block mb-1"></i>Sukses Terkirim</div><p class="text-[10px] text-slate-500">ID Laporan: ${Math.floor(1000 + Math.random() * 9000)}</p>`;
    document.getElementById('notif-hse').innerHTML = `<div class="text-blue-600 font-bold text-xs animate-pulse"><i class="fa-solid fa-bell text-base block mb-1"></i>Laporan Masuk!</div><p class="text-[10px] text-slate-600">Lakukan verifikasi berkas.</p>`;
    document.getElementById('notif-pic').innerHTML = `<p class="text-slate-400 italic">Standby... Menunggu keputusan HSE</p>`;

    updateMonitorUI("🟡 Menunggu Verifikasi", "bg-amber-100 text-amber-800 border-amber-200", "bg-amber-500", "Laporan Anda berhasil dikirim ke Control Center. Menunggu Tim HSE mengaudit keabsahan laporan.", 1);
}

/**
 * LANGKAH 2: Verifikasi Awal Dokumen oleh Tim HSE
 */
function hseVerify(isValid) {
    if (systemState.currentStatus !== 1) return;

    if (isValid) {
        systemState.currentStatus = 2;
        
        // Pemetaan Klasifikasi Berdasarkan Input Risiko Awal Pekerja
        let badgeRisiko = "";
        let deadlineKerja = "30 Juni 2026";
        if (systemState.risiko === "CRITICAL") {
            badgeRisiko = `<span class="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded font-black">CRITICAL (STOP WORK)</span>`;
            deadlineKerja = "1x24 Jam (Urgent)";
        } else if (systemState.risiko === "HIGH") {
            badgeRisiko = `<span class="bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded font-black">HIGH RISK</span>`;
            deadlineKerja = "3x24 Jam";
        } else {
            badgeRisiko = `<span class="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded font-black">${systemState.risiko}</span>`;
            deadlineKerja = "7 Hari Kerja";
        }

        document.getElementById('meta-risiko').innerHTML = badgeRisiko;
        document.getElementById('meta-pic').innerHTML = `<span class="text-slate-900 font-bold"><i class="fa-solid fa-user-gear mr-1"></i>Regu Maintenance Alfa</span>`;
        document.getElementById('meta-deadline').innerText = deadlineKerja;
        document.getElementById('meta-catatan-hse').innerText = "Laporan valid. Diperintahkan kepada PIC untuk segera mengisolasi area, memasang garis pembatas keselamatan (safety line), dan memulai tindakan perbaikan konstruksi sesuai instruksi K3.";

        document.getElementById('notif-pekerja').innerHTML = `<div class="text-blue-600 font-bold text-xs"><i class="fa-solid fa-shield text-base block mb-1"></i>Laporan Diterima</div><p class="text-[10px] text-slate-500">Diteruskan ke Pelaksana Lapangan.</p>`;
        document.getElementById('notif-hse').innerHTML = `<div class="text-slate-600 font-bold text-xs"><i class="fa-solid fa-circle-check text-base block mb-1"></i>Telah Divalidasi</div><p class="text-[10px] text-slate-400">Menugaskan Regu Alfa.</p>`;
        document.getElementById('notif-pic').innerHTML = `<div class="text-amber-600 font-bold text-xs animate-bounce"><i class="fa-solid fa-circle-exclamation text-base block mb-1"></i>TUGAS MASUK!</div><p class="text-[10px] text-slate-600 font-medium">Klik 'Ambil Alih & Kerja' untuk memulai.</p>`;

        document.getElementById('no-foto-sesudah').innerHTML = `<i class="fa-solid fa-person-digging text-slate-400 text-xl mb-1"></i>Menunggu PIC Lapangan menanggapi disposisi`;

        updateMonitorUI("🔵 Laporan Terverifikasi", "bg-blue-100 text-blue-800 border-blue-200", "bg-blue-500", "Laporan dinyatakan VALID oleh HSE. Disposisi otomatis dikirim ke terminal komputer PIC Maintenance lapangan.", 2);
    } else {
        systemState.currentStatus = 0;
        
        document.getElementById('notif-pekerja').innerHTML = `<div class="text-rose-600 font-bold text-xs"><i class="fa-solid fa-circle-xmark text-base block mb-1"></i>Ditolak Tetap</div><p class="text-[10px] text-slate-400">Deskripsi/bukti tidak sesuai kriteria bahaya keselamatan.</p>`;
        document.getElementById('notif-hse').innerHTML = `<div class="text-rose-700 font-bold text-xs"><i class="fa-solid fa-ban text-base block mb-1"></i>Case Closed</div><p class="text-[10px] text-slate-400">Dokumen ditolak mentah.</p>`;
        document.getElementById('notif-pic').innerHTML = `<p class="text-slate-400 italic">Order dibatalkan oleh pusat</p>`;
        
        document.getElementById('no-foto-sesudah').innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400 text-xl mb-1"></i>Tiket ditutup: Dinyatakan Tidak Valid`;

        updateMonitorUI("🔴 Laporan Ditolak", "bg-rose-100 text-rose-800 border-rose-200", "bg-rose-500", "Laporan ditolak oleh Tim HSE karena data kurang lengkap atau bukan termasuk kategori hazard K3.", 0);
    }
}

/**
 * LANGKAH 3: Tindakan Eksekusi dan Penanganan oleh Lapangan (PIC)
 */
function picAction(tipeAksi) {
    if (tipeAksi === 1) { // 1 = Mulai Kerja
        if (systemState.currentStatus !== 2) return;
        systemState.currentStatus = 3;

        document.getElementById('meta-progress').innerHTML = `
            <div class="w-full bg-slate-200 rounded-full h-3 mt-1 overflow-hidden border border-slate-300">
                <div class="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full animate-pulse" style="width: 45%"></div>
            </div>
            <span class="text-[10px] text-orange-600 font-black block mt-1"><i class="fa-solid fa-spinner animate-spin mr-1"></i> PROGRESS: 45% (ON-SITE REMEDIATION)</span>
        `;
        document.getElementById('meta-catatan-pic').innerText = "Regu Alfa sudah mengamankan lokasi dengan barikade. Tim teknis sedang membongkar material rusak untuk dipasang suku cadang baru.";

        document.getElementById('notif-pekerja').innerHTML = `<div class="text-orange-600 font-bold text-xs"><i class="fa-solid fa-person-digging text-base block mb-1"></i>Sedang Diperbaiki</div><p class="text-[10px] text-slate-400">Tim teknis berada di area temuan.</p>`;
        document.getElementById('notif-pic').innerHTML = `<div class="text-orange-600 font-bold text-xs"><i class="fa-solid fa-screwdriver-wrench text-base block mb-1"></i>Eksekusi Berjalan</div><p class="text-[10px] text-slate-500">Unggah foto hasil perbaikan jika sudah selesai.</p>`;
        
        document.getElementById('no-foto-sesudah').innerHTML = `<i class="fa-solid fa-helmet-safety text-orange-400 text-2xl mb-1 animate-bounce"></i>Pekerjaan fisik sedang dilakukan di lapangan...`;

        updateMonitorUI("🟠 Sedang Ditindaklanjuti", "bg-orange-100 text-orange-800 border-orange-200", "bg-orange-500", "PIC Pelaksana telah mengonfirmasi perintah kerja. Tim sedang melakukan mitigasi bahaya fisik di area terdampak.", 3);
    } 
    else if (tipeAksi === 2) { // 2 = Ajukan Review Akhir
        if (systemState.currentStatus !== 3) return;
        if (!systemState.fotoPerbaikan) {
            alert("⚠️ PROSEDUR DITOLAK!\n\nAnda wajib memilih dan mengunggah berkas 'Foto Bukti Hasil Penanganan (Sesudah)' terlebih dahulu di panel nomor 2 sebagai akuntabilitas penyelesaian fisik sebelum mengajukan penutupan tiket!");
            return;
        }

        systemState.currentStatus = 4;

        // Render hasil perbaikan ke monitor visual pusat
        const displaySesudah = document.getElementById('display-foto-sesudah');
        const labelNoSesudah = document.getElementById('no-foto-sesudah');
        displaySesudah.src = systemState.fotoPerbaikan;
        displaySesudah.classList.remove('hidden');
        labelNoSesudah.classList.add('hidden');

        document.getElementById('meta-progress').innerHTML = `
            <div class="w-full bg-slate-200 rounded-full h-3 mt-1 overflow-hidden border border-slate-300">
                <div class="bg-purple-600 h-full rounded-full" style="width: 100%"></div>
            </div>
            <span class="text-[10px] text-purple-600 font-black block mt-1"><i class="fa-solid fa-square-check mr-1"></i> PROGRESS: 100% (SUBMITTED)</span>
        `;
        document.getElementById('meta-catatan-pic').innerText = "Pekerjaan penanganan bahaya diselesaikan secara tuntas sesuai Standard Operating Procedure (SOP). Mengajukan audit kelayakan penutupan dokumen kepada HSE.";

        document.getElementById('notif-pekerja').innerHTML = `<div class="text-purple-600 font-bold text-xs"><i class="fa-solid fa-hourglass-start text-base block mb-1"></i>Menunggu Verifikasi Akhir</div>`;
        document.getElementById('notif-hse').innerHTML = `<div class="text-purple-600 font-bold text-xs animate-pulse"><i class="fa-solid fa-clipboard-check text-base block mb-1"></i>Butuh Inspeksi!</div><p class="text-[10px] text-slate-500">PIC mengeklaim perbaikan rampung.</p>`;
        document.getElementById('notif-pic').innerHTML = `<div class="text-slate-500 font-bold text-xs"><i class="fa-solid fa-paper-plane text-base block mb-1"></i>Diajukan</div><p class="text-[10px] text-slate-400">Menunggu keputusan inspeksi HSE.</p>`;

        updateMonitorUI("🟣 Menunggu Persetujuan HSE", "bg-purple-100 text-purple-800 border-purple-200", "bg-purple-500", "PIC mengeklaim pengerjaan fisik telah tuntas 100%. Menunggu Tim Inspektur HSE melakukan audit kesesuaian mutu keselamatan lapangan.", 4);
    }
}

/**
 * LANGKAH 4: Audit Kualitatif Penutupan Dokumen oleh HSE Inspector
 */
function hseFinalReview(isApproved) {
    if (systemState.currentStatus !== 4) return;

    if (isApproved) {
        systemState.currentStatus = 5;

        document.getElementById('meta-catatan-hse').innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-certificate mr-1"></i>APPROVED & VERIFIED:</span> Bahaya telah dieliminasi sepenuhnya. Mutu perbaikan dinilai aman dan memenuhi standar kriteria kelayakan kerja K3 korporat. Dokumen resmi ditutup.`;

        document.getElementById('notif-pekerja').innerHTML = `<div class="text-emerald-600 font-bold text-xs"><i class="fa-solid fa-square-check text-base block mb-1"></i>Selesai Penuh</div><p class="text-[10px] text-slate-500">Area dinyatakan aman untuk beroperasi.</p>`;
        document.getElementById('notif-hse').innerHTML = `<div class="text-emerald-700 font-bold text-xs"><i class="fa-solid fa-box-archive text-base block mb-1"></i>Archived</div><p class="text-[10px] text-slate-400">Disimpan ke database laporan tahunan.</p>`;
        document.getElementById('notif-pic').innerHTML = `<div class="text-emerald-600 font-bold text-xs"><i class="fa-solid fa-award text-base block mb-1"></i>Kerja Bagus!</div><p class="text-[10px] text-slate-400">Pekerjaan disetujui tanpa catatan komplain.</p>`;

        updateMonitorUI("🟢 Selesai (Approved)", "bg-emerald-100 text-emerald-800 border-emerald-200", "bg-emerald-500", "Audit menyatakan penanganan sukses. Kasus bahaya K3 resmi ditutup dan diarsipkan dalam sistem keselamatan perusahaan.", 5);
    } else {
        // Jika ditolak, status dikembalikan ke status 2 (Terverifikasi / Menunggu tindakan PIC ulang)
        systemState.currentStatus = 2;

        document.getElementById('meta-catatan-hse').innerHTML = `<span class="text-rose-700 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>REVISI DIKELUARKAN:</span> Hasil penanganan lapangan dinilai asal-asalan, tidak kokoh, dan tidak memenuhi standar keselamatan baku. Diperintahkan untuk melakukan pengerjaan ulang segera!`;
        
        // Hapus foto sesudah yang tidak valid dari monitor utama untuk memaksa PIC upload ulang yang baru nanti
        systemState.fotoPerbaikan = "";
        document.getElementById('form-foto-perbaikan').value = "";
        document.getElementById('preview-perbaikan-container').classList.add('hidden');
        document.getElementById('display-foto-sesudah').classList.add('hidden');
        
        const labelNoSesudah = document.getElementById('no-foto-sesudah');
        labelNoSesudah.classList.remove('hidden');
        labelNoSesudah.innerHTML = `<span class="text-rose-600 font-bold text-xs flex flex-col items-center"><i class="fa-solid fa-circle-exclamation text-base mb-1 animate-bounce"></i>DITOLAK INSPEKTUR:<br>Perbaikan wajib diulang!</span>`;

        document.getElementById('meta-progress').innerHTML = `<span class="text-rose-600 font-black"><i class="fa-solid fa-ban mr-1"></i> DIRESET KE 0% (REVISI WAJIB)</span>`;

        document.getElementById('notif-pekerja').innerHTML = `<div class="text-amber-600 font-bold text-xs"><i class="fa-solid fa-arrow-rotate-left text-base block mb-1"></i>Pengerjaan Ulang</div>`;
        document.getElementById('notif-hse').innerHTML = `<div class="text-rose-600 font-bold text-xs"><i class="fa-solid fa-circle-exclamation text-base block mb-1"></i>Berkas Ditolak</div><p class="text-[10px] text-slate-500">Menunggu PIC memperbaiki revisi.</p>`;
        document.getElementById('notif-pic').innerHTML = `<div class="text-rose-600 font-bold text-xs animate-shake"><i class="fa-solid fa-triangle-exclamation text-base block mb-1"></i>REVISI TOTAL!</div><p class="text-[10px] text-slate-600 font-bold">Kualitas kerja ditolak HSE. Lakukan pengerjaan ulang!</p>`;

        updateMonitorUI("🔵 Terverifikasi (Butuh Perbaikan Ulang)", "bg-blue-100 text-blue-800 border-blue-200", "bg-blue-500", "Inspeksi HSE menolak hasil kerja PIC karena dinilai tidak aman. Status dikembalikan ke meja PIC untuk pengerjaan ulang.", 2);
    }
}

/**
 * FUNGSI MESIN UTAMA: Sinkronisasi Status Aktif/Mati Tombol Otoritas Secara Ketat (State Gatekeeper)
 */
function sinkronisasiTombolOtoritas() {
    const s = systemState.currentStatus;

    // Ambil semua elemen tombol kontroler
    const btnSubmitLaporan = document.getElementById('btn-submit-laporan');
    const btnHseTerima = document.getElementById('btn-hse-terima');
    const btnHseTolak = document.getElementById('btn-hse-tolak');
    const btnPicMulai = document.getElementById('btn-pic-mulai');
    const btnPicSelesai = document.getElementById('btn-pic-selesai');
    const btnFinalApprove = document.getElementById('btn-final-approve');
    const btnFinalReject = document.getElementById('btn-final-reject');
    const inputFotoPerbaikan = document.getElementById('form-foto-perbaikan');

    // Aturan Gerbang Logika Alur Kerja K3
    if (s === -2) { // Kondisi Standby Awal
        btnSubmitLaporan.classList.remove('disabled-btn');
        btnHseTerima.classList.add('disabled-btn'); btnHseTolak.classList.add('disabled-btn');
        btnPicMulai.classList.add('disabled-btn'); btnPicSelesai.classList.add('disabled-btn');
        btnFinalApprove.classList.add('disabled-btn'); btnFinalReject.classList.add('disabled-btn');
        inputFotoPerbaikan.disabled = true; inputFotoPerbaikan.classList.add('disabled-btn');
    }
    else if (s === 1) { // Menunggu Verifikasi Awal
        btnSubmitLaporan.classList.add('disabled-btn'); // Kunci form agar tidak kirim double-entry
        btnHseTerima.classList.remove('disabled-btn'); btnHseTolak.classList.remove('disabled-btn');
        btnPicMulai.classList.add('disabled-btn'); btnPicSelesai.classList.add('disabled-btn');
        btnFinalApprove.classList.add('disabled-btn'); btnFinalReject.classList.add('disabled-btn');
        inputFotoPerbaikan.disabled = true; inputFotoPerbaikan.classList.add('disabled-btn');
    }
    else if (s === 2) { // Terverifikasi, Menunggu PIC Mulai Kerja
        btnSubmitLaporan.classList.add('disabled-btn');
        btnHseTerima.classList.add('disabled-btn'); btnHseTolak.classList.add('disabled-btn');
        btnPicMulai.classList.remove('disabled-btn'); btnPicSelesai.classList.add('disabled-btn');
        btnFinalApprove.classList.add('disabled-btn'); btnFinalReject.classList.add('disabled-btn');
        inputFotoPerbaikan.disabled = true; inputFotoPerbaikan.classList.add('disabled-btn');
    }
    else if (s === 3) { // Progres Penanganan Aktif di Lapangan
        btnSubmitLaporan.classList.add('disabled-btn');
        btnHseTerima.classList.add('disabled-btn'); btnHseTolak.classList.add('disabled-btn');
        btnPicMulai.classList.add('disabled-btn');
        
        // Aktifkan input file bukti sesudah pengerjaan
        inputFotoPerbaikan.disabled = false;
        inputFotoPerbaikan.classList.remove('disabled-btn');

        // PIC hanya bisa menekan tombol selesai JIKA sudah mengunggah foto bukti perbaikan
        if (systemState.fotoPerbaikan) {
            btnPicSelesai.classList.remove('disabled-btn');
        } else {
            btnPicSelesai.classList.add('disabled-btn');
        }
        
        btnFinalApprove.classList.add('disabled-btn'); btnFinalReject.classList.add('disabled-btn');
    }
    else if (s === 4) { // Menunggu Audit Akhir Direktur / HSE Inspector
        btnSubmitLaporan.classList.add('disabled-btn');
        btnHseTerima.classList.add('disabled-btn'); btnHseTolak.classList.add('disabled-btn');
        btnPicMulai.classList.add('disabled-btn'); btnPicSelesai.classList.add('disabled-btn');
        btnFinalApprove.classList.remove('disabled-btn'); btnFinalReject.classList.remove('disabled-btn');
        inputFotoPerbaikan.disabled = true; inputFotoPerbaikan.classList.add('disabled-btn');
    }
    else if (s === 5 || s === 0) { // Selesai Mutlak / Ditolak Kasus Selesai
        btnSubmitLaporan.classList.add('disabled-btn');
        btnHseTerima.classList.add('disabled-btn'); btnHseTolak.classList.add('disabled-btn');
        btnPicMulai.classList.add('disabled-btn'); btnPicSelesai.classList.add('disabled-btn');
        btnFinalApprove.classList.add('disabled-btn'); btnFinalReject.classList.add('disabled-btn');
        inputFotoPerbaikan.disabled = true; inputFotoPerbaikan.classList.add('disabled-btn');
    }
}

/**
 * FUNGSI UTAMA: Sinkronisasi Rendering Representasi Grafik UI Monitor Dan Jalur Node Tracker
 */
function updateMonitorUI(statusText, badgeClass, dotClass, keterangan, currentFlowStep) {
    document.getElementById('lbl-judul').innerText = systemState.judul;
    document.getElementById('lbl-lokasi').innerText = systemState.lokasi;
    document.getElementById('meta-tag-kategori').innerText = `${systemState.kategori} LOG`;

    let targetBadge = document.getElementById('badge-status');
    targetBadge.className = `px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border shadow-3xs self-start ${badgeClass}`;
    targetBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full animate-pulse ${dotClass}"></span> ${statusText.toUpperCase()}`;

    document.getElementById('lbl-keterangan').innerText = keterangan;

    // Reset Pewarnaan Node Jalur Alur Penunjuk Jejak Digital (State Tracker Graph)
    for (let idx = 1; idx <= 5; idx++) {
        document.getElementById(`flow-${idx}`).className = "px-2.5 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-medium";
    }

    // Warnai Node yang Sedang Berjalan Aktif Sesuai Urutan Alur Validasi K3
    if (currentFlowStep > 0) {
        let activeNode = document.getElementById(`flow-${currentFlowStep}`);
        if (currentFlowStep === 5) activeNode.className = "px-2.5 py-2 rounded-lg bg-emerald-600 text-white border border-emerald-700 shadow-sm font-black";
        else if (currentFlowStep === 4) activeNode.className = "px-2.5 py-2 rounded-lg bg-purple-600 text-white border border-purple-700 shadow-sm font-black";
        else if (currentFlowStep === 3) activeNode.className = "px-2.5 py-2 rounded-lg bg-orange-500 text-white border border-orange-600 shadow-sm font-black";
        else if (currentFlowStep === 2) activeNode.className = "px-2.5 py-2 rounded-lg bg-blue-600 text-white border border-blue-700 shadow-sm font-black";
        else activeNode.className = "px-2.5 py-2 rounded-lg bg-amber-500 text-white border border-amber-600 shadow-sm font-black";
    }

    // Jalankan kalkulasi sinkronisasi tombol otoritas gerbang logika
    sinkronisasiTombolOtoritas();
}

/**
 * RESET SISTEM SIMULASI KE KONDISI AWAL (STANDBY MACHINE)
 */
function resetSimulasi() {
    systemState = {
        judul: "", kategori: "", risiko: "", lokasi: "",
        fotoHazard: "", fotoPerbaikan: "", currentStatus: -2
    };

    // Bersihkan semua input form file & preview gambar
    document.getElementById('form-foto-hazard').value = "";
    document.getElementById('form-foto-perbaikan').value = "";
    document.getElementById('preview-hazard-container').classList.add('hidden');
    document.getElementById('preview-perbaikan-container').classList.add('hidden');
    document.getElementById('display-foto-sebelum').classList.add('hidden');
    document.getElementById('display-foto-sesudah').classList.add('hidden');
    
    document.getElementById('no-foto-sebelum').classList.remove('hidden');
    document.getElementById('no-foto-sebelum').innerHTML = `<i class="fa-solid fa-image text-slate-300 text-2xl mb-1"></i>Belum ada unggahan foto`;
    document.getElementById('no-foto-sesudah').classList.remove('hidden');
    document.getElementById('no-foto-sesudah').innerHTML = `<i class="fa-solid fa-image-slash text-slate-300 text-2xl mb-1"></i>Menunggu pengerjaan unit`;

    // Kembalikan label monitor utama ke default kosong
    document.getElementById('lbl-judul').innerText = "Kabel Tegangan Tinggi Terkelupas";
    document.getElementById('lbl-lokasi').innerText = "Workshop Fabrication Lt. 1 Zona Timur";
    document.getElementById('meta-tag-kategori').innerText = "HAZARD LOG";
    
    let targetBadge = document.getElementById('badge-status');
    targetBadge.className = "px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center bg-slate-100 text-slate-700 border border-slate-200 shadow-3xs self-start gap-2";
    targetBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span> BELUM ADA LAPORAN AKTIF`;

    document.getElementById('lbl-keterangan').innerText = "Sistem standby. Harap isi data laporan di sebelah kiri dan klik kirim untuk memulai simulasi alur K3.";

    // Kosongkan Metadata Grid Box
    document.getElementById('meta-risiko').innerText = "-";
    document.getElementById('meta-pic').innerText = "-";
    document.getElementById('meta-catatan-hse').innerText = "-";
    document.getElementById('meta-deadline').innerText = "-";
    document.getElementById('meta-progress').innerText = "-";
    document.getElementById('meta-catatan-pic').innerText = "-";

    // Kosongkan Log Terminal
    document.getElementById('notif-pekerja').innerHTML = `<p class="text-slate-400 italic">Standby</p>`;
    document.getElementById('notif-hse').innerHTML = `<p class="text-slate-400 italic">Mendengarkan jaringan...</p>`;
    document.getElementById('notif-pic').innerHTML = `<p class="text-slate-400 italic">Belum ada perintah kerja</p>`;

    // Reset Grafik Node Alur
    for (let idx = 1; idx <= 5; idx++) {
        document.getElementById(`flow-${idx}`).className = "px-2.5 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-medium";
    }

    sinkronisasiTombolOtoritas();
    alert("Sistem berhasil di-reset kembali ke status awal (Standby Mode).");
}