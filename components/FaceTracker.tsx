'use client'; 

import { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

export default function FaceTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    startVideo();
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ctx = outputCanvasRef.current?.getContext('2d');
      const draw = () => {
        if (ctx && videoRef.current && canvasRef.current) {
          ctx.drawImage(videoRef.current, 0, 0, 940, 650);
          ctx.drawImage(canvasRef.current, 0, 0, 940, 650);
        }
        requestAnimationFrame(draw);
      };
      draw();
    });
  };

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    detectFaces();
  };

  const detectFaces = () => {
    setInterval(async () => {
      if (!videoRef.current) return;
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const canvas = canvasRef.current!;
      const displaySize = { width: 940, height: 650 };
      faceapi.matchDimensions(canvas, displaySize);

      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);
      faceapi.draw.drawFaceExpressions(canvas, resized);
    }, 100);
  };

  const startRecording = () => {
    const stream = outputCanvasRef.current?.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream!);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'face_recording.webm';
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
  };

  const stopRecording = () => {
    if (recorder) recorder.stop();
  };

  return (
    <div>
      <h1>Face Tracker</h1>
      <div style={{ position: 'relative', width: 940, height: 650 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="940"
          height="650"
          style={{ position: 'absolute' }}
        />
        <canvas ref={canvasRef} width="940" height="650" style={{ position: 'absolute' }} />
        <canvas ref={outputCanvasRef} width="940" height="650" style={{ display: 'none' }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording} style={{ marginLeft: 10 }}>
          Stop & Download
        </button>
      </div>
    </div>
  );
}
