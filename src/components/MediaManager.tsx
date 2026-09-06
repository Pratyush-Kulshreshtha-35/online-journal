import React, { useState, useRef } from 'react';
import {
  Image,
  Video,
  Film,
  Mic,
  Music,
  Plus,
  Trash2,
  X,
  Play,
  Square,
  Upload,
  Link,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { MediaAttachment } from '../types/journal';
import { CURATED_GIFS } from '../data/curatedMedia';
import { compressImageFile, VoiceRecorder } from '../services/mediaService';

interface MediaManagerProps {
  media: MediaAttachment[];
  onChange: (media: MediaAttachment[]) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ media, onChange }) => {
  const [activeModal, setActiveModal] = useState<'photo' | 'video' | 'gif' | 'audio' | 'music' | null>(null);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');

  // GIF state
  const [customGifUrl, setCustomGifUrl] = useState('');

  // Audio / Voice note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [voiceRecorder] = useState<VoiceRecorder>(() => new VoiceRecorder());
  const timerRef = useRef<any>(null);

  // Music state
  const [musicTitle, setMusicTitle] = useState('');
  const [musicUrl, setMusicUrl] = useState('');

  // Active audio player preview state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleAddPhoto = (url: string, caption?: string) => {
    if (!url.trim()) return;
    const item: MediaAttachment = {
      id: 'photo-' + Date.now(),
      type: 'photo',
      url,
      caption: caption?.trim() || undefined,
    };
    onChange([...media, item]);
    setPhotoUrl('');
    setPhotoCaption('');
    setActiveModal(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const base64 = await compressImageFile(file);
      handleAddPhoto(base64, photoCaption);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddVideo = () => {
    if (!videoUrl.trim()) return;
    let url = videoUrl.trim();
    // Transform standard youtube watch to embed
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
    }

    const item: MediaAttachment = {
      id: 'video-' + Date.now(),
      type: 'video',
      url,
      caption: videoCaption.trim() || undefined,
    };
    onChange([...media, item]);
    setVideoUrl('');
    setVideoCaption('');
    setActiveModal(null);
  };

  const handleAddGif = (url: string, label?: string) => {
    if (!url.trim()) return;
    const item: MediaAttachment = {
      id: 'gif-' + Date.now(),
      type: 'gif',
      url,
      caption: label || undefined,
    };
    onChange([...media, item]);
    setCustomGifUrl('');
    setActiveModal(null);
  };

  const startVoiceRecording = async () => {
    try {
      await voiceRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start microphone recording:', err);
    }
  };

  const stopVoiceRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const { dataUrl, duration } = await voiceRecorder.stop();
      setIsRecording(false);
      const item: MediaAttachment = {
        id: 'audio-' + Date.now(),
        type: 'audio',
        url: dataUrl,
        title: `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        duration,
      };
      onChange([...media, item]);
      setActiveModal(null);
    } catch (err) {
      console.error('Error stopping recording:', err);
      setIsRecording(false);
    }
  };

  const handleAddMusic = () => {
    if (!musicUrl.trim()) return;
    const item: MediaAttachment = {
      id: 'music-' + Date.now(),
      type: 'music',
      url: musicUrl.trim(),
      title: musicTitle.trim() || 'Soundtrack Track',
    };
    onChange([...media, item]);
    setMusicTitle('');
    setMusicUrl('');
    setActiveModal(null);
  };

  const handleRemoveMedia = (id: string) => {
    onChange(media.filter((m) => m.id !== id));
    if (playingAudioId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingAudioId(null);
    }
  };

  const togglePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      setPlayingAudioId(id);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Media Attachment Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#121212] border border-[#222222] rounded-xl text-xs">
        <span className="text-stone-500 font-mono-journal text-[11px] px-1">Attach:</span>

        {/* Photo button */}
        <button
          type="button"
          onClick={() => setActiveModal('photo')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-stone-300 hover:text-white border border-[#282828] transition"
        >
          <Image className="w-3.5 h-3.5 text-sky-400" />
          <span>Photo</span>
        </button>

        {/* Video button */}
        <button
          type="button"
          onClick={() => setActiveModal('video')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-stone-300 hover:text-white border border-[#282828] transition"
        >
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span>Video</span>
        </button>

        {/* GIF button */}
        <button
          type="button"
          onClick={() => setActiveModal('gif')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-stone-300 hover:text-white border border-[#282828] transition"
        >
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>GIF</span>
        </button>

        {/* Voice Note button */}
        <button
          type="button"
          onClick={() => setActiveModal('audio')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-stone-300 hover:text-white border border-[#282828] transition"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          <span>Voice Note</span>
        </button>

        {/* Music button */}
        <button
          type="button"
          onClick={() => setActiveModal('music')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-stone-300 hover:text-white border border-[#282828] transition"
        >
          <Music className="w-3.5 h-3.5 text-purple-400" />
          <span>Music</span>
        </button>
      </div>

      {/* Render Attached Media Badges & Previews */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 bg-[#111111] border border-[#222222] rounded-xl">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group bg-[#161616] border border-[#282828] rounded-xl overflow-hidden p-2 text-xs flex flex-col justify-between"
            >
              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemoveMedia(item.id)}
                className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-900/80 text-stone-400 hover:text-white rounded-md transition z-10"
                title="Remove attachment"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {item.type === 'photo' && (
                <div>
                  <img
                    src={item.url}
                    alt={item.caption || 'Attached photo'}
                    className="w-full h-24 object-cover rounded-lg mb-1.5"
                  />
                  {item.caption && (
                    <p className="text-[10px] text-stone-400 truncate">{item.caption}</p>
                  )}
                </div>
              )}

              {item.type === 'gif' && (
                <div>
                  <img
                    src={item.url}
                    alt={item.caption || 'GIF'}
                    className="w-full h-24 object-cover rounded-lg mb-1.5"
                  />
                  <span className="text-[9px] font-mono-journal text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded">
                    GIF
                  </span>
                </div>
              )}

              {item.type === 'video' && (
                <div className="space-y-1">
                  <div className="w-full h-20 bg-black rounded-lg flex items-center justify-center text-rose-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] text-stone-400 truncate">
                    {item.caption || 'Attached Video'}
                  </p>
                </div>
              )}

              {item.type === 'audio' && (
                <div className="space-y-1.5 p-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(item.id, item.url)}
                      className="p-1.5 bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 rounded-lg"
                    >
                      {playingAudioId === item.id ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                    <div className="truncate">
                      <p className="font-medium text-stone-200 text-[11px] truncate">
                        {item.title || 'Voice Note'}
                      </p>
                      {item.duration && (
                        <p className="text-[10px] text-stone-500 font-mono-journal">
                          {item.duration}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {item.type === 'music' && (
                <div className="space-y-1 p-1">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-stone-200 text-[11px] truncate">
                        {item.title}
                      </p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-purple-400 hover:underline truncate block"
                      >
                        Listen link &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialogs */}

      {/* Photo Modal */}
      {activeModal === 'photo' && (
        <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Image className="w-4 h-4 text-sky-400" />
              <span>Attach Photo</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">
                Upload from device:
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="flex items-center justify-center gap-2 w-full p-2.5 bg-[#1C1C1C] hover:bg-[#252525] border border-dashed border-[#333333] rounded-xl text-stone-300 transition"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing image...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Image File (JPG, PNG, WebP)</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-[10px] text-stone-500 font-mono-journal">
              &mdash; OR PASTE IMAGE URL &mdash;
            </div>

            <input
              type="text"
              placeholder="https://example.com/photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />

            <input
              type="text"
              placeholder="Optional caption..."
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />

            {photoUrl && (
              <button
                type="button"
                onClick={() => handleAddPhoto(photoUrl, photoCaption)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl transition"
              >
                Attach Photo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {activeModal === 'video' && (
        <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-rose-400" />
              <span>Attach Video</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="YouTube or MP4 Video URL..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />
            <input
              type="text"
              placeholder="Optional video description/title..."
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />
            <button
              type="button"
              onClick={handleAddVideo}
              disabled={!videoUrl.trim()}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl transition disabled:opacity-40"
            >
              Attach Video
            </button>
          </div>
        </div>
      )}

      {/* GIF Picker Modal */}
      {activeModal === 'gif' && (
        <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Film className="w-4 h-4 text-amber-400" />
              <span>Attach Expressive GIF</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <p className="text-[11px] text-stone-400 mb-2">Curated Mood Moments:</p>
            <div className="grid grid-cols-3 gap-2">
              {CURATED_GIFS.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => handleAddGif(gif.url, gif.label)}
                  className="group relative rounded-xl overflow-hidden border border-[#262626] hover:border-amber-500 transition text-left"
                >
                  <img src={gif.url} alt={gif.label} className="w-full h-16 object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 p-1 text-[9px] text-stone-300 truncate">
                    {gif.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#242424] space-y-2">
            <input
              type="text"
              placeholder="Or paste any GIF image URL (Tenor, Giphy)..."
              value={customGifUrl}
              onChange={(e) => setCustomGifUrl(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />
            {customGifUrl && (
              <button
                type="button"
                onClick={() => handleAddGif(customGifUrl, 'Custom GIF')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl transition"
              >
                Attach Custom GIF
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice Recorder Modal */}
      {activeModal === 'audio' && (
        <div className="p-5 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-4 text-xs animate-fade-in text-center">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Record Voice Audio Note</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (isRecording) voiceRecorder.cancel();
                setActiveModal(null);
              }}
              className="text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-rose-950/80 border-2 border-rose-500 animate-pulse text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                  : 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400'
              }`}
            >
              <Mic className="w-8 h-8" />
            </div>

            {isRecording ? (
              <div className="space-y-1">
                <span className="text-sm font-mono-journal text-rose-400 font-bold">
                  Recording: {recordSeconds}s
                </span>
                <p className="text-[10px] text-stone-400">Speak your thoughts freely...</p>
              </div>
            ) : (
              <p className="text-xs text-stone-400 max-w-xs">
                Capture voice memos, spoken reflections, or raw thoughts directly into your journal entry.
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs transition shadow-md"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Attach Note</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Music Modal */}
      {activeModal === 'music' && (
        <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-400" />
              <span>Attach Music / Sound Track</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Track Title (e.g. Clair de Lune / Lo-fi Morning)..."
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />
            <input
              type="text"
              placeholder="Track URL (Spotify, Soundcloud, YouTube, Audio link)..."
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              className="w-full p-2 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
            />
            <button
              type="button"
              onClick={handleAddMusic}
              disabled={!musicUrl.trim()}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl transition disabled:opacity-40"
            >
              Attach Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
