'use client';

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Image, Lock, Users, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import usePlaylistStore from '@/stores/playlist-store';
import { PlaylistCreateRequest } from '@/types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string) => void;
}

interface FormData {
  name: string;
  description: string;
  isPublic: boolean;
  collaborative: boolean;
  tags: string;
  templateId?: string;
}

const PLAYLIST_TEMPLATES = [
  {
    id: 'template-workout',
    name: 'Workout Playlist',
    description: 'High-energy tracks perfect for exercising',
    category: 'Fitness',
    tags: ['workout', 'high-energy', 'motivation'],
  },
  {
    id: 'template-chill',
    name: 'Chill Vibes',
    description: 'Relaxing songs for unwinding',
    category: 'Relaxation',
    tags: ['chill', 'relaxing', 'ambient'],
  },
  {
    id: 'template-party',
    name: 'Party Mix',
    description: 'Upbeat songs to get the party started',
    category: 'Party',
    tags: ['party', 'dance', 'upbeat'],
  },
  {
    id: 'template-focus',
    name: 'Focus & Study',
    description: 'Instrumental and ambient music for concentration',
    category: 'Study',
    tags: ['focus', 'study', 'instrumental'],
  },
];

export default function CreatePlaylistModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreatePlaylistModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createPlaylist } = usePlaylistStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
      collaborative: false,
      tags: '',
    },
    mode: 'onChange'
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleClose = () => {
    reset();
    setCoverImage(null);
    setCoverImagePreview(null);
    setSelectedTemplate(null);
    setIsSubmitting(false);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const request: PlaylistCreateRequest = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        isPublic: data.isPublic,
        collaborative: data.collaborative,
        imageFile: coverImage || undefined,
        tags: data.tags 
          ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [],
        templateId: selectedTemplate || undefined,
      };

      const newPlaylist = await createPlaylist(request);
      
      onSuccess?.(newPlaylist.id);
      handleClose();
    } catch (error) {
      console.error('Failed to create playlist:', error);
      // Error handling would show a toast notification in a real app
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">Create Playlist</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-zinc-400 hover:text-white"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cover Image Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">
              Playlist Cover
            </label>
            
            {coverImagePreview ? (
              <div className="relative w-48 h-48 mx-auto">
                <img
                  src={coverImagePreview}
                  alt="Playlist cover preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeCoverImage}
                  className="absolute -top-2 -right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 p-0"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`
                  w-48 h-48 mx-auto border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-zinc-600 hover:border-zinc-500'
                  }
                `}
              >
                <input {...getInputProps()} disabled={isSubmitting} />
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                  {isDragActive ? (
                    <>
                      <Upload className="w-12 h-12 mb-2" />
                      <p className="text-sm">Drop image here</p>
                    </>
                  ) : (
                    <>
                      <Image className="w-12 h-12 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop an image, or click to select
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Playlist Name *
              </label>
              <Input
                {...register('name', { 
                  required: 'Playlist name is required',
                  maxLength: { value: 100, message: 'Name must be 100 characters or less' }
                })}
                placeholder="My Awesome Playlist"
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                {...register('description', {
                  maxLength: { value: 300, message: 'Description must be 300 characters or less' }
                })}
                placeholder="Tell people what this playlist is about..."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tags (comma-separated)
              </label>
              <Input
                {...register('tags')}
                placeholder="rock, indie, 2020s"
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Privacy Settings</h3>
            
            <div className="space-y-3">
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 text-green-500 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Make public</p>
                        <p className="text-xs text-zinc-400">Anyone can see this playlist</p>
                      </div>
                    </div>
                  </label>
                )}
              />

              <Controller
                name="collaborative"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 text-green-500 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Collaborative playlist</p>
                        <p className="text-xs text-zinc-400">Let others add to this playlist</p>
                      </div>
                    </div>
                  </label>
                )}
              />
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Start with a Template</h3>
            <p className="text-sm text-zinc-400">
              Choose a template to get started with curated tracks
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PLAYLIST_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(
                    selectedTemplate === template.id ? null : template.id
                  )}
                  className={`
                    p-4 rounded-lg border text-left transition-colors
                    ${selectedTemplate === template.id
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    }
                  `}
                  disabled={isSubmitting}
                >
                  <h4 className="font-medium text-white text-sm">{template.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-green-500 hover:bg-green-600 text-black font-medium min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Playlist'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}