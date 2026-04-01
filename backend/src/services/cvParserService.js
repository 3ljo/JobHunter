// CV Parser Service
// Handles PDF text extraction using pdf-parse

const fs = require('fs');
const pdfParse = require('pdf-parse');

// Extract raw text from a PDF file
const parsePDF = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (err) {
    throw new Error('Failed to parse PDF');
  }
};

module.exports = { parsePDF };
