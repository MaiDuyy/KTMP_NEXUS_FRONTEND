import React, { useState } from 'react';
import { useUploadDocumentMutation } from '@/src/redux/feature/knowledgeApi';
import { toast } from 'sonner';

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await uploadDocument(formData).unwrap();
      toast.success('Upload tài liệu thành công');
      setFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi upload tài liệu');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Upload Document</h2>
        <input 
          type="file" 
          accept=".pdf,.docx,.txt,.md" 
          onChange={handleFileChange} 
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button 
            onClick={handleUpload} 
            disabled={!file || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
