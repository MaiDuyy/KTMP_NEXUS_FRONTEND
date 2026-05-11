import React, { useState } from 'react';
import { Document, useUpdateDocumentMetadataMutation, useApproveDocumentMutation } from '@/src/redux/feature/knowledgeApi';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

export function DocumentTable({ documents }: { documents: Document[] }) {
  const [updateMetadata] = useUpdateDocumentMetadataMutation();
  const [approveDocument] = useApproveDocumentMutation();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editClass, setEditClass] = useState<string>('PUBLIC');
  const [editTags, setEditTags] = useState<string>('');

  const handleEditClick = (doc: Document) => {
    setEditingId(doc.id);
    setEditClass(doc.securityClassification || 'PUBLIC');
    setEditTags(doc.tags ? doc.tags.join(', ') : '');
  };

  const handleSaveMetadata = async (id: number) => {
    try {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
      await updateMetadata({ 
        id, 
        securityClassification: editClass, 
        tags: tagsArray 
      }).unwrap();
      toast.success('Cập nhật metadata thành công');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveDocument(id).unwrap();
      toast.success('Đã phê duyệt tài liệu, đang chuyển sang xử lý Vector...');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi phê duyệt');
    }
  };

  return (
    <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên File</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân loại</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {doc.fileName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingId === doc.id ? (
                  <select 
                    value={editClass} 
                    onChange={e => setEditClass(e.target.value)}
                    className="border rounded p-1 text-sm bg-white"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                  </select>
                ) : (
                  <span className="font-semibold">{doc.securityClassification || 'N/A'}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingId === doc.id ? (
                  <input 
                    className="border rounded p-1 text-sm w-full"
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="tag1, tag2..."
                  />
                ) : (
                  <div className="flex gap-1 flex-wrap">
                    {doc.tags?.length ? doc.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {tag}
                      </span>
                    )) : 'No tags'}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {editingId === doc.id ? (
                  <>
                    <button onClick={() => handleSaveMetadata(doc.id)} className="text-green-600 hover:text-green-900">Lưu</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900">Hủy</button>
                  </>
                ) : (
                  <button onClick={() => handleEditClick(doc)} className="text-blue-600 hover:text-blue-900">Edit</button>
                )}
                
                {doc.status === 'PENDING' && (
                  <button 
                    onClick={() => handleApprove(doc.id)} 
                    className="text-purple-600 hover:text-purple-900 font-semibold ml-2"
                  >
                    Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Không có tài liệu nào.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
