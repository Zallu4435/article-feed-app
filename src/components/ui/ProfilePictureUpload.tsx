'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CameraIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type { ProfilePictureUploadProps } from '@/types';
import { apiFetch } from '@/lib/api';

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onUploaded,
  onRemove,
  size = 'md',
  showAsOverlay = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Update preview when currentImageUrl prop changes
  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      setError('Only PNG and JPG images are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const formData = new FormData();
      formData.append('file', file);

      const data = await apiFetch<{ 
        data: { 
          profilePictureUrl: string;
          publicId: string;
          width: number;
          height: number;
        }
      }>(
        '/api/users/profile/upload',
        { method: 'POST', body: formData }
      );
      
      // Clean up the temporary blob URL to prevent memory leaks
      URL.revokeObjectURL(previewUrl);
      
      // Update preview with the final uploaded URL
      const uploadedUrl = data.data.profilePictureUrl;
      setPreview(uploadedUrl);
      onUploaded(uploadedUrl);
      toast.success('Profile picture updated successfully!');

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreview(currentImageUrl || null);
      toast.error(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  }, [currentImageUrl, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = async () => {
    if (!currentImageUrl) return;

    try {

      await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: { profilePicture: null },
      });

      setPreview(null);
      onRemove?.();
      toast.success('Profile picture removed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove profile picture');
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  if (showAsOverlay) {
    return (
      <>
        <input {...getInputProps()} style={{ display: 'none' }} disabled={uploading} />
        <button
          onClick={handleFileSelect}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
          title="Change profile picture"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <PencilIcon className="w-4 h-4" />
          )}
        </button>
        {error && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded whitespace-nowrap">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-full border-2 border-dashed transition-all cursor-pointer group',
          sizeClasses[size],
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={uploading} />

        {preview ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <img
              src={preview}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <CameraIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
            <CameraIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handleFileSelect();
          }}
          disabled={uploading}
        >
          {preview ? 'Change' : 'Upload'}
        </Button>

        {preview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              removeImage();
            }}
            disabled={uploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        PNG, JPG up to 5MB
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
