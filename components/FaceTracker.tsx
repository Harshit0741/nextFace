'use client';

import { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

export default function FaceTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
          const width = videoRef.current.videoWidth || 940;
          const height = videoRef.current.videoHeight || 650;
          ctx.drawImage(videoRef.current, 0, 0, width, height);
          ctx.drawImage(canvasRef.current, 0, 0, width, height);
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
      const displaySize = {
        width: videoRef.current.videoWidth || 940,
        height: videoRef.current.videoHeight || 650,
      };
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
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recorder) recorder.stop();
    setIsRecording(false);
  };

  const handleRecordToggle = () => {
    isRecording ? stopRecording() : startRecording();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex flex-col items-center justify-start">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        🎥 Face Tracker
      </h1>

      <div className="relative w-full max-w-[940px] aspect-video border-4 border-blue-300 rounded-lg shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        <canvas
          ref={outputCanvasRef}
          className="hidden"
        />
      </div>

      <div className="mt-6 w-full flex justify-center">
        <button
          onClick={handleRecordToggle}
          className={`px-6 py-2 text-white text-sm sm:text-base rounded-lg shadow transition-all duration-300 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRecording ? 'Stop & Download' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
}
