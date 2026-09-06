import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Clock,
  Sparkles,
  Radio,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { VoiceRecorder } from '../services/mediaService';
import { MediaAttachment } from '../types/journal';

interface AudioNoteRecorderProps {
  onAttachAudio: (item: MediaAttachment) => void;
  onClose: () => void;
  maxDurationSeconds?: number; // default 300s (5 min) recommended max
}

export const AudioNoteRecorder: React.FC<AudioNoteRecorderProps> = ({
  onAttachAudio,
  onClose,
  maxDurationSeconds = 300,
}) => {
  // Recording lifecycle: 'idle' | 'recording' | 'paused' | 'review'
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'review'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedData, setRecordedData] = useState<{
    dataUrl: string;
    duration: number;
    blob: Blob;
  } | null>(null);

  // Review & Playback state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [noteTitle, setNoteTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio frequency visualization levels (32 bars)
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(28).fill(10));

  // Refs
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (voiceRecorderRef.current) {
        voiceRecorderRef.current.cancel();
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Web Audio API frequency visualizer
  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 28 frequency bins
        const step = Math.max(1, Math.floor(bufferLength / 28));
        const bars: number[] = [];
        for (let i = 0; i < 28; i++) {
          const val = dataArray[i * step] || 0;
          // Scale to percentage height (12% to 100%)
          const pct = Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          bars.push(pct);
        }
        setFrequencyData(bars);
        animFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();
    } catch (e) {
      console.warn('Web Audio visualizer unavailable, using animated wave', e);
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    setErrorMessage(null);
    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      voiceRecorderRef.current = recorder;

      const stream = recorder.getStream();
      if (stream) {
        setupAudioVisualizer(stream);
      }

      setStatus('recording');
      setElapsedSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            handleStopRecording();
            return maxDurationSeconds;
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Recording initialization error:', err);
      setErrorMessage(
        err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
          ? 'Microphone access denied. Please grant permission in your browser.'
          : 'Unable to start audio recording. Please verify your microphone.'
      );
    }
  };

  // Pause recording
  const handlePauseRecording = () => {
    if (status !== 'recording' || !voiceRecorderRef.current) return;
    voiceRecorderRef.current.pause();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setStatus('paused');
  };

  // Resume recording
  const handleResumeRecording = () => {
    if (status !== 'paused' || !voiceRecorderRef.current) return;
    voiceRecorderRef.current.resume();

    const stream = voiceRecorderRef.current.getStream();
    if (stream && analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const step = Math.max(1, Math.floor(bufferLength / 28));
        const bars: number[] = [];
        for (let i = 0; i < 28; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
        }
        setFrequencyData(bars);
        animFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    }

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) {
          handleStopRecording();
          return maxDurationSeconds;
        }
        return next;
      });
    }, 1000);
    setStatus('recording');
  };

  // Stop recording and enter review mode
  const handleStopRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (!voiceRecorderRef.current) return;

    try {
      const result = await voiceRecorderRef.current.stop();
      setRecordedData(result);
      setStatus('review');

      // Default title with time
      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setNoteTitle(`Spoken Reflection (${timeStr})`);
    } catch (err) {
      console.error('Error stopping recorder:', err);
      setErrorMessage('Failed to finalize recorded audio.');
      setStatus('idle');
    }
  };

  // Discard and reset
  const handleReset = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setPreviewProgress(0);
    setRecordedData(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setStatus('idle');
  };

  // Toggle preview playback
  const handleTogglePreviewPlay = () => {
    if (!recordedData) return;

    if (isPlayingPreview) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioRef.current) {
        const audio = new Audio(recordedData.dataUrl);
        previewAudioRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration) {
            setPreviewProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          setIsPlayingPreview(false);
          setPreviewProgress(0);
        };
      }
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Seek preview audio
  const handleSeekPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPreviewProgress(val);
    if (previewAudioRef.current && previewAudioRef.current.duration) {
      previewAudioRef.current.currentTime = (val / 100) * previewAudioRef.current.duration;
    }
  };

  // Save and attach to entry
  const handleConfirmAttach = () => {
    if (!recordedData) return;

    const attachment: MediaAttachment = {
      id: 'audio-' + Date.now(),
      type: 'audio',
      url: recordedData.dataUrl,
      title: noteTitle.trim() || `Voice Reflection (${formatTime(recordedData.duration)})`,
      duration: recordedData.duration,
    };

    onAttachAudio(attachment);
    onClose();
  };

  // Progress metrics
  const progressPercent = Math.min(100, (elapsedSeconds / maxDurationSeconds) * 100);
  const strokeRadius = 58;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Reflection depth milestone label
  const getReflectionPacing = () => {
    if (elapsedSeconds < 30) return { label: 'Quick Thought', color: 'text-stone-400' };
    if (elapsedSeconds < 90) return { label: 'Focused Reflection', color: 'text-amber-400' };
    if (elapsedSeconds < 180) return { label: 'Deep Insight', color: 'text-emerald-400' };
    return { label: 'Narrative Sanctuary', color: 'text-purple-400' };
  };

  const pacing = getReflectionPacing();

  return (
    <div className="p-5 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-4 text-xs animate-fade-in shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-journal font-semibold text-white text-sm">
              Record Voice Audio Note
            </h3>
            <p className="text-[11px] text-stone-400 font-mono-journal">
              Capture your spoken reflections, vocal musings, and audio streams
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (status === 'recording' || status === 'paused') {
              voiceRecorderRef.current?.cancel();
            }
            onClose();
          }}
          className="text-stone-400 hover:text-white p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Recording Workspace */}
      {status !== 'review' ? (
        <div className="py-2 flex flex-col items-center justify-center space-y-5">
          {/* Circular Visual Progress Timer Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center select-none">
            {/* Pulsing Aura when recording */}
            {status === 'recording' && (
              <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping duration-1000 pointer-events-none" />
            )}

            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
              {/* Background Track Circle */}
              <circle
                cx="70"
                cy="70"
                r={strokeRadius}
                fill="transparent"
                stroke="#222222"
                strokeWidth="7"
              />

              {/* Milestone Dots on Circumference: 30s, 90s, 180s, 300s */}
              {[30, 90, 180, 300].map((sec) => {
                const angle = (sec / maxDurationSeconds) * 360;
                const rad = (angle * Math.PI) / 180;
                const cx = 70 + strokeRadius * Math.cos(rad);
                const cy = 70 + strokeRadius * Math.sin(rad);
                const isPassed = elapsedSeconds >= sec;
                return (
                  <circle
                    key={sec}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill={isPassed ? '#F59E0B' : '#333333'}
                    stroke="#141414"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Active Animated Progress Stroke */}
              <circle
                cx="70"
                cy="70"
                r={strokeRadius}
                fill="transparent"
                stroke={
                  status === 'paused'
                    ? '#F59E0B'
                    : elapsedSeconds > maxDurationSeconds * 0.85
                    ? '#EF4444'
                    : '#10B981'
                }
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear"
              />
            </svg>

            {/* Inner Core: Digital Timer & Status Badges */}
            <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
              {/* Status Pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1A1A1A] border border-[#2B2B2B]">
                {status === 'recording' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-mono-journal font-bold uppercase tracking-wider text-rose-400">
                      REC
                    </span>
                  </>
                ) : status === 'paused' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-mono-journal font-bold uppercase tracking-wider text-amber-400">
                      PAUSED
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-stone-400" />
                    <span className="text-[10px] font-mono-journal uppercase tracking-wider text-stone-400">
                      READY
                    </span>
                  </>
                )}
              </div>

              {/* Large Digital Clock (MM:SS) */}
              <span className="font-mono-journal text-3xl font-bold text-white tracking-wider">
                {formatTime(elapsedSeconds)}
              </span>

              {/* Max Benchmark Display */}
              <span className="text-[10px] font-mono-journal text-stone-500">
                / {formatTime(maxDurationSeconds)}
              </span>
            </div>
          </div>

          {/* Dynamic Sound Waveform Visualizer */}
          <div className="w-full max-w-sm space-y-2">
            <div className="h-10 px-3 py-1 bg-[#101010] border border-[#242424] rounded-xl flex items-center justify-between gap-1 overflow-hidden">
              {frequencyData.map((height, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-full transition-all duration-75"
                  style={{
                    height: status === 'recording' ? `${height}%` : '15%',
                    backgroundColor:
                      status === 'recording'
                        ? idx % 4 === 0
                          ? '#10B981'
                          : idx % 2 === 0
                          ? '#34D399'
                          : '#059669'
                        : status === 'paused'
                        ? '#D97706'
                        : '#333333',
                  }}
                />
              ))}
            </div>

            {/* Reflection Pacing Guide */}
            <div className="flex items-center justify-between text-[10px] font-mono-journal px-1 text-stone-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Pacing:</span>
                <strong className={pacing.color}>{pacing.label}</strong>
              </span>
              <span>{Math.round(progressPercent)}% of session</span>
            </div>
          </div>

          {/* Linear Timeline Bar with Checkpoint Labels */}
          <div className="w-full max-w-sm space-y-1">
            <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  status === 'paused'
                    ? 'bg-amber-500'
                    : elapsedSeconds > maxDurationSeconds * 0.85
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono-journal text-stone-500">
              <span>0:00</span>
              <span className={elapsedSeconds >= 30 ? 'text-amber-400' : ''}>0:30</span>
              <span className={elapsedSeconds >= 90 ? 'text-emerald-400' : ''}>1:30</span>
              <span className={elapsedSeconds >= 180 ? 'text-purple-400' : ''}>3:00</span>
              <span className={elapsedSeconds >= 300 ? 'text-rose-400' : ''}>5:00</span>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {status === 'idle' ? (
              <button
                type="button"
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs transition shadow-lg cursor-pointer hover:scale-105 active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>Start Audio Reflection</span>
              </button>
            ) : (
              <>
                {/* Pause / Resume Button */}
                {status === 'recording' ? (
                  <button
                    type="button"
                    onClick={handlePauseRecording}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#202020] hover:bg-[#282828] border border-[#333333] text-stone-200 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResumeRecording}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                )}

                {/* Stop & Review Button */}
                <button
                  type="button"
                  onClick={handleStopRecording}
                  disabled={elapsedSeconds < 1}
                  className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Finish & Review ({formatTime(elapsedSeconds)})</span>
                </button>

                {/* Discard Button */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                  title="Discard recording"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Review & Playback Screen */
        <div className="py-3 space-y-4">
          <div className="p-4 rounded-xl bg-[#181818] border border-[#2B2B2B] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-semibold text-stone-200">
                  Reflection Audio Captured
                </span>
              </div>
              <span className="text-[11px] font-mono-journal text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/40">
                Duration: {formatTime(recordedData?.duration || elapsedSeconds)}
              </span>
            </div>

            {/* Note Title input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono-journal uppercase text-stone-400">
                Audio Note Title
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Give your audio reflection a title..."
                className="w-full bg-[#101010] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Audio Playback Scrubbing Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePreviewPlay}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition shadow-xs cursor-pointer"
                >
                  {isPlayingPreview ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={previewProgress}
                    onChange={handleSeekPreview}
                    className="w-full h-1.5 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono-journal text-stone-500">
                    <span>
                      {formatTime(
                        Math.round(
                          ((recordedData?.duration || elapsedSeconds) * previewProgress) / 100
                        )
                      )}
                    </span>
                    <span>{formatTime(recordedData?.duration || elapsedSeconds)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm or Re-record actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Record Again</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-stone-400 hover:text-stone-200 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAttach}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Attach Reflection Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
