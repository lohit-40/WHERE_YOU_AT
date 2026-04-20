'use client';

import React, { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export interface Pin {
  id: string;
  x: number;
  y: number;
  label?: string;
  isSelf?: boolean;
  intent?: 'generic' | 'food' | 'bathroom' | 'sos';
}

interface StadiumMapProps {
  pins: Pin[];
  onMapClick?: (x: number, y: number) => void;
  isHeatmapActive?: boolean;
  isEgressMode?: boolean;
}

export default function StadiumMap({ pins, onMapClick, isHeatmapActive = false, isEgressMode = false }: StadiumMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick || !svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;
    
    onMapClick(x, y);
  };

  const getPinVisuals = (intent?: string, isSelf?: boolean) => {
    if (intent === 'sos') return { color: "#ff0000", emoji: "🚨", ping: true };
    if (intent === 'food') return { color: "#eab308", emoji: "🍔", ping: false };
    if (intent === 'bathroom') return { color: "#3b82f6", emoji: "🚻", ping: false };
    return { color: isSelf ? "#ef4444" : "#8b5cf6", emoji: "", ping: isSelf };
  };

  const sosPin = pins.find(p => p.intent === 'sos');
  const hasSOS = !!sosPin;

  return (
    <div className={`w-full h-[60vh] rounded-3xl overflow-hidden border shadow-2xl relative transition-colors duration-1000 ${hasSOS ? 'bg-red-950/80 border-red-600' : 'bg-neutral-900 border-neutral-800'}`}>
      
      {hasSOS && (
        <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse border border-red-400">
          ⚠️ CLEAR THE PATH: MEDICAL ROUTING ACTIVE
        </div>
      )}

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <React.Fragment>
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button aria-label="Zoom In" onClick={() => zoomIn()} className="p-2 bg-neutral-800/80 backdrop-blur rounded-xl text-white hover:bg-neutral-700 transition">+</button>
              <button aria-label="Zoom Out" onClick={() => zoomOut()} className="p-2 bg-neutral-800/80 backdrop-blur rounded-xl text-white hover:bg-neutral-700 transition">-</button>
              <button aria-label="Reset Map" onClick={() => resetTransform()} className="p-2 bg-neutral-800/80 backdrop-blur rounded-xl text-white hover:bg-neutral-700 transition text-xs">Reset</button>
            </div>
            
            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
              <svg 
                ref={svgRef}
                viewBox="0 0 1000 800" 
                className="w-full max-w-[1000px] cursor-crosshair touch-none overflow-visible"
                onClick={handleSvgClick}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="severeGlow" x="-50%" y="-50%" width="200%" height="200%">
                     <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur"/>
                     <feComponentTransfer in="blur" result="glow">
                       <feFuncA type="linear" slope="3"/>
                     </feComponentTransfer>
                     <feMerge>
                       <feMergeNode in="glow"/>
                       <feMergeNode in="SourceGraphic"/>
                     </feMerge>
                  </filter>
                </defs>

                {/* Egress Color Zones Overlay */}
                {isEgressMode && (
                  <g opacity="0.15" style={{ pointerEvents: 'none' }}>
                    <path d="M 50 50 Q 500 -100 950 50 L 950 400 L 50 400 Z" fill="#3b82f6" /> {/* Blue Zone North */}
                    <path d="M 50 750 Q 500 900 950 750 L 950 400 L 50 400 Z" fill="#22c55e" /> {/* Green Zone South */}
                    <path d="M 50 50 Q -100 400 50 750 L 500 750 L 500 50 Z" fill="#a855f7" /> {/* Purple Zone West */}
                    <path d="M 950 50 Q 1100 400 950 750 L 500 750 L 500 50 Z" fill="#f97316" /> {/* Orange Zone East */}
                  </g>
                )}

                {/* Stadium Outer Ring */}
                <rect x="50" y="50" width="900" height="700" rx="300" fill="#1c1c1c" stroke="#333" strokeWidth="8"/>
                {/* Seating Tiers */}
                <rect x="100" y="100" width="800" height="600" rx="250" fill="#262626" stroke="#404040" strokeWidth="4"/>
                <rect x="150" y="150" width="700" height="500" rx="200" fill="#333333" stroke="#4d4d4d" strokeWidth="4"/>
                {/* Playing Field */}
                <rect x="250" y="250" width="500" height="300" rx="100" fill="#143621" stroke="#ffffff" strokeWidth="4" opacity={hasSOS ? 0.3 : 0.8}/>
                
                {/* Field Markings */}
                <line x1="500" y1="250" x2="500" y2="550" stroke="#ffffff" strokeWidth="2" opacity="0.5"/>
                <circle cx="500" cy="400" r="50" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5"/>
                
                {/* Gate Labels */}
                <text x="500" y="35" fill="#888" fontSize="24" textAnchor="middle" fontWeight="bold">GATE NORTH</text>
                <text x="500" y="785" fill="#888" fontSize="24" textAnchor="middle" fontWeight="bold">GATE SOUTH</text>
                <text x="25" y="400" fill="#888" fontSize="24" textAnchor="middle" transform="rotate(-90 25 400)" fontWeight="bold">GATE WEST</text>
                <text x="975" y="400" fill="#888" fontSize="24" textAnchor="middle" transform="rotate(90 975 400)" fontWeight="bold">GATE EAST</text>
                
                {/* Concessions / Restrooms indicators */}
                <circle cx="150" cy="150" r="20" fill="#4a5568" />
                <text x="150" y="155" fill="#fff" fontSize="12" textAnchor="middle">🍔</text>
                
                <circle cx="850" cy="150" r="20" fill="#4a5568" />
                <text x="850" y="155" fill="#fff" fontSize="12" textAnchor="middle">🚻</text>

                <circle cx="150" cy="650" r="20" fill="#4a5568" />
                <text x="150" y="655" fill="#fff" fontSize="12" textAnchor="middle">🚻</text>

                <circle cx="850" cy="650" r="20" fill="#4a5568" />
                <text x="850" y="655" fill="#fff" fontSize="12" textAnchor="middle">🍺</text>

                {/* Medical Station (Target for SOS) */}
                <circle id="medical-tent" cx="50" cy="50" r="25" fill="#fff" stroke="#ef4444" strokeWidth="4" />
                <text x="50" y="55" fill="#ef4444" fontSize="20" textAnchor="middle" fontWeight="bold">+</text>

                {/* Heatmap Overlay */}
                {isHeatmapActive && (
                  <g className="transition-opacity duration-700 ease-in-out opacity-80" style={{ pointerEvents: 'none' }}>
                    <circle cx="500" cy="80" r="40" fill="#ef4444" filter="url(#severeGlow)" opacity="0.8" className="animate-pulse" />
                    <text x="500" y="85" fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle">30m Wait</text>
                    
                    <circle cx="150" cy="650" r="40" fill="#eab308" filter="url(#glow)" opacity="0.7" />
                    <text x="150" y="690" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">10m Wait</text>

                    <circle cx="500" cy="730" r="50" fill="#22c55e" filter="url(#glow)" opacity="0.6" />
                    <text x="500" y="735" fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle">Clear</text>
                  </g>
                )}

                {/* Egress Rideshare Markers */}
                {isEgressMode && (
                  <g style={{ pointerEvents: 'none' }}>
                     <rect x="420" y="-30" width="160" height="30" rx="4" fill="#3b82f6" />
                     <text x="500" y="-10" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">UBER/LYFT ZONE BLUE</text>

                     <rect x="420" y="800" width="160" height="30" rx="4" fill="#22c55e" />
                     <text x="500" y="820" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">UBER/LYFT ZONE GREEN</text>
                  </g>
                )}

                {/* SOS Dynamic Routing Line */}
                {sosPin && (
                  <g style={{ pointerEvents: 'none' }}>
                    <path 
                      d={`M ${sosPin.x} ${sosPin.y} Q ${sosPin.x} 50, 50 50`} 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="6" 
                      strokeDasharray="15, 10" 
                      className="animate-[dash_1s_linear_infinite]"
                      style={{ strokeDashoffset: 100 }}
                    />
                    <style>{`
                      @keyframes dash {
                        to { stroke-dashoffset: 0; }
                      }
                    `}</style>
                  </g>
                )}

                {/* Pins Overlay */}
                {pins.map(pin => {
                  const visuals = getPinVisuals(pin.intent, pin.isSelf);
                  return (
                    <g key={pin.id} transform={`translate(${pin.x}, ${pin.y})`} className="transition-transform duration-300">
                      {visuals.ping && (
                        <circle r="16" fill={visuals.color} className="animate-ping" opacity="0.4"/>
                      )}
                      
                      <circle r="12" fill={visuals.color} stroke="#fff" strokeWidth="2.5" className="shadow-lg"/>
                      
                      {visuals.emoji && (
                        <text y="4" fill="#fff" fontSize="14" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                          {visuals.emoji}
                        </text>
                      )}
                      
                      {pin.label && !visuals.emoji && (
                        <text y="4" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                           P
                        </text>
                      )}
                      
                      {pin.label && (
                        <rect x="-30" y="-35" width="60" height="20" rx="10" fill="#000" opacity="0.8" />
                      )}
                      {pin.label && (
                        <text y="-21" fill="#fff" fontSize="12" textAnchor="middle" className="font-medium" style={{ pointerEvents: 'none' }}>
                          {pin.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
}
