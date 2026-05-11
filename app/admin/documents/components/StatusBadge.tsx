import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let color = "bg-gray-200 text-gray-800";
  
  switch (status?.toUpperCase()) {
    case 'PENDING':
      color = "bg-yellow-100 text-yellow-800 border border-yellow-200";
      break;
    case 'PROCESSING':
      color = "bg-blue-100 text-blue-800 border border-blue-200";
      break;
    case 'COMPLETED':
    case 'READY':
      color = "bg-green-100 text-green-800 border border-green-200";
      break;
    case 'FAILED':
    case 'ERROR':
      color = "bg-red-100 text-red-800 border border-red-200";
      break;
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}
