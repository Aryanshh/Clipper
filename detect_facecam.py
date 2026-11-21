#!/usr/bin/env python3
"""
AI Streamer Facecam Detector for GTA 6 Clipping Studio
Detects the persistent face/facecam of the streamer in 16:9 gameplay streams
and calculates the exact crop coordinates for 65/35 vertical reaction split.
"""

import sys
import json
import os
import cv2
import numpy as np

def detect_streamer_face(video_path, num_samples=5):
    if not os.path.exists(video_path):
        return {
            "success": False,
            "error": f"File not found: {video_path}"
        }

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "success": False,
            "error": f"Cannot open video: {video_path}"
        }

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps > 0 else 0

    if total_frames <= 0 or width <= 0 or height <= 0:
        cap.release()
        return {
            "success": False,
            "error": "Invalid video stream dimensions or duration."
        }

    # Load Haar cascades (frontal + profile for high recall)
    frontal_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')

    # Spread sample timestamps across 15% to 85% of the video duration
    sample_ratios = np.linspace(0.15, 0.85, num_samples)
    detected_faces = []

    scale_factor = 0.5  # Downscale 2x for fast multi-scale processing

    for r in sample_ratios:
        target_frame = int(total_frames * r)
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        # Downscale for high-speed CPU detection
        small = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        min_face_dim = int(height * scale_factor * 0.05)
        max_face_dim = int(height * scale_factor * 0.60)

        # Detect frontal faces
        faces = frontal_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(min_face_dim, min_face_dim),
            maxSize=(max_face_dim, max_face_dim)
        )

        # If none found, try profile face
        if len(faces) == 0:
            faces = profile_cascade.detectMultiScale(
                gray,
                scaleFactor=1.15,
                minNeighbors=4,
                minSize=(min_face_dim, min_face_dim),
                maxSize=(max_face_dim, max_face_dim)
            )

        # Re-scale coordinates back to original video dimensions
        inv_scale = 1.0 / scale_factor
        for (sx, sy, sw, sh) in faces:
            orig_x = int(sx * inv_scale)
            orig_y = int(sy * inv_scale)
            orig_w = int(sw * inv_scale)
            orig_h = int(sh * inv_scale)

            detected_faces.append({
                'x': orig_x,
                'y': orig_y,
                'w': orig_w,
                'h': orig_h,
                'cx': int(orig_x + orig_w / 2),
                'cy': int(orig_y + orig_h / 2),
                'frame': target_frame
            })

    cap.release()

    if not detected_faces:
        # Fallback to default bottom-right if no face detected in sampled frames
        return {
            "success": True,
            "detected": False,
            "fallback": True,
            "facecamPosition": "bottom_right",
            "confidence": 0.0,
            "camCrop": "crop=iw*0.34:ih*0.42:iw*0.66:ih*0.58",
            "details": "No persistent face detected; using standard bottom-right reaction framing."
        }

    # Group detected faces by spatial cluster to isolate streamer's persistent webcam
    clusters = []
    threshold_dist = max(width, height) * 0.18

    for face in detected_faces:
        matched = False
        for c in clusters:
            dist = np.hypot(face['cx'] - c['mean_cx'], face['cy'] - c['mean_cy'])
            if dist < threshold_dist:
                c['faces'].append(face)
                c['mean_cx'] = int(np.mean([f['cx'] for f in c['faces']]))
                c['mean_cy'] = int(np.mean([f['cy'] for f in c['faces']]))
                matched = True
                break
        if not matched:
            clusters.append({
                'mean_cx': face['cx'],
                'mean_cy': face['cy'],
                'faces': [face]
            })

    # Sort clusters by consistency
    clusters.sort(key=lambda c: len(c['faces']), reverse=True)
    best_cluster = clusters[0]
    cluster_faces = best_cluster['faces']
    confidence = round(len(cluster_faces) / len(sample_ratios), 2)

    avg_x = int(np.mean([f['x'] for f in cluster_faces]))
    avg_y = int(np.mean([f['y'] for f in cluster_faces]))
    avg_w = int(np.mean([f['w'] for f in cluster_faces]))
    avg_h = int(np.mean([f['h'] for f in cluster_faces]))
    avg_cx = int(np.mean([f['cx'] for f in cluster_faces]))
    avg_cy = int(np.mean([f['cy'] for f in cluster_faces]))

    # Determine intuitive position tag
    is_left = avg_cx < (width * 0.40)
    is_right = avg_cx > (width * 0.60)
    is_top = avg_cy < (height * 0.40)
    is_bottom = avg_cy > (height * 0.60)

    if is_bottom and is_left:
        pos_tag = "bottom_left"
    elif is_bottom and is_right:
        pos_tag = "bottom_right"
    elif is_top and is_left:
        pos_tag = "top_left"
    elif is_top and is_right:
        pos_tag = "top_right"
    elif is_left:
        pos_tag = "middle_left"
    elif is_right:
        pos_tag = "middle_right"
    else:
        pos_tag = "center"

    # Compute optimal crop box around face for 65/35 vertical split:
    # Top 65% = 1248px, Bottom 35% = 672px on 1080x1920 (Aspect Ratio: 1080 / 672 ≈ 1.607)
    crop_w = int(max(avg_w * 2.8, width * 0.32))
    crop_h = int(crop_w * (672.0 / 1080.0))

    if crop_h > height * 0.65:
        crop_h = int(height * 0.60)
        crop_w = int(crop_h * (1080.0 / 672.0))

    # Center crop around face centroid with 40% headroom / 60% torso room
    crop_x = int(avg_cx - crop_w / 2)
    crop_y = int(avg_cy - crop_h * 0.40)

    # Clamp bounds to video dimensions
    crop_x = max(0, min(crop_x, width - crop_w))
    crop_y = max(0, min(crop_y, height - crop_h))
    crop_w = min(crop_w, width - crop_x)
    crop_h = min(crop_h, height - crop_y)

    cam_crop = f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y}"

    return {
        "success": True,
        "detected": True,
        "confidence": min(1.0, confidence),
        "facecamPosition": pos_tag,
        "faceBox": {
            "x": avg_x,
            "y": avg_y,
            "width": avg_w,
            "height": avg_h,
            "centerX": avg_cx,
            "centerY": avg_cy
        },
        "cropBox": {
            "x": crop_x,
            "y": crop_y,
            "width": crop_w,
            "height": crop_h
        },
        "camCrop": cam_crop,
        "videoDimensions": {
            "width": width,
            "height": height
        },
        "layoutRatio": "65_35",
        "splitHeights": {
            "topGameplay": 1248,
            "bottomReaction": 672,
            "totalHeight": 1920
        }
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python detect_facecam.py <video_path>"}))
        sys.exit(1)

    video_input = sys.argv[1]
    result = detect_streamer_face(video_input)
    print(json.dumps(result, indent=2))
