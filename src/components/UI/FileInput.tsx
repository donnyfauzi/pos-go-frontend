import { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

interface FileInputProps {
  label?: string;
  error?: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileChange: (file: File | null) => void;
  preview?: string | null;
}

export default function FileInput({
  label,
  error,
  accept = 'image/*',
  maxSize = 5,
  onFileChange,
  preview,
}: FileInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validasi ukuran file
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Ukuran file terlalu besar, maksimal ${maxSize}MB`);
        return;
      }

      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        return;
      }

      // Buat preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      onFileChange(file);
    } else {
      setPreviewUrl(null);
      onFileChange(null);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label.includes('*') ? (
            <>
              {label.replace('*', '')}
              <span className="text-red-500">*</span>
            </>
          ) : (
            label
          )}
        </label>
      )}
      <div
        className={`border-2 border-dashed rounded-lg p-4 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block"
              >
                Pilih Gambar
              </label>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Format: JPG, JPEG, PNG, WEBP (Max: {maxSize}MB)
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
