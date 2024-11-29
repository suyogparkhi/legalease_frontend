import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FileText, Edit, Download, AlertCircle } from 'lucide-react';
import { useFirebase } from '../Context/firebase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/editor.css';

const styles = {
  legalDocument: {
    fontFamily: 'Times New Roman, serif',
    lineHeight: '1.6',
    padding: '2rem',
    backgroundColor: 'white',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  section: {
    marginBottom: '1.5rem',
  },
  contentSection: {
    textAlign: 'justify',
    marginBottom: '1rem',
  },
};

function Drafter() {
  const { uploadDocuments, getCurrentUser } = useFirebase();
  const [caseDetails, setCaseDetails] = useState('');
  const [ipcSections, setIpcSections] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'align': ['', 'center', 'right', 'justify'] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'align'
  ];

  const generateDocument = async () => {
    if (!caseDetails.trim() || !ipcSections.trim()) {
      setMessage('Please enter both case details and IPC sections');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`https://legalease-backend-35ws.onrender.com/drafter/generate_document`, {
        case_details: caseDetails,
        ipc_sections: ipcSections.split(',').map(item => item.trim()),
      });
      setGeneratedDocument(response.data.document_content);
      setEditedDocument(response.data.document_content);
      setMessage('Document generated successfully');
    } catch (error) {
      console.error('Error generating document:', error);
      setMessage(error.response?.data?.detail || 'Error generating document');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedDocument(generatedDocument);
  };

  const handleSave = () => {
    setIsEditing(false);
    setGeneratedDocument(editedDocument);
    setMessage('Document saved successfully');
  };

  const exportDocument = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setMessage('Please login to export documents');
        return;
      }

      // Upload to Firebase
      const docContent = editedDocument || generatedDocument;
      const docFile = new File(
        [new Blob([docContent], { type: 'text/html' })],
        `legal_document_${Date.now()}.html`
      );

      await uploadDocuments(docFile);

      // Export in selected format
      const response = await axios.post(
        `https://legalease-backend-35ws.onrender.com/drafter/export_document?format=${exportFormat}`,
        { document_content: docContent },
        { responseType: 'blob' }
      );

      // Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `legal_document.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`Document exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting document:', error);
      setMessage(error.response?.data?.detail || 'Error exporting document');
    } finally {
      setLoading(false);
    }
  };

  const renderDocument = () => {
    if (!generatedDocument) return null;

    if (isEditing) {
      return (
        <div className="editor-container" style={{ height: '800px', marginBottom: '2rem' }}>
          <ReactQuill
            ref={editorRef}
            value={editedDocument}
            onChange={setEditedDocument}
            modules={modules}
            formats={formats}
            className="h-full"
            theme="snow"
          />
        </div>
      );
    }

    return (
      <div className="prose max-w-none">
        <div
          style={styles.legalDocument}
          className="min-h-[800px] border rounded-md shadow-sm overflow-auto"
          dangerouslySetInnerHTML={{ __html: generatedDocument }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-indigo-600 py-6 px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-white">Legal Document Generator</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Fields */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-gray-700 font-semibold">Case Details:</span>
              <textarea
                value={caseDetails}
                onChange={(e) => setCaseDetails(e.target.value)}
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Enter case details including relevant information about the case"
              />
            </label>
            <label className="block">
              <span className="text-gray-700 font-semibold">IPC Sections (comma-separated):</span>
              <input
                type="text"
                value={ipcSections}
                onChange={(e) => setIpcSections(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="e.g. 302, 307, 498A"
              />
            </label>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={generateDocument}
              disabled={loading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
            >
              <FileText className="mr-2 h-5 w-5" />
              {loading ? 'Generating...' : 'Generate Document'}
            </button>
          </div>

          {/* Document Display/Editor */}
          {generatedDocument && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Document:' : 'Generated Document:'}
                </h2>
                <button
                  onClick={isEditing ? handleSave : handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <Edit className="mr-2 h-5 w-5" />
                  {isEditing ? 'Save Changes' : 'Edit Document'}
                </button>
              </div>

              {renderDocument()}

              {/* Export Options */}
              <div className="flex items-center justify-center space-x-4 mt-6">
                <label className="inline-flex items-center">
                  <span className="mr-2 text-gray-700 font-semibold">Export Format:</span>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                  </select>
                </label>
                <button
                  onClick={exportDocument}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {loading ? 'Exporting...' : 'Export Document'}
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              message.includes('Error') ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <div className="flex">
                <AlertCircle className={`h-5 w-5 ${
                  message.includes('Error') ? 'text-red-400' : 'text-green-400'
                }`} />
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    message.includes('Error') ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Drafter;