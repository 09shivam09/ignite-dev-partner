import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image, Video, Film } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MediaUploaderProps {
  onSuccess?: (postId: string) => void;
  eventId?: string;
  defaultMediaType?: 'photo' | 'reel' | 'video';
}

export const MediaUploader = ({ 
  onSuccess, 
  eventId,
  defaultMediaType = 'photo' 
}: MediaUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'reel' | 'video'>(defaultMediaType);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Auto-detect media type
    if (file.type.startsWith('image/')) {
      setMediaType('photo');
    } else if (file.type.startsWith('video/')) {
      // Default to reel for videos under 60 seconds (we'll check duration later)
      setMediaType('reel');
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Initialize upload and get signed URL
      const { data: initData, error: initError } = await supabase.functions.invoke(
        'media-upload',
        {
          body: {
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            mediaType,
            eventId,
            title: title || selectedFile.name,
            fileSize: selectedFile.size,
          },
        }
      );

      if (initError) throw initError;
      if (!initData.success) throw new Error(initData.error);

      console.log('Upload initialized:', initData);

      // Step 2: Upload file to storage using signed URL
      const uploadResponse = await fetch(initData.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
          'x-upsert': 'true',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Simulate progress (in production, use XMLHttpRequest for real progress)
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 3: Update post status to processing
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          processing_status: mediaType === 'photo' ? 'ready' : 'processing',
        })
        .eq('id', initData.postId);

      if (updateError) throw updateError;

      toast.success(
        mediaType === 'photo' 
          ? 'Photo uploaded successfully!' 
          : 'Video uploaded! Processing will begin shortly.'
      );

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess?.(initData.postId);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const acceptedTypes = mediaType === 'photo' 
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'video/mp4,video/quicktime,video/webm';

  const maxSize = mediaType === 'photo' ? '10MB' : '100MB';

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Media Type Selector */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mediaType === 'photo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMediaType('photo')}
            disabled={uploading}
          >
            <Image className="h-4 w-4 mr-2" />
            Photo
          </Button>
          <Button
            type="button"
            variant={mediaType === 'reel' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMediaType('reel')}
            disabled={uploading}
          >
            <Film className="h-4 w-4 mr-2" />
            Reel
          </Button>
          <Button
            type="button"
            variant={mediaType === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMediaType('video')}
            disabled={uploading}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>

        {/* File Upload Area */}
        <div>
          <Label htmlFor="file-upload">Upload {mediaType}</Label>
          <div className="mt-2">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Max size: {maxSize}
            </p>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-lg overflow-hidden bg-muted"
            >
              {mediaType === 'photo' ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-48 object-cover"
                />
              )}
              {!uploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title Input */}
        {selectedFile && (
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Add a title for your ${mediaType}...`}
              disabled={uploading}
              className="mt-2"
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : `Upload ${mediaType}`}
        </Button>
      </CardContent>
    </Card>
  );
};
