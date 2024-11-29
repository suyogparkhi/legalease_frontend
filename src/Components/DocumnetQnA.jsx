import React, { useState } from 'react';
import { useFirebase } from '../Context/firebase'; // Assuming firebase.jsx is in the same directory
import { CheckCircle, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { ref, getDownloadURL } from 'firebase/storage';

export default function DocumentQnA() {
  const { uploadDocuments } = useFirebase(); // Fetch Firebase functions
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadStatus, setFileUploadStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const { getCurrentUser, storage } = useFirebase();
  const currentUser = getCurrentUser();

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleFileChange = async (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPdfFile(file); // Set file for API use
      setFileUploadStatus('Uploading...');
      try {
        await uploadDocuments(file); // Upload document to Firebase
        setFileUploadStatus('Upload successful!');
      } catch (error) {
        console.error('Error uploading file:', error);
        setFileUploadStatus('Upload failed. Try again.');
      } finally {
        setTimeout(() => setFileUploadStatus(''), 3000);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAnswer(""); // Clear any previous answers
  
    // Use the Firebase context
  
    // Validate input
    if (!pdfFile) {
      alert("Please upload a valid PDF file.");
      return;
    }
    if (!question.trim()) {
      alert("Please enter a valid question.");
      return;
    }
  
    setLoading(true);
    try {
      // Check if user is logged in
      if (!currentUser) {
        alert("Please login first");
        return;
      }
  
      // Get the download URL for the uploaded file
      const storageRef = ref(storage, `documents/${currentUser.uid}/${pdfFile.name}`);
      const downloadURL = await getDownloadURL(storageRef);
  
      const response = await axios.post(
        `http://legalease-navy.vercel.app/doc-qna/ask_query`, 
        {
          pdf_url: downloadURL,
          question: question
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      setAnswer(response.data.answer);
    } catch (error) {
      console.error("Error fetching answer:", error);
      setAnswer("Failed to fetch answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-700">Legal Document Q&A with AI</h1>
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg border border-indigo-300 flex items-center justify-center transition duration-300"
          >
            <FileText className="mr-2" />
            {selectedFile ? 'Change PDF' : 'Upload PDF'}
          </label>
          <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
        </div>

        {fileUploadStatus && (
          <div className={`mb-6 px-4 py-3 rounded relative flex items-center ${fileUploadStatus.includes('successful') ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`} role="alert">
            <CheckCircle className="mr-2" />
            <span>{fileUploadStatus}</span>
          </div>
        )}

        <input
          type="text"
          placeholder="Enter your question"
          value={question}
          onChange={handleQuestionChange}
          className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Generating Answer...
            </>
          ) : (
            'Get Answer'
          )}
        </button>

        {answer && (
          <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-100">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">Answer:</h2>
            <p className="text-gray-700 leading-relaxed">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
