import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Upload, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  className,
  accept = "image/*",
  maxSize = 5,
  placeholder = "Click to upload or drag and drop"
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          preview ? "border-solid" : ""
        )}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover mx-auto"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Max size: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Change Image
        </Button>
      )}
    </div>
  );
}