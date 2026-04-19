// ============ DOM ELEMENTS ============
const tabButtons = document.querySelectorAll(".tab-btn");
const converterCards = document.querySelectorAll(".converter-card");

// Word to PDF elements
const dropzoneWord = document.getElementById("dropzone-word");
const fileInputWord = document.getElementById("file-word");
const previewWord = document.getElementById("preview-word");
const filenameWord = document.getElementById("filename-word");
const filesizeWord = document.getElementById("filesize-word");
const removeWordBtn = document.getElementById("remove-word");
const progressWord = document.getElementById("progress-word");
const progressFillWord = document.getElementById("progress-fill-word");
const progressTextWord = document.getElementById("progress-text-word");
const convertWordBtn = document.getElementById("convert-word");
const downloadWord = document.getElementById("download-word");
const downloadLinkWord = document.getElementById("download-link-word");

// PDF to Word elements
const dropzonePdf = document.getElementById("dropzone-pdf");
const fileInputPdf = document.getElementById("file-pdf");
const previewPdf = document.getElementById("preview-pdf");
const filenamePdf = document.getElementById("filename-pdf");
const filesizePdf = document.getElementById("filesize-pdf");
const removePdfBtn = document.getElementById("remove-pdf");
const progressPdf = document.getElementById("progress-pdf");
const progressFillPdf = document.getElementById("progress-fill-pdf");
const progressTextPdf = document.getElementById("progress-text-pdf");
const convertPdfBtn = document.getElementById("convert-pdf");
const downloadPdf = document.getElementById("download-pdf");
const downloadLinkPdf = document.getElementById("download-link-pdf");

// State
let selectedWordFile = null;
let selectedPdfFile = null;

// ============ TOAST ============
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ============ FORMAT FILE SIZE ============
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ============ TAB SWITCHING ============
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        // Show corresponding card
        converterCards.forEach(card => {
            card.classList.remove("active");
            if (card.id === tabId) {
                card.classList.add("active");
            }
        });
    });
});

// ============ DRAG & DROP - WORD ============
dropzoneWord.addEventListener("click", () => fileInputWord.click());

dropzoneWord.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzoneWord.classList.add("dragover");
});

dropzoneWord.addEventListener("dragleave", () => {
    dropzoneWord.classList.remove("dragover");
});

dropzoneWord.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneWord.classList.remove("dragover");
    
    const file = e.dataTransfer.files[0];
    handleWordFile(file);
});

fileInputWord.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleWordFile(file);
});

function handleWordFile(file) {
    if (!file) return;
    
    // Validate file type
    const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(docx|doc)$/i)) {
        showToast("Format file tidak valid. Gunakan .docx atau .doc", "error");
        return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
        showToast("File terlalu besar. Maksimal 10MB", "error");
        return;
    }
    
    selectedWordFile = file;
    
    // Show preview
    filenameWord.textContent = file.name;
    filesizeWord.textContent = formatFileSize(file.size);
    previewWord.style.display = "flex";
    dropzoneWord.style.display = "none";
    downloadWord.style.display = "none";
    convertWordBtn.disabled = false;
}

removeWordBtn.addEventListener("click", () => {
    resetWordUpload();
});

function resetWordUpload() {
    selectedWordFile = null;
    fileInputWord.value = "";
    previewWord.style.display = "none";
    dropzoneWord.style.display = "block";
    downloadWord.style.display = "none";
    progressWord.style.display = "none";
    convertWordBtn.disabled = true;
    convertWordBtn.querySelector(".btn-text").textContent = "Convert ke PDF";
    convertWordBtn.querySelector(".spinner").style.display = "none";
}

// ============ DRAG & DROP - PDF ============
dropzonePdf.addEventListener("click", () => fileInputPdf.click());

dropzonePdf.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzonePdf.classList.add("dragover");
});

dropzonePdf.addEventListener("dragleave", () => {
    dropzonePdf.classList.remove("dragover");
});

dropzonePdf.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzonePdf.classList.remove("dragover");
    
    const file = e.dataTransfer.files[0];
    handlePdfFile(file);
});

fileInputPdf.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handlePdfFile(file);
});

function handlePdfFile(file) {
    if (!file) return;
    
    // Validate file type
    if (file.type !== "application/pdf" && !file.name.match(/\.pdf$/i)) {
        showToast("Format file tidak valid. Gunakan .pdf", "error");
        return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
        showToast("File terlalu besar. Maksimal 10MB", "error");
        return;
    }
    
    selectedPdfFile = file;
    
    // Show preview
    filenamePdf.textContent = file.name;
    filesizePdf.textContent = formatFileSize(file.size);
    previewPdf.style.display = "flex";
    dropzonePdf.style.display = "none";
    downloadPdf.style.display = "none";
    convertPdfBtn.disabled = false;
}

removePdfBtn.addEventListener("click", () => {
    resetPdfUpload();
});

function resetPdfUpload() {
    selectedPdfFile = null;
    fileInputPdf.value = "";
    previewPdf.style.display = "none";
    dropzonePdf.style.display = "block";
    downloadPdf.style.display = "none";
    progressPdf.style.display = "none";
    convertPdfBtn.disabled = true;
    convertPdfBtn.querySelector(".btn-text").textContent = "Extract Text";
    convertPdfBtn.querySelector(".spinner").style.display = "none";
}

// ============ CONVERT WORD TO PDF ============
convertWordBtn.addEventListener("click", async () => {
    if (!selectedWordFile) return;
    
    const formData = new FormData();
    formData.append("file", selectedWordFile);
    
    // Show loading
    convertWordBtn.disabled = true;
    convertWordBtn.querySelector(".btn-text").textContent = "Converting...";
    convertWordBtn.querySelector(".spinner").style.display = "block";
    progressWord.style.display = "block";
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressFillWord.style.width = progress + "%";
        progressTextWord.textContent = `Processing... ${Math.round(progress)}%`;
    }, 300);
    
    try {
        const response = await fetch("/api/word-to-pdf", {
            method: "POST",
            body: formData
        });
        
        clearInterval(progressInterval);
        progressFillWord.style.width = "100%";
        progressTextWord.textContent = "Complete!";
        
        const result = await response.json();
        
        if (result.success) {
            showToast("Convert berhasil! 🎉");
            downloadLinkWord.href = result.downloadUrl;
            downloadWord.style.display = "block";
            previewWord.style.display = "none";
        } else {
            showToast(result.error || "Gagal convert file", "error");
        }
        
    } catch (error) {
        clearInterval(progressInterval);
        console.error("Error:", error);
        showToast("Terjadi kesalahan. Coba lagi.", "error");
    }
    
    // Reset button
    convertWordBtn.disabled = false;
    convertWordBtn.querySelector(".btn-text").textContent = "Convert ke PDF";
    convertWordBtn.querySelector(".spinner").style.display = "none";
});

// ============ CONVERT PDF TO TEXT ============
convertPdfBtn.addEventListener("click", async () => {
    if (!selectedPdfFile) return;
    
    const formData = new FormData();
    formData.append("file", selectedPdfFile);
    
    // Show loading
    convertPdfBtn.disabled = true;
    convertPdfBtn.querySelector(".btn-text").textContent = "Extracting...";
    convertPdfBtn.querySelector(".spinner").style.display = "block";
    progressPdf.style.display = "block";
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressFillPdf.style.width = progress + "%";
        progressTextPdf.textContent = `Processing... ${Math.round(progress)}%`;
    }, 300);
    
    try {
        const response = await fetch("/api/pdf-to-word", {
            method: "POST",
            body: formData
        });
        
        clearInterval(progressInterval);
        progressFillPdf.style.width = "100%";
        progressTextPdf.textContent = "Complete!";
        
        const result = await response.json();
        
        if (result.success) {
            showToast("Extract text berhasil! 🎉");
            downloadLinkPdf.href = result.downloadUrl;
            downloadPdf.style.display = "block";
            previewPdf.style.display = "none";
        } else {
            showToast(result.error || "Gagal extract text", "error");
        }
        
    } catch (error) {
        clearInterval(progressInterval);
        console.error("Error:", error);
        showToast("Terjadi kesalahan. Coba lagi.", "error");
    }
    
    // Reset button
    convertPdfBtn.disabled = false;
    convertPdfBtn.querySelector(".btn-text").textContent = "Extract Text";
    convertPdfBtn.querySelector(".spinner").style.display = "none";
});

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});
