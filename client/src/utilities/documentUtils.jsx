import { convertMarkdownToDocx, downloadDocx } from "@mohtasham/md-to-docx";

async function MarkdownConverter(markdown, filename) {
  try {
    const blob = await convertMarkdownToDocx(markdown);
    downloadDocx(blob, filename);
  } catch (error) {
    console.error("Conversion failed:", error);
  }
}

export { MarkdownConverter };