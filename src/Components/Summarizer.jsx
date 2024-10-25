import { useEffect, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { useFirebase } from '../Context/firebase'

export default function Summarizer() {
  const firebase = useFirebase()
  const [documents, setDocuments] = useState([])
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [summary, setSummary] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)

  const fetchDocuments = async () => {
    try {
      const docs = await firebase.fetchingDocuments()
      setDocuments(Array.isArray(docs) ? docs : [])
      console.log(docs)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleUploadDocuments = async () => {
    if (file) {
      setIsUploading(true)
      try {
        await firebase.uploadDocuments(file)
        console.log("File uploaded successfully!")
        await fetchDocuments()
        setFile(null)
      } catch (error) {
        console.error('Error uploading documents:', error)
      } finally {
        setIsUploading(false)
      }
    } else {
      console.log("No file selected.")
    }
  }

  const generateSummary = async (docURL, fileName) => {
    console.log("Generating summary for document: ${fileName}")
    setSelectedDocument(fileName)
    setSummary('Generating summary...')
    setIsModalOpen(true)

    try {
      const response = await fetch("https://legalease-navy.vercel.app/summarizer", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({docURL}),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error generating summary:', errorData)
        setSummary("Error: ${errorData.detail}")
        return
      }

      const data = await response.json()
      console.log(data)
      setSummary(data['summary'])
    } catch (error) {
      console.error('Error generating summary:', error)
      setSummary('An error occurred while generating the summary.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Legal Document Summarizer</h1>
          <div className="mb-8">
            <label className="block text-gray-700 text-lg font-semibold mb-2" htmlFor="document">
              Upload Legal Documents
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1 flex flex-col items-center px-4 py-6 bg-blue-500 text-white rounded-lg shadow-md tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-600 transition duration-300 ease-in-out">
                <Upload className="w-8 h-8" />
                <span className="mt-2 text-base leading-normal">Select files</span>
                <input type='file' className="hidden" onChange={(e) => setFile(e.target.files[0])} />
              </label>
              <button
                onClick={handleUploadDocuments}
                disabled={isUploading || !file}
                className={`px-6 py-2 rounded-lg font-bold ${
                  isUploading || !file
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                } transition duration-300 ease-in-out`}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Uploaded Documents</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        {doc.fileName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date((doc.uploadedAt.seconds * 1000) + (doc.uploadedAt.nanoseconds / 1000000)).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => generateSummary(doc.downloadURL, doc.fileName)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                      >
                        Generate Summary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Summary for {selectedDocument}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}