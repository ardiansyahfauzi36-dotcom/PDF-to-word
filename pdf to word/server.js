const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const libre = require("libreoffice-convert");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Create folders if not exist
const uploadsDir = path.join(__dirname, "uploads");
const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Format file tidak didukung. Gunakan PDF atau DOCX."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Auto delete files after 5 minutes
const scheduleDelete = (filePath) => {
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${filePath}`);
        }
    }, 5 * 60 * 1000); // 5 minutes
};

// ============ API ROUTES ============

// Word to PDF
app.post("/api/word-to-pdf", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File tidak ditemukan" });
        }

        const inputPath = req.file.path;
        const outputFileName = `${uuidv4()}-converted.pdf`;
        const outputPath = path.join(tempDir, outputFileName);

        const fileBuffer = fs.readFileSync(inputPath);

        // Convert using LibreOffice
        libre.convert(fileBuffer, ".pdf", undefined, (err, result) => {
            // Delete input file
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

            if (err) {
                console.error("Convert error:", err);
                return res.status(500).json({ 
                    error: "Gagal convert file. Pastikan LibreOffice terinstall di server." 
                });
            }

            fs.writeFileSync(outputPath, result);
            scheduleDelete(outputPath);

            res.json({
                success: true,
                message: "Convert berhasil!",
                downloadUrl: `/api/download/${outputFileName}`,
                fileName: outputFileName
            });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Terjadi kesalahan server" });
    }
});

// PDF to Word (Extract text and create simple DOCX)
app.post("/api/pdf-to-word", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File tidak ditemukan" });
        }

        const inputPath = req.file.path;
        const outputFileName = `${uuidv4()}-converted.txt`;
        const outputPath = path.join(tempDir, outputFileName);

        const fileBuffer = fs.readFileSync(inputPath);

        // Parse PDF
        const pdfData = await pdfParse(fileBuffer);
        
        // Delete input file
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

        // Save as text (simple approach - full DOCX needs more complex library)
        fs.writeFileSync(outputPath, pdfData.text);
        scheduleDelete(outputPath);

        res.json({
            success: true,
            message: "Extract text berhasil! (Download sebagai TXT)",
            downloadUrl: `/api/download/${outputFileName}`,
            fileName: outputFileName,
            note: "PDF ke DOCX sempurna membutuhkan library premium. Ini versi text extraction."
        });

    } catch (error) {
        console.error("Error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Gagal convert PDF. File mungkin corrupt atau terproteksi." });
    }
});

// Download endpoint
app.get("/api/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(tempDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File tidak ditemukan atau sudah expired" });
    }

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error("Download error:", err);
        }
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handler
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File terlalu besar. Maksimal 10MB." });
        }
    }
    
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Terjadi kesalahan" });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Uploads folder: ${uploadsDir}`);
    console.log(`📁 Temp folder: ${tempDir}`);
});
