"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { dict, type Locale } from "@/lib/i18n-config";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (result: { type: "photo" | "video"; dataUrl: string }) => void;
  initialMode?: "photo" | "video";
  currentLocale?: Locale;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  initialMode = "photo",
  currentLocale = "pt",
}: CameraCaptureModalProps) {
  const t = dict[currentLocale] || dict.pt;

  const [mode, setMode] = useState<"photo" | "video">(initialMode);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Estados de Foto
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Estados de Vídeo
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const photoFallbackInputRef = useRef<HTMLInputElement>(null);
  const videoFallbackInputRef = useRef<HTMLInputElement>(null);

  const MAX_RECORDING_SECONDS = 30;

  // Interrompe todas as faixas da câmara e microfone
  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Inicializa o stream da câmara
  const startCamera = useCallback(async () => {
    stopTracks();
    setPermissionError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      if (mode === "photo") {
        photoFallbackInputRef.current?.click();
      } else {
        videoFallbackInputRef.current?.click();
      }
      return;
    }

    try {
      // Verificar se há múltiplas câmaras disponíveis
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {}

      const videoConstraints: MediaTrackConstraints = {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      let newStream: MediaStream | null = null;

      if (mode === "video") {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: true,
          });
        } catch {
          // Se falhar o microfone, tenta apenas vídeo
          newStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          });
        }
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      }

      setStream(newStream);

      if (videoRef.current && newStream) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Acesso direto WebRTC indisponível, a acionar câmara do sistema:", err);
      if (mode === "photo") {
        photoFallbackInputRef.current?.click();
      } else {
        videoFallbackInputRef.current?.click();
      }
    }
  }, [facingMode, mode, stopTracks]);

  // Quando o modal abre ou o modo/câmara muda
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setRecordedVideoUrl(null);
      setIsRecording(false);
      setRecordingSeconds(0);
      startCamera();
    } else {
      stopTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      stopTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, mode, facingMode]);

  // Atualiza stream no elemento <video>
  useEffect(() => {
    if (videoRef.current && stream && !capturedPhoto && !recordedVideoUrl) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedPhoto, recordedVideoUrl]);

  // Tirar fotografia do vídeo atual
  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const canvas = document.createElement("canvas");
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    // Limitar dimensões para otimizar tamanho
    const maxDim = 1280;
    let width = videoWidth;
    let height = videoHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Se for câmara frontal, podemos espelhar
      if (facingMode === "user") {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedPhoto(dataUrl);
      stopTracks();
    }
  };

  // Iniciar gravação de vídeo
  const handleStartRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    // Tipos mime suportados
    let options: MediaRecorderOptions = {};
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      options = { mimeType: "video/webm;codecs=vp9,opus" };
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      options = { mimeType: "video/webm" };
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      options = { mimeType: "video/mp4" };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedVideoUrl(reader.result as string);
          stopTracks();
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(500); // grava chunks a cada 500ms
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            handleStopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Falha ao iniciar MediaRecorder:", err);
    }
  };

  // Parar gravação de vídeo
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Confirmar e anexar foto
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture({ type: "photo", dataUrl: capturedPhoto });
      handleClose();
    }
  };

  // Confirmar e anexar vídeo
  const handleConfirmVideo = () => {
    if (recordedVideoUrl) {
      onCapture({ type: "video", dataUrl: recordedVideoUrl });
      handleClose();
    }
  };

  // Repetir captura de foto ou regravação de vídeo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setRecordedVideoUrl(null);
    setRecordingSeconds(0);
    startCamera();
  };

  // Alternar câmara frontal / traseira
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleClose = () => {
    stopTracks();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    onClose();
  };

  // Fallback: carregar ficheiro caso a câmara direta esteja bloqueada
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>, fileType: "photo" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onCapture({ type: fileType, dataUrl: reader.result as string });
      handleClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="camera-capture-modal"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{mode === "photo" ? "📸" : "📹"}</span>
            <h3 className="text-base font-bold text-white">
              {mode === "photo" ? t.socialCameraTitle : t.socialVideoRecorderTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador de Modos (Foto / Vídeo) */}
            {!capturedPhoto && !recordedVideoUrl && !isRecording && (
              <div className="flex rounded-xl bg-neutral-900 p-0.5 border border-neutral-800">
                <button
                  type="button"
                  data-testid="camera-mode-photo-btn"
                  onClick={() => setMode("photo")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "photo" ? "bg-blue-600 text-white shadow-sm" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  📷 {t.socialTakePhoto}
                </button>
                <button
                  type="button"
                  data-testid="camera-mode-video-btn"
                  onClick={() => setMode("video")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "video" ? "bg-red-600 text-white shadow-sm" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  📹 {t.socialRecordVideo}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              data-testid="close-camera-modal-btn"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Ecrã de Visualização da Câmara / Pré-visualização da Mídia */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-neutral-850 shadow-inner flex items-center justify-center">
          {/* Flash Effect */}
          {isFlashing && <div className="absolute inset-0 z-30 bg-white animate-fadeOut" />}

          {/* 1. Fotografia Capturada (Revisão) */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Fotografia Tirada"
              data-testid="captured-photo-preview"
              className="h-full w-full object-contain"
            />
          )}

          {/* 2. Vídeo Gravado (Revisão) */}
          {recordedVideoUrl && (
            <video
              src={recordedVideoUrl}
              controls
              playsInline
              autoPlay
              data-testid="recorded-video-preview"
              className="h-full w-full object-contain"
            />
          )}

          {/* 3. Stream Ao Vivo da Câmara */}
          {!capturedPhoto && !recordedVideoUrl && !permissionError && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                data-testid="live-camera-video"
                className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
              />

              {/* Viewfinder HUD */}
              <div className="pointer-events-none absolute inset-0 border-2 border-white/10 rounded-2xl m-3 flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[10px] text-white/70 font-mono">
                  <span className="bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {mode === "photo" ? "PHOTO 4:3 HD" : "VIDEO REC 720p"}
                  </span>
                  {isRecording && (
                    <span className="flex items-center gap-1.5 bg-red-600/90 text-white font-bold px-2.5 py-0.5 rounded-full animate-pulse shadow-md">
                      <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                      REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:{MAX_RECORDING_SECONDS}
                    </span>
                  )}
                </div>

                <div className="flex justify-center">
                  <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center opacity-40">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between text-[9px] text-white/50 font-mono">
                  <span>MFSTECH CAM</span>
                  <span>{mode === "video" ? `${MAX_RECORDING_SECONDS - recordingSeconds}s max` : "AUTO FOCUS"}</span>
                </div>
              </div>
            </>
          )}

          {/* 4. Opção de Dispositivo / Conexão */}
          {!stream && !capturedPhoto && !recordedVideoUrl && (
            <div className="p-6 text-center space-y-3">
              <span className="text-3xl animate-bounce">📸</span>
              <p className="text-xs text-neutral-300 max-w-sm">
                Aceder à câmara do telemóvel ou dispositivo:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => photoFallbackInputRef.current?.click()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  📷 Tirar Foto Agora
                </button>
                <button
                  type="button"
                  onClick={() => videoFallbackInputRef.current?.click()}
                  className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  📹 Gravar Vídeo Agora
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inputs Ocultos de Fallback / Dispositivo Móvel */}
        <input
          ref={photoFallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFallbackFile(e, "photo")}
          className="hidden"
        />
        <input
          ref={videoFallbackInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(e) => handleFallbackFile(e, "video")}
          className="hidden"
        />

        {/* Barra de Controlos e Ações */}
        <div className="flex items-center justify-between pt-1">
          {/* Botão de Trocar Câmara (se disponível) */}
          {hasMultipleCameras && !capturedPhoto && !recordedVideoUrl && !isRecording && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              title={t.socialSwitchCamera}
            >
              <span>🔄</span>
              <span className="hidden sm:inline">{t.socialSwitchCamera}</span>
            </button>
          )}

          <div className="flex-1" />

          {/* Controlos no Modo FOTO */}
          {mode === "photo" && !capturedPhoto && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTakePhoto}
                data-testid="take-photo-shutter-btn"
                className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white p-1 shadow-lg hover:scale-105 active:scale-95 transition-all"
                title={t.socialTakePhoto}
              >
                <div className="h-11 w-11 rounded-full border-2 border-neutral-950 bg-white group-hover:bg-neutral-100 transition-colors flex items-center justify-center text-lg">
                  📸
                </div>
              </button>
            </div>
          )}

          {/* Controlos no Modo VÍDEO */}
          {mode === "video" && !recordedVideoUrl && (
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  data-testid="start-record-btn"
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 px-5 py-3 text-xs font-bold text-white shadow-lg hover:shadow-red-900/40 active:scale-95 transition-all"
                >
                  <span className="h-3 w-3 rounded-full bg-white" />
                  <span>{t.socialStartRecording}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  data-testid="stop-record-btn"
                  className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-red-500/40 px-5 py-3 text-xs font-bold text-red-400 shadow-lg active:scale-95 transition-all animate-pulse"
                >
                  <span className="h-3 w-3 rounded-sm bg-red-500" />
                  <span>{t.socialStopRecording}</span>
                </button>
              )}
            </div>
          )}

          {/* Ações após Fotografia Tirada */}
          {capturedPhoto && (
            <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
              <button
                type="button"
                onClick={handleRetake}
                data-testid="retake-photo-btn"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                🔄 {t.socialRetake}
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                data-testid="confirm-photo-btn"
                className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                ✓ {t.socialAttachPhoto}
              </button>
            </div>
          )}

          {/* Ações após Vídeo Gravado */}
          {recordedVideoUrl && (
            <div className="flex flex-wrap items-center gap-2 w-full justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  try {
                    const a = document.createElement("a");
                    a.href = recordedVideoUrl;
                    a.download = `video-mfstech-${Date.now()}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } catch {}
                  window.open("https://www.youtube.com/upload", "_blank");
                }}
                className="rounded-xl border border-red-500/30 bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white px-3 py-2 text-xs font-semibold transition-all"
                title="Guardar no telemóvel/computador e abrir o YouTube"
              >
                ▶️ {t.socialSaveAndOpenYouTube}
              </button>
              <button
                type="button"
                onClick={handleRetake}
                data-testid="retake-video-btn"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                🔄 {t.socialRetake}
              </button>
              <button
                type="button"
                onClick={handleConfirmVideo}
                data-testid="confirm-video-btn"
                className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                ✓ {t.socialAttachVideo}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

