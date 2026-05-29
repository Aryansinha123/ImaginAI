"use client";

import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useToast } from "./ToastProvider";
import { 
  Download, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Loader2 
} from "lucide-react";
import axios from "axios";

export default function GalleryView() {
  const { activeProject, scenes, updateScene } = useStore();
  const { toast, confirmAction } = useToast();
  
  // State for image zoom modal
  const [activeImage, setActiveImage] = useState(null); // { sceneId, filename, index, images }
  const [isDeleting, setIsDeleting] = useState(null); // filename being deleted

  // Handle keyboard navigation for zoomed modal
  useEffect(() => {
    if (!activeImage) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveImage(null);
      } else if (e.key === "ArrowLeft") {
        navigateModal(-1);
      } else if (e.key === "ArrowRight") {
        navigateModal(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImage]);

  // Group scenes that have images
  const scenesWithImages = (scenes || [])
    .filter(s => (s.images && s.images.length > 0) || s.image)
    .sort((a, b) => (a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0));

  // Navigate zoomed carousel
  const navigateModal = (direction) => {
    if (!activeImage) return;
    const { images, index } = activeImage;
    const total = images.length;
    let nextIndex = index + direction;
    if (nextIndex < 0) nextIndex = total - 1;
    if (nextIndex >= total) nextIndex = 0;

    setActiveImage({
      ...activeImage,
      filename: images[nextIndex],
      index: nextIndex
    });
  };

  // Download image helper using Next.js proxy endpoint to bypass browser CORS blocks
  const handleDownload = (filename, title, index) => {
    try {
      const link = document.createElement("a");
      link.href = `/api/images/${filename}?download=true&title=${encodeURIComponent(title || "image")}`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        type: "success",
        title: "Download started",
        message: "Your generated image is on the way.",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        type: "error",
        title: "Download failed",
        message: "Could not start the image download.",
      });
    }
  };

  // Delete image helper (removes physical file + updates MongoDB)
  const handleDelete = async (scene, filename) => {
    if (isDeleting) return;
    
    const confirmDelete = await confirmAction({
      title: "Delete generated image?",
      message: "This removes the image from the gallery and updates the scene record.",
      confirmText: "Delete Image",
      variant: "danger",
    });
    if (!confirmDelete) return;

    setIsDeleting(filename);
    try {
      // 1. Delete the physical image file from the backend API
      try {
        await axios.delete(`http://127.0.0.1:8000/generated_images/${filename}`);
      } catch (backendErr) {
        // If file is already gone or backend is down, log it but continue updating DB
        console.warn("Backend physical deletion warning:", backendErr);
      }

      // 2. Filter images array
      const currentImages = scene.images || (scene.image ? [scene.image] : []);
      const updatedImages = currentImages.filter(img => img !== filename);
      
      // Compute new primary image if deleted was the primary
      let updatedImage = scene.image;
      if (scene.image === filename) {
        updatedImage = updatedImages.length > 0 ? updatedImages[0] : null;
      }

      // 3. Save updates in MongoDB using store action
      await updateScene(activeProject.id, scene.id, {
        images: updatedImages,
        image: updatedImage
      });

      toast({
        type: "success",
        title: "Image deleted",
        message: "The gallery and scene data are now updated.",
      });
      
      // Close zoom modal if the deleted image was active in the modal
      if (activeImage?.filename === filename) {
        setActiveImage(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        type: "error",
        title: "Delete failed",
        message: "The scene data could not be updated.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 relative scrollbar-thin bg-zinc-950/20">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />

      {/* Header Block */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-semibold block mb-1">
            Visual Assets
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Generated Scene Gallery
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Browse, download, or manage all generated cinematic storyboards and scene stills in the {activeProject?.name} universe.
          </p>
        </div>
      </div>

      {/* Main Gallery List */}
      <div className="relative z-10 space-y-10">
        {scenesWithImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-8 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/10">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-650 mb-4 shadow-inner">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-zinc-400">No Generated Images</h3>
            <p className="text-xs text-zinc-650 mt-1 max-w-xs leading-relaxed">
              Create and generate scene completions in the **Scene Studio** to automatically produce beautiful AI widescreen illustrations.
            </p>
          </div>
        ) : (
          scenesWithImages.map((scene, sceneIdx) => {
            const currentImages = scene.images || (scene.image ? [scene.image] : []);
            
            return (
              <div 
                key={scene.id} 
                className="space-y-4 bg-zinc-950/30 border border-zinc-900/60 p-6 rounded-3xl hover:border-zinc-900 transition-all duration-350"
              >
                {/* Scene Header */}
                <div className="flex items-center justify-between border-b border-zinc-900/50 pb-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-semibold">
                      Scene #{sceneIdx + 1} &bull; Order {scene.order}
                    </span>
                    <h3 className="text-sm font-extrabold text-white">
                      {scene.title || "Untitled Scene"}
                    </h3>
                  </div>
                  {scene.tone && (
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-450 font-mono capitalize">
                      {scene.tone} tone
                    </span>
                  )}
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {currentImages.map((img, imgIdx) => {
                    const isImgDeleting = isDeleting === img;
                    
                    return (
                      <div 
                        key={img} 
                        className="aspect-video bg-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden group shadow-lg"
                      >
                        {/* Widescreen Image */}
                        <img 
                          src={`/api/images/${img}`}
                          alt={`Storyboard frame for ${scene.title}`}
                          onClick={() => setActiveImage({
                            sceneId: scene.id,
                            filename: img,
                            index: imgIdx,
                            images: currentImages,
                            sceneTitle: scene.title,
                            sceneObj: scene
                          })}
                          className="w-full h-full object-cover cursor-zoom-in transition-all duration-500 group-hover:scale-[1.02]"
                        />

                        {/* Top Gradient Shadow Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Bottom Label (Visible on Hover) */}
                        <span className="absolute bottom-3 left-4 text-[9px] font-mono uppercase tracking-wider text-zinc-450 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          Frame 0{imgIdx + 1}
                        </span>

                        {/* Action Toolbar overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {/* Download Button */}
                          <button
                            onClick={() => handleDownload(img, scene.title, imgIdx)}
                            className="p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                            title="Download Frame"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(scene, img)}
                            disabled={isImgDeleting}
                            className="p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/40 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
                            title="Delete Frame"
                          >
                            {isImgDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-550" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fullscreen Carousel Modal Overlay */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-fade-in">
          {/* Close Modal Button */}
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 z-55"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous Frame Trigger */}
          <button
            onClick={() => navigateModal(-1)}
            className="absolute left-6 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 z-55"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Zoomed Widescreen Display Container */}
          <div className="max-w-5xl w-full aspect-video rounded-3xl overflow-hidden border border-zinc-800/85 shadow-2xl relative bg-zinc-950 flex flex-col justify-end animate-scale-in">
            <img
              src={`/api/images/${activeImage.filename}`}
              alt={`Zoomed storyboard frame ${activeImage.index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Dark glassmorphic info bar */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent p-6 pt-16 flex items-end justify-between gap-4 pointer-events-none">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">
                  {activeImage.sceneTitle} &bull; Frame 0{activeImage.index + 1}
                </span>
                <p className="text-[11px] text-zinc-450 font-mono font-medium max-w-xl truncate">
                  Filename: {activeImage.filename}
                </p>
              </div>

              {/* Action Buttons in zoomed view */}
              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  onClick={() => handleDownload(activeImage.filename, activeImage.sceneTitle, activeImage.index)}
                  className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-all font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(activeImage.sceneObj, activeImage.filename)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/15 hover:border-red-900/40 transition-all font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Next Frame Trigger */}
          <button
            onClick={() => navigateModal(1)}
            className="absolute right-6 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 z-55"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
