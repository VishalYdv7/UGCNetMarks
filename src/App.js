import React, { useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.js";
import "./App.css"; // Import the CSS file

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

const App = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [parsedResponses, setParsedResponses] = useState([]);
  const [marks, setMarks] = useState(null);

  // Answer key stored directly in the code
  const answerKey = {
    "3421238576": "1",
    "3421238577": "1",
    "3421238578": "3",
    "3421238579": "3",
    "3421238580": "2",
    "3421238581": "1",
    "3421238582": "DROPPED",
    "3421238583": "3",
    "3421238584": "3",
    "3421238585": "2",
    "3421238586": "2",
    "3421238726": "2",
    // Add more question IDs and correct answers as needed
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setPdfFile(file);
    setParsedResponses([]);
    setMarks(null);
  };

  const extractTextFromPDF = async (pdf) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(pdf);
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const pdfData = new Uint8Array(e.target.result);
          const loadingTask = getDocument(pdfData);
          const pdfDoc = await loadingTask.promise;

          let fullText = "";
          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
    });
  };

  const parseResponseSheet = (text) => {
    const response = [];
    const regex =
      /Question\s*ID\s*[:\s]*(\d+).*?Chosen\s*Option\s*[:\s]*(\d+|--)/gs; // Removed 'Status' from regex
    let match;

    while ((match = regex.exec(text))) {
      response.push({
        questionID: match[1],
        chosenOption: match[2] === "--" ? null : match[2], // Treat '--' as null for not attempted
      });
    }
    return response;
  };

  const calculateMarks = async () => {
    if (!pdfFile) return;

    try {
      const extractedText = await extractTextFromPDF(pdfFile);
      const responseSheet = parseResponseSheet(extractedText);

      let score = 0;
      const responsesWithResults = responseSheet.map((response, index) => {
        const { questionID, chosenOption } = response;
        const correctOption = answerKey[questionID];
        const isCorrect = chosenOption === correctOption;
        const isAttempted = chosenOption !== null;

        if (isAttempted && isCorrect) score += 2;

        return {
          serial: index + 1,
          questionID,
          chosenOption: chosenOption || "Not Attempted", // If null, show 'Not Attempted'
          correctOption: correctOption || "Not Available", // If no correct option, show 'Not Available'
          result: isAttempted ? (isCorrect ? "correct" : "incorrect") : "not-attempted",
        };
      });

      setParsedResponses(responsesWithResults);
      setMarks(score);
    } catch (err) {
      console.error("Error calculating marks:", err);
      alert("An error occurred while processing the PDF. Please try again.");
    }
  };

  return (
    <div className="container">
      <h1>Geography UGC NET Dec 2024 Marks Calculator</h1>
      <p>Step 1: Upload the Response Sheet (PDF)</p>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
      />
      <button
        onClick={calculateMarks}
        disabled={!pdfFile}
      >
        Calculate Marks
      </button>
      {marks !== null && (
        <h1 className="total-marks">Your total marks: {marks}</h1>
      )}
      {parsedResponses.length > 0 && (
        <div>
          <h3>Detailed Question Analysis:</h3>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Question ID</th>
                <th>Chosen Option</th>
                <th>Correct Option</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {parsedResponses.map((response) => (
                <tr key={response.serial} className={`${response.result}`}>
                  <td>{response.serial}</td>
                  <td>{response.questionID}</td>
                  <td>{response.chosenOption}</td>
                  <td>{response.correctOption}</td>
                  <td>{response.result === "correct" ? "Correct" : response.result === "incorrect" ? "Incorrect" : "Not Attempted"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
