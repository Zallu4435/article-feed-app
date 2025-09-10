"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import type { ImageUploadProps } from '@/types/ui';
import { cn } from '@/lib/utils';

const ImageUpload: React.FC<ImageUploadProps> = ({ label = 'Cover Image', onFileSelected, initialUrl = null, onClear }) => {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      setError('Only PNG and JPG images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    setFile(file);
    onFileSelected?.(file);

  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
  });

  const clearImage = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    onClear?.();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition',
          isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Preview" className="h-48 w-full rounded-md object-cover shadow-sm" />
        ) : (
          <div className="text-gray-600">
            <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M19.5 6h-15A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h15a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0019.5 6zm-9 9l-3-4-3 4h12l-4-5-2 2.5L10.5 9 7.5 12.75 6 11l-3 4" />
              </svg>
            </div>
            <p className="text-sm">Drag & drop an image here, or click to select</p>
            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {preview && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">Preview shown. Click area to change file.</p>
          <Button variant="outline" size="sm" onClick={clearImage}>Remove image</Button>
        </div>
      )}
    </div>
  );
};

export { ImageUpload };
