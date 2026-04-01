// CV Parser Service
// Handles PDF text extraction using pdf-parse

const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Extract raw text from a PDF file
const parsePDF = async (filePath) => {
  let parser;
  try {
    const fileBuffer = fs.readFileSync(filePath);
    parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    return result.text;
  } catch (err) {
    console.error('PDF parse error:', err.message);
    throw new Error('Failed to parse PDF');
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
};

module.exports = { parsePDF };
