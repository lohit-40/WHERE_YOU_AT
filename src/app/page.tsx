'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLHeadingElement>(null);
  const title2Ref = useRef<HTMLHeadingElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    // Brutalist sliding intro
    const tl = gsap.timeline();
    
    tl.from(title1Ref.current, { x: -1000, opacity: 0, duration: 0.8, ease: "power4.out" })
      .from(title2Ref.current, { x: 1000, opacity: 0, duration: 0.8, ease: "power4.out" }, "-=0.6")
      .from(blockRef.current, { scaleY: 0, transformOrigin: "top", duration: 0.5, ease: "expo.inOut" }, "-=0.4")
      .from(buttonRef.current, { y: 100, opacity: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.2");

    // Infinite Marquee Sliding
    gsap.to(marqueeRef.current, {
      xPercent: -50,
      ease: "none",
      duration: 10,
      repeat: -1,
    });
  }, { scope: containerRef });

  const handleButtonHover = () => {
    gsap.to(buttonRef.current, {
      x: 10,
      y: -10,
      boxShadow: "-10px 10px 0px 0px #ff0000",
      duration: 0.2,
      ease: "power2.out"
    });
  };

  const handleButtonLeave = () => {
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      boxShadow: "0px 0px 0px 0px #ff0000",
      duration: 0.2,
      ease: "power2.out"
    });
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#ececec] text-black font-mono overflow-x-hidden uppercase selection:bg-red-500 selection:text-white relative">
      
      {/* Sliding Marquee Top */}
      <div className="w-full bg-red-600 border-b-4 border-black overflow-hidden py-3 flex whitespace-nowrap">
        <div ref={marqueeRef} className="text-xl font-black text-white px-4 tracking-tighter">
          NO SIGNAL // NO PROBLEM // OFFLINE TRACKING // PROMPT WARS // NO SIGNAL // NO PROBLEM // OFFLINE TRACKING // PROMPT WARS // NO SIGNAL // NO PROBLEM // OFFLINE TRACKING // PROMPT WARS //
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-60px)]">
        
        {/* Left Brutalist Block */}
        <div className="md:col-span-8 p-8 md:p-16 flex flex-col justify-center border-r-4 border-black relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
          
          <h1 className="text-7xl md:text-9xl font-black leading-[0.85] tracking-tighter mb-4 z-10" style={{ letterSpacing: "-0.05em" }}>
            <div ref={title1Ref} className="text-red-600 block">WHERE</div>
            <div ref={title2Ref} className="text-black block -mt-4">YOU AT.</div>
          </h1>

          <div ref={blockRef} className="bg-black text-white p-8 mt-12 w-fit border-4 border-black shadow-[15px_15px_0px_0px_rgba(255,0,0,1)] z-10">
             <h2 className="text-3xl font-bold mb-4">// THE SOLUTION</h2>
             <p className="text-xl max-w-xl font-bold leading-tight">
               Stadium Wi-Fi crashes. <br/>
               Standard maps fail. <br/><br/>
               We push exact [X,Y] vectors over 50-byte payloads to Firebase. <br/>
               Complete Offline Grid fallback.
             </p>
          </div>
        </div>

        {/* Right Action Block */}
        <div className="md:col-span-4 bg-yellow-400 p-8 flex flex-col justify-between border-t-4 md:border-t-0 border-black items-center md:items-start text-center md:text-left">
          <div className="w-full">
            <h3 className="text-4xl font-black border-b-4 border-black pb-4 mb-8">SYSTEM <br/> SPECS.</h3>
            <ul className="space-y-4 text-xl font-bold cursor-default">
              <li className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors duration-0">01. ZERO-DATA SVG CACHING</li>
              <li className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors duration-0">02. MICRO-PAYLOAD SYNC</li>
              <li className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors duration-0">03. SMS GRID FALLBACK</li>
              <li className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors duration-0">04. AI CROWD ROUTING</li>
            </ul>
          </div>

          <div className="mt-16 w-full">
            <Link 
              href="/map"
              ref={buttonRef}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              className="block w-full bg-black text-white text-3xl font-black py-8 px-4 text-center border-4 border-black transition-none cursor-pointer"
            >
              INITIALIZE APP _
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
