
import React, { useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-blue-200 rounded-2xl bg-white shadow-sm hover:border-blue-400 transition-colors cursor-pointer group" onClick={triggerUpload}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept=".csv"
        className="hidden"
        disabled={isLoading}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Upload Supplier CSV</h3>
          <p className="text-sm text-gray-500 mt-1">
            Expected columns: "Needs for Review", "LS Supplier Name", "DBM Supplier Name"
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center space-y-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm font-medium">Processing File...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
