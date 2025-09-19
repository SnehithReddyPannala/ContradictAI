import { NextResponse } from "next/server";
import * as mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { recordUsage } from "../../../lib/usageTracking";
import { PDFDocument } from "pdf-lib";

console.log("Backend: Initializing API route module.");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log("Backend: GoogleGenerativeAI client initialized.");
} else {
  console.error("Backend: GEMINI_API_KEY is not set. Gemini API calls will fail.");
}

// Helper function to convert ArrayBuffer to Buffer
function toBuffer(ab: ArrayBuffer): Buffer {
  const buf = Buffer.alloc(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

export async function POST(request: Request) {
  console.log("Backend: POST request received.");
  const userId = "anonymous_user"; 
  let documents: File[] = []; // Declare documents in a higher scope

  try {
    if (!genAI) {
      console.error("Backend: Attempted API call without initialized Gemini client (GEMINI_API_KEY missing).");
      recordUsage(userId, 0, 0, { error: "GEMINI_API_KEY missing at client init" });
      return NextResponse.json({ error: "Server configuration error: Gemini API key is missing or invalid." }, { status: 500 });
    }

    console.log("Backend: Parsing form data...");
    const formData = await request.formData();
    documents = formData.getAll("documents") as File[]; // Assign here
    console.log(`Backend: Found ${documents.length} documents.`);

    if (!documents || documents.length === 0) {
      console.warn("Backend: No documents uploaded.");
      return NextResponse.json({ error: "No documents uploaded." }, { status: 400 });
    }

    const extractedTexts: { name: string; content: string }[] = [];

    for (const doc of documents) {
      console.log(`Backend: Processing file: ${doc.name}, type: ${doc.type}`);
      let textContent = "";

      try {
        if (doc.type === "application/pdf") {
          console.log(`Backend: Using pdf-lib for file: ${doc.name} (limited text extraction)`);
          const arrayBuffer = await doc.arrayBuffer();
          await PDFDocument.load(arrayBuffer); // Load to validate PDF, but text extraction is a limitation.
          textContent = `[PDF Content from ${doc.name} - Full text extraction not implemented in hackathon scope]`;
          console.log(`Backend: Successfully processed PDF (placeholder text): ${doc.name}`);
        } else if (
          doc.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          console.log(`Backend: Parsing DOCX file: ${doc.name}`);
          const arrayBuffer = await doc.arrayBuffer();
          const buffer = toBuffer(arrayBuffer);
          const result = await mammoth.extractRawText({ buffer: buffer });
          textContent = result.value;
          console.log(`Backend: Successfully parsed DOCX: ${doc.name}`);
        } else if (doc.type === "text/plain") {
          console.log(`Backend: Reading TXT file: ${doc.name}`);
          textContent = await doc.text();
          console.log(`Backend: Successfully read TXT: ${doc.name}`);
        } else {
          console.warn(`Backend: Unsupported file type: ${doc.type} for file ${doc.name}`);
          textContent = `Could not extract text from unsupported file type: ${doc.name}`;
        }
      } catch (parseError) {
        console.error(`Backend: Error parsing file ${doc.name}:`, parseError);
        textContent = `Error parsing file ${doc.name}: ${(parseError as Error).message}`;
      }
      extractedTexts.push({ name: doc.name, content: textContent });
    }

    // Proceed even if some documents failed extraction, as long as there's some content.
    if (extractedTexts.every(t => !t.content || t.content.startsWith("Error parsing file") || t.content.startsWith("[PDF Content"))) {
      console.warn("Backend: No meaningful text extracted from any document for conflict checking.");
      // Depending on requirements, you might return an error here, or proceed with limited data.
      // For this hackathon, we'll proceed to Gemini even with placeholder PDF content.
    }

    let prompt = "Analyze the following documents for contradictions and conflicts. Provide the output as a JSON object with a 'conflicts' array. Each conflict object should have 'document1', 'document2', 'description', and 'suggestion' fields. If no conflicts are found, return an empty 'conflicts' array.\n\nDocuments:\n\n";
    extractedTexts.forEach((doc, index) => {
      prompt += `--- Document ${index + 1}: ${doc.name} ---\n${doc.content}\n\n`;
    });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Backend: Sending prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const geminiText = response.text();
    console.log("Backend: Received response from Gemini.");

    let geminiJsonResult;
    try {
      // Attempt to extract JSON from a markdown code block
      const jsonMatch = geminiText.match(/```json\n([\s\S]*?)\n```/);
      let rawJsonString = geminiText;

      if (jsonMatch && jsonMatch[1]) {
        rawJsonString = jsonMatch[1];
        console.log("Backend: Extracted JSON from markdown code block.");
      } else {
        console.warn("Backend: Gemini response did not contain a markdown JSON block. Attempting raw parse.");
      }
      geminiJsonResult = JSON.parse(rawJsonString);
      console.log("Backend: Successfully parsed Gemini response as JSON.");
    } catch (e) {
      console.error("Backend: Failed to parse Gemini response as JSON:", geminiText);
      recordUsage(userId, documents.length, 0, { documentCount: documents.length, error: "Gemini invalid JSON" });
      return NextResponse.json({ error: "Gemini did not return a valid JSON response", rawResponse: geminiText }, { status: 500 });
    }

    const numReports = geminiJsonResult.conflicts && geminiJsonResult.conflicts.length > 0 ? 1 : 0;
    recordUsage(userId, documents.length, numReports, { documentCount: documents.length });
    console.log("Backend: Usage recorded for successful conflict check.");

    return NextResponse.json({ message: "Files processed successfully", results: geminiJsonResult });
  } catch (error) {
    console.error("Backend: General error processing upload:", error);
    recordUsage(userId, documents ? documents.length : 0, 0, { error: (error as Error).message || "Unknown error during upload processing" });
    return NextResponse.json({ error: "Failed to process documents due to a server error." }, { status: 500 });
  }
}
