import React from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageViewerProps {
  src: string;
  alt?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = "Image" }) => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit={true}
        wheel={{ step: 0.2 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <React.Fragment>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <button onClick={() => zoomOut()} className="text-white hover:text-indigo-400 font-bold px-2">-</button>
              <button onClick={() => resetTransform()} className="text-white text-xs hover:text-indigo-400 px-2">Reset</button>
              <button onClick={() => zoomIn()} className="text-white hover:text-indigo-400 font-bold px-2">+</button>
            </div>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <img 
                src={src} 
                alt={alt} 
                className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl" 
              />
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};