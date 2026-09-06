// Media utilities: Voice Recording, Image Compression, and Speech-to-Text Dictation

// Compress image file to base64 (JPEG, quality 0.7, max width/height 1200)
export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Voice Recorder Manager
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private elapsedBeforePause: number = 0;
  private lastResumeTime: number = 0;

  public async start(): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose optimal mimeType
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.startTime = Date.now();
    this.lastResumeTime = this.startTime;
    this.elapsedBeforePause = 0;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // collect slice every 250ms
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.elapsedBeforePause += Date.now() - this.lastResumeTime;
    }
  }

  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.lastResumeTime = Date.now();
    }
  }

  public isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused';
  }

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  public async stop(): Promise<{ dataUrl: string; duration: number; blob: Blob }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        let totalElapsedMs = this.elapsedBeforePause;
        if (this.mediaRecorder?.state !== 'paused') {
          totalElapsedMs += Date.now() - this.lastResumeTime;
        }
        const duration = Math.max(1, Math.round(totalElapsedMs / 1000));
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });

        // Clean up audio tracks
        if (this.stream) {
          this.stream.getTracks().forEach((t) => t.stop());
          this.stream = null;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            dataUrl: reader.result as string,
            duration,
            blob,
          });
        };
        reader.onerror = () => reject(new Error('Failed to convert audio'));
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

// Browser Speech Dictation (Speech to Text)
export function createSpeechDictation(
  onTranscript: (text: string) => void,
  onError?: (err: string) => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
    }
    if (finalTranscript) {
      onTranscript(finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
    if (onError) onError(event.error || 'speech_recognition_error');
  };

  recognition.onend = () => {
    if (onError) onError('ended');
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {}
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {}
    },
  };
}
