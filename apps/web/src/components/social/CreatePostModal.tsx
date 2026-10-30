"use client";

import React, { useState, useRef } from "react";
import { extractYouTubeVideoId, isGooglePhotosUrl, isYouTubeUrl, isVideoUrl } from "@/lib/social-media";
import { dict, type Locale } from "@/lib/i18n-config";
import { CameraCaptureModal } from "./CameraCaptureModal";

interface CreatePostModalProps {
  onPostCreated?: (newPost?: any) => void;
  currentLocale?: Locale;
  currentUser?: { id?: string; name?: string | null; email?: string | null; role?: string | null } | null;
}

export function CreatePostModal({
  onPostCreated,
  currentLocale = "pt",
  currentUser,
}: CreatePostModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [authorName, setAuthorName] = useState(currentUser?.name ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal da Máquina Fotográfica / Gravador de Vídeo
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraModalMode, setCameraModalMode] = useState<"photo" | "video">("photo");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);
  const t = dict[currentLocale] || dict.pt;

  const isMobileDevice = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isTouch = navigator.maxTouchPoints > 0;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (isTouch && window.innerWidth <= 1024)
    );
  };

  // Acionamento inteligente: no telemóvel abre a câmara nativa diretamente, no desktop abre o visor
  const handleTriggerTakePhoto = () => {
    if (isMobileDevice()) {
      cameraPhotoInputRef.current?.click();
    } else {
      setCameraModalMode("photo");
      setCameraModalOpen(true);
    }
  };

  const handleTriggerRecordVideo = () => {
    if (isMobileDevice()) {
      cameraVideoInputRef.current?.click();
    } else {
      setCameraModalMode("video");
      setCameraModalOpen(true);
    }
  };

  const detectedYouTubeId = isYouTubeUrl(mediaUrl) ? extractYouTubeVideoId(mediaUrl) : null;
  const detectedGooglePhotos = (isGooglePhotosUrl(mediaUrl) || !!photoPreview) && !videoPreview;
  const detectedVideo = isVideoUrl(mediaUrl) || !!videoPreview;

  // Processa a captura da câmara ou gravação de vídeo
  const handleCameraCapture = (result: { type: "photo" | "video"; dataUrl: string }) => {
    if (result.type === "photo") {
      setPhotoPreview(result.dataUrl);
      setVideoPreview(null);
      setMediaUrl(result.dataUrl);
    } else {
      setVideoPreview(result.dataUrl);
      setPhotoPreview(null);
      setMediaUrl(result.dataUrl);
    }
    setError(null);
    setOpen(true); // Garante que o formulário está aberto para preencher texto
  };

  // Processa o upload de foto do telemóvel/computador com compressão client-side
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um ficheiro de imagem válido (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setPhotoPreview(compressedDataUrl);
          setVideoPreview(null);
          setMediaUrl(compressedDataUrl);
          setError(null);
          setOpen(true);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Processa o upload de ficheiro de vídeo
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Por favor, selecione um ficheiro de vídeo válido (MP4, WebM, MOV).");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError("O vídeo selecionado excede o limite máximo recomendado de 30MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setVideoPreview(result);
      setPhotoPreview(null);
      setMediaUrl(result);
      setError(null);
      setOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (mediaUrl.startsWith("data:image/")) {
      setMediaUrl("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = () => {
    setVideoPreview(null);
    if (mediaUrl.startsWith("data:video/")) {
      setMediaUrl("");
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const finalMedia = videoPreview || photoPreview || mediaUrl.trim() || null;

      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          mediaUrl: finalMedia,
          authorName: authorName.trim() || currentUser?.name || t.socialBadge,
          authorEmail: currentUser?.email || "mfstechsocial@gmail.com",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao criar publicação.");
      }

      setTitle("");
      setContent("");
      setMediaUrl("");
      setPhotoPreview(null);
      setVideoPreview(null);
      setOpen(false);

      if (onPostCreated) {
        onPostCreated(json.data);
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível criar a publicação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Caixa Rápida de Publicação no Topo do Feed */}
      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20">
            ✍️
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            id="open-create-post-btn"
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-2.5 text-left text-sm text-neutral-400 hover:border-neutral-700 hover:text-neutral-300 transition-all shadow-inner"
          >
            {t.socialSharePrompt}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-blue-900/30 active:scale-95 shrink-0"
          >
            {t.socialPublish}
          </button>
        </div>

        {/* Atalhos Rápidos da Câmara e Mídia */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/60">
          <button
            type="button"
            onClick={handleTriggerTakePhoto}
            id="quick-open-camera-btn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-all active:scale-95 shadow-sm"
          >
            <span>📸</span>
            <span>{t.socialTakePhoto}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRecordVideo}
            id="quick-record-video-btn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all active:scale-95 shadow-sm"
          >
            <span>📹</span>
            <span>{t.socialRecordVideo}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
          >
            <span>📁</span>
            <span>{t.socialUploadPhoto}</span>
          </button>
        </div>
      </div>

      {/* Inputs nativos para abertura direta da câmara no telemóvel */}
      <input
        ref={cameraPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={cameraVideoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {/* Modal da Câmara / Gravador de Vídeo */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        initialMode={cameraModalMode}
        currentLocale={currentLocale}
      />

      {/* Modal Principal de Criação de Publicação */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 shadow-2xl space-y-3.5 my-auto"
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-base font-bold text-white">
                  {t.socialNewPost}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nome do Autor */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  {t.socialYourName}
                </label>
                <input
                  type="text"
                  data-testid="post-author-input"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex.: Miguel Ângelo"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Título da Publicação */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  {t.socialPostTitle}
                </label>
                <input
                  type="text"
                  data-testid="post-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Novidades de Engenharia de Software"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Conteúdo / Mensagem */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  {t.socialMessage} <span className="text-red-400">*</span>
                </label>
                <textarea
                  data-testid="post-content-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.socialSharePrompt}
                  rows={4}
                  required
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Seção de Mídia: Opções de Câmara, Gravação de Vídeo e Ficheiro */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-neutral-400">
                    {t.socialMediaUrl}
                  </label>

                  {/* Barra de Ferramentas de Mídia (Câmara, Gravação, Upload) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Botão Máquina Fotográfica */}
                    <button
                      type="button"
                      onClick={handleTriggerTakePhoto}
                      id="modal-open-camera-btn"
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition-colors"
                      title={t.socialTakePhoto}
                    >
                      <span>📸</span>
                      <span>{t.socialTakePhoto}</span>
                    </button>

                    {/* Botão Gravar Vídeo */}
                    <button
                      type="button"
                      onClick={handleTriggerRecordVideo}
                      id="modal-record-video-btn"
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-300 transition-colors"
                      title={t.socialRecordVideo}
                    >
                      <span>📹</span>
                      <span>{t.socialRecordVideo}</span>
                    </button>

                    {/* Botão Upload de Imagem */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      id="upload-photo-btn"
                      className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 px-2 py-1 text-[11px] font-semibold text-neutral-300 transition-colors"
                      title="Carregar Imagem"
                    >
                      <span>🖼️</span>
                    </button>

                    {/* Botão Upload de Vídeo */}
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      id="upload-video-btn"
                      className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 px-2 py-1 text-[11px] font-semibold text-neutral-300 transition-colors"
                      title="Carregar Vídeo"
                    >
                      <span>🎬</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  data-testid="post-media-input"
                  value={mediaUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMediaUrl(val);
                    if (val.startsWith("data:video/") || /\.(mp4|webm|ogg|mov|m4v)/i.test(val)) {
                      setVideoPreview(val);
                      setPhotoPreview(null);
                    } else if (val.startsWith("data:image/") || /\.(jpe?g|png|webp|gif|svg)/i.test(val) || val.includes("googleusercontent.com")) {
                      setPhotoPreview(val);
                      setVideoPreview(null);
                    } else if (!val) {
                      setPhotoPreview(null);
                      setVideoPreview(null);
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=... ou https://photos.app.goo.gl/..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <p className="text-[11px] text-neutral-400">
                  💡 {t.socialPhotoTip}
                </p>
              </div>

              {/* Pré-visualização da Fotografia Tirada ou Carregada */}
              {photoPreview && (
                <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      ✓ {t.socialPhotoUploaded}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      {t.socialRemovePhoto}
                    </button>
                  </div>
                  <div className="relative aspect-video max-h-48 overflow-hidden rounded-lg bg-black flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Pré-visualização"
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Pré-visualização do Vídeo Gravado ou Carregado */}
              {videoPreview && (
                <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      ✓ {t.socialVideoUploaded}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      {t.socialRemoveVideo}
                    </button>
                  </div>
                  <div className="relative aspect-video max-h-48 overflow-hidden rounded-lg bg-black flex items-center justify-center">
                    <video
                      src={videoPreview}
                      controls
                      playsInline
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Indicador de Pré-visualização de YouTube */}
              {detectedYouTubeId && !photoPreview && !videoPreview && (
                <div className="flex items-center gap-2 rounded-xl bg-red-600/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <span>▶️</span>
                  <span>Vídeo do YouTube detectado! Será executado dentro da publicação com link direto.</span>
                </div>
              )}

              {/* Indicador de Pré-visualização de Google Fotos por URL */}
              {detectedGooglePhotos && !photoPreview && !detectedYouTubeId && !videoPreview && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 p-2.5 text-xs text-blue-400">
                  <span>📷</span>
                  <span>Link de Fotos detectado! As fotografias serão integradas na publicação.</span>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  {t.socialCancel}
                </button>
                <button
                  type="submit"
                  data-testid="post-submit-btn"
                  disabled={loading || !content.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white transition-all shadow-md hover:shadow-blue-900/30 active:scale-95 disabled:opacity-50"
                >
                  {loading ? t.socialPosting : t.socialPublishNow}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
