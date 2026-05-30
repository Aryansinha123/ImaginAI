import os
import subprocess
import shutil

# ---------------------------------------------------------------
# FFmpeg path resolution:
#   1. Try system PATH  (works after shell restart)
#   2. Fall back to known WinGet install location
# ---------------------------------------------------------------
_WINGET_FFMPEG = (
    r"C:\Users\hp\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
)

def _get_ffmpeg():
    # Check system PATH first
    from_path = shutil.which("ffmpeg")
    if from_path:
        return from_path
    # Fall back to known winget location
    if os.path.exists(_WINGET_FFMPEG):
        return _WINGET_FFMPEG
    # Try imageio-ffmpeg bundled binary
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    raise RuntimeError(
        "FFmpeg not found. Install it from https://ffmpeg.org/download.html "
        "and add it to PATH, then restart the backend."
    )


def generate_video_clip(image_path, output_filename=None, duration=10):
    """
    Generate a browser-compatible H.264 MP4 video from a single image using
    a Ken Burns zoom-pan effect via FFmpeg. Output is playable in all modern
    browsers (Chrome, Firefox, Safari, Edge).
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")

    if output_filename is None:
        base = os.path.splitext(os.path.basename(image_path))[0]
        output_filename = f"{base}.mp4"

    output_dir = "generated_images"
    os.makedirs(output_dir, exist_ok=True)
    save_path = os.path.join(output_dir, output_filename)

    # Remove stale file so FFmpeg writes fresh
    if os.path.exists(save_path):
        os.remove(save_path)

    ffmpeg = _get_ffmpeg()

    fps = 24
    width, height = 1280, 720
    total_frames = duration * fps

    # Ken Burns: smooth gentle zoom-in (1.0 → 1.17) over the duration
    zoompan_filter = (
        f"scale=8000:-1,"
        f"zoompan="
        f"z='min(zoom+0.0007,1.17)':"
        f"x='iw/2-(iw/zoom/2)':"
        f"y='ih/2-(ih/zoom/2)':"
        f"d={total_frames}:"
        f"s={width}x{height}:"
        f"fps={fps}"
    )

    cmd = [
        ffmpeg,
        "-y",                        # overwrite without asking
        "-loop", "1",                # treat image as infinite loop
        "-i", image_path,            # input image
        "-vf", zoompan_filter,       # zoom-pan filter
        "-t", str(duration),         # clip duration
        "-c:v", "libx264",           # H.264 — universally browser-playable
        "-preset", "fast",
        "-crf", "23",                # quality (lower = better, 23 is default)
        "-pix_fmt", "yuv420p",       # required for browser compatibility
        "-movflags", "+faststart",   # enables instant streaming/playback
        "-an",                       # no audio track
        save_path,
    ]

    print(f"[video_generator] Running FFmpeg: {' '.join(cmd)}")

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=120,
    )

    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="replace")
        print(f"[video_generator] FFmpeg stderr:\n{err}")
        raise RuntimeError(f"FFmpeg failed with code {result.returncode}:\n{err}")

    print(f"[video_generator] Created: {save_path}")
    return output_filename


def generate_progressive_video_clip(image_paths, output_filename=None, duration=10):
    """
    Generate a 10-second browser-compatible H.264 MP4 video from exactly 3 consecutive
    images representing character actions, using chained FFmpeg xfade transitions
    (crossfades) at the 3s and 6s marks.
    """
    if len(image_paths) != 3:
        raise ValueError("Must provide exactly 3 image paths for progressive clip generation")
        
    for p in image_paths:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Image not found at {p}")

    if output_filename is None:
        base = os.path.splitext(os.path.basename(image_paths[0]))[0]
        output_filename = f"{base}_prog.mp4"

    output_dir = "generated_images"
    os.makedirs(output_dir, exist_ok=True)
    save_path = os.path.join(output_dir, output_filename)

    # Remove stale file so FFmpeg writes fresh
    if os.path.exists(save_path):
        os.remove(save_path)

    ffmpeg = _get_ffmpeg()
    
    # 3 images: scale to cover and center-crop to exactly 1280x720 first to prevent filter crashes
    # and create borderless 16:9 cinematic clips. We display each image for 4 seconds, and apply 1-second crossfades.
    # Total duration = 4s (img1) + 4s (img2) - 1s (xfade) + 4s (img3) - 1s (xfade) = 10s.
    filter_complex = (
        "[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[v0]; "
        "[1:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[v1]; "
        "[2:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720[v2]; "
        "[v0][v1]xfade=transition=fade:duration=1:offset=3[v01]; "
        "[v01][v2]xfade=transition=fade:duration=1:offset=6,format=yuv420p"
    )

    cmd = [
        ffmpeg,
        "-y",
        "-loop", "1", "-t", "4", "-i", image_paths[0],
        "-loop", "1", "-t", "4", "-i", image_paths[1],
        "-loop", "1", "-t", "4", "-i", image_paths[2],
        "-filter_complex", filter_complex,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-an",
        save_path
    ]

    print(f"[video_generator] Running progressive FFmpeg: {' '.join(cmd)}")

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=120,
    )

    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="replace")
        print(f"[video_generator] FFmpeg progressive stderr:\n{err}")
        raise RuntimeError(f"FFmpeg failed with code {result.returncode}:\n{err}")

    print(f"[video_generator] Created progressive video: {save_path}")
    return output_filename
