import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Image, Video, Film, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadMedia, validateFile, UploadProgress } from '@/services/storage';
import { createPost } from '@/services/feed';


export interface CreatePostProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  eventId?: string;
}

type MediaType = 'photo' | 'video' | 'reel' | 'text';

export function CreatePost({ onSuccess, eventId }: CreatePostProps) {
  const [mediaType, setMediaType] = useState<MediaType>('text');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Auto-detect media type
    if (file.type.startsWith('image/')) {
      setMediaType('photo');
    } else if (file.type.startsWith('video/')) {
      setMediaType('reel'); // Default to reel for short videos
    }

    // Validate file
    const error = validateFile(file, file.type.startsWith('image/') ? 'photo' : 'video');
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType('text');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (mediaType === 'text' && !caption.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      if (selectedFile && mediaType !== 'text') {
        // Upload with media
        const result = await uploadMedia(
          selectedFile,
          mediaType as 'photo' | 'video' | 'reel',
          caption || undefined,
          eventId,
          setUploadProgress
        );

        toast.success(`${mediaType === 'photo' ? 'Photo' : mediaType === 'video' ? 'Video' : 'Reel'} uploaded!`);
      } else {
        // Text-only post
        await createPost({
          content: caption,
        });

        toast.success('Post created!');
      }

      // Reset form
      setCaption('');
      clearFile();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const mediaTypeButtons = [
    { type: 'text' as const, icon: null, label: 'Text' },
    { type: 'photo' as const, icon: Image, label: 'Photo' },
    { type: 'video' as const, icon: Video, label: 'Video' },
    { type: 'reel' as const, icon: Film, label: 'Reel' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Create Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Media Type Selector */}
        <div className="flex gap-2">
          {mediaTypeButtons.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              type="button"
              variant={mediaType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setMediaType(type);
                if (type === 'text') clearFile();
              }}
              disabled={isUploading}
              className="flex-1"
            >
              {Icon && <Icon className="h-4 w-4 mr-1" />}
              {label}
            </Button>
          ))}
        </div>

        {/* File Upload */}
        {mediaType !== 'text' && !selectedFile && (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload {mediaType === 'photo' ? 'an image' : 'a video'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {mediaType === 'photo' ? '10MB' : '100MB'}
            </p>
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept={
            mediaType === 'photo'
              ? 'image/jpeg,image/png,image/webp,image/gif'
              : 'video/mp4,video/quicktime,video/webm'
          }
          onChange={handleFileSelect}
          className="hidden"
        />

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
                  className="w-full max-h-64 object-cover"
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-64 object-cover"
                />
              )}
              {!isUploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption Input */}
        <Textarea
          placeholder={
            mediaType === 'text'
              ? "What's on your mind?"
              : 'Write a caption...'
          }
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isUploading}
          rows={mediaType === 'text' ? 4 : 2}
          className="resize-none"
        />

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="space-y-2">
            <Progress value={uploadProgress.percent} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Uploading... {uploadProgress.percent}%
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            isUploading ||
            (mediaType === 'text' && !caption.trim()) ||
            (mediaType !== 'text' && !selectedFile)
          }
          className="w-full"
        >
          {isUploading ? 'Posting...' : 'Post'}
        </Button>
      </CardContent>
    </Card>
  );
}
