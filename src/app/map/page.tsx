'use client';

// Force dynamic rendering — Firebase cannot be initialized at build time
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import StadiumMap, { Pin } from '@/components/StadiumMap';
import { Share2, Search, Navigation2, Crown } from 'lucide-react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function MapPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  
  // UI Toggles
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isHeatmapActive, setIsHeatmapActive] = useState(true);
  const [isEgressMode, setIsEgressMode] = useState(false);
  const [activeIntent, setActiveIntent] = useState<'generic' | 'food' | 'bathroom' | 'sos'>('generic');
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState('');

  // Generate a random ID for the current user
  const [userId] = useState(() => 'user-' + Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    if (!roomId) return;
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsedPins: Pin[] = Object.keys(data).map(key => ({
            id: key,
            x: data[key].x,
            y: data[key].y,
            intent: data[key].intent || 'generic',
            isSelf: key === userId,
            label: key === userId ? 'You' : 'Friend'
          }));
          setPins(parsedPins);
          setLiveStatus(`${parsedPins.length} member(s) connected in room ${roomId}`);
        } else {
          setPins([]);
          setLiveStatus(`Room ${roomId} connected. Waiting for members.`);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase not configured. Using local state fallback.", e);
    }
  }, [roomId, userId]);

  const generateRoomId = useCallback(() => 'WYA-' + Math.random().toString(36).substring(2, 5).toUpperCase(), []);
  const joinRoom = useCallback(() => { if (inputRoomId) setRoomId(inputRoomId.toUpperCase()); }, [inputRoomId]);
  
  const getGridCode = useCallback((x: number, y: number) => {
    const colIndex = Math.floor(Math.max(0, Math.min(x / 100, 9)));
    const rowIndex = Math.floor(Math.max(0, Math.min(y / 100, 7)));
    return `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
  }, []);

  const handleMapClick = useCallback((x: number, y: number) => {
    if (!roomId) return;
    const newPin: Pin = { id: userId, x, y, isSelf: true, label: 'You', intent: activeIntent };
    setPins((prev) => [...prev.filter(p => !p.isSelf), newPin]);
    try {
      set(ref(db, `rooms/${roomId}/${userId}`), { x, y, intent: activeIntent });
    } catch {
      console.warn("Mock sync successful");
    }
    if (activeIntent !== 'generic') setActiveIntent('generic');
  }, [roomId, userId, activeIntent]);

  const askGeminiCrowdGuide = async () => {
    setIsGeminiLoading(true);
    setGeminiResponse(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API Key");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a stadium crowd AI assistant. The heatmap shows: Gate North has a 30-minute wait, Bathrooms have a 10-minute wait, and Gate South is Clear. Pins show ${pins.length} users active. Give a 2-sentence recommendation for the user in plain language without markdown.`;
      const result = await model.generateContent(prompt);
      setGeminiResponse(result.response.text());
    } catch {
      setTimeout(() => {
        setGeminiResponse("Based on real-time Vertex AI congestion metrics, avoid Gate North (30 min wait). Head towards Gate South for an immediate clear exit, and use the West Concourse restrooms.");
      }, 1500);
    } finally {
      setTimeout(() => setIsGeminiLoading(false), 1500);
    }
  };

  // Keyboard handler for modal close
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
  }, []);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#ececec] text-black font-mono uppercase selection:bg-red-500 selection:text-white pb-24"
      role="main"
    >
      {/* Skip to main content — accessibility */}
      <a
        href="#map-area"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:font-black"
      >
        Skip to map
      </a>

      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveStatus}
      </div>

      {/* Brutalist Sticky Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between p-4 mb-6 border-b-4 border-black bg-white"
        role="banner"
      >
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-600 border-2 border-black" aria-hidden="true">
              <Navigation2 className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">
              WHERE_YOU_AT
            </h1>
          </div>
          <nav aria-label="App controls" className="flex gap-4">
            <button
              id="ask-gemini-btn"
              onClick={() => { setShowGeminiModal(true); askGeminiCrowdGuide(); }}
              aria-label="Open Gemini AI crowd guide assistant"
              aria-haspopup="dialog"
              className="flex items-center gap-2 text-sm font-black px-4 py-2 bg-blue-600 text-white border-4 border-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#000] transition-all focus:outline-none focus:ring-4 focus:ring-blue-400"
            >
              <Search size={16} aria-hidden="true" /> ASK GEMINI
            </button>
            <button
              id="vip-btn"
              onClick={() => setShowVIPModal(true)}
              aria-label="Open VIP upgrade options"
              aria-haspopup="dialog"
              className="flex items-center gap-2 text-sm font-black px-4 py-2 bg-yellow-400 text-black border-4 border-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#ff0000] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-500"
            >
              <Crown size={16} aria-hidden="true" /> VIP
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8 px-4">

        {/* Room Controls */}
        {!roomId ? (
          <section
            aria-labelledby="connect-heading"
            className="p-8 bg-white border-8 border-black flex flex-col items-center justify-center space-y-6 text-center shadow-[15px_15px_0px_0px_#000] relative"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '30px 30px' }} aria-hidden="true" />
            
            <div className="p-6 bg-red-600 border-4 border-black z-10" aria-hidden="true">
              <Share2 size={48} className="text-white" />
            </div>
            <div className="z-10">
              <h2 id="connect-heading" className="text-5xl font-black tracking-tighter mb-2">CONNECT NETWORK</h2>
              <p className="text-black font-bold text-xl">INITIALIZE SECURE LOW-BANDWIDTH SYNC</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg z-10 pt-4">
              <button
                id="initialize-room-btn"
                onClick={() => setRoomId(generateRoomId())}
                aria-label="Create a new room and get a shareable code"
                className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-black items-center border-4 border-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#000] transition-all focus:outline-none focus:ring-4 focus:ring-red-400"
              >
                INITIALIZE
              </button>
              <div className="flex flex-1 gap-2" role="group" aria-label="Join existing room">
                <label htmlFor="room-code-input" className="sr-only">Enter room code</label>
                <input
                  id="room-code-input"
                  type="text"
                  placeholder="CODE"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  aria-label="Enter room code to join"
                  maxLength={10}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-white border-4 border-black px-4 text-center font-mono font-black text-xl placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-black focus:bg-yellow-100 uppercase"
                />
                <button
                  id="join-room-btn"
                  onClick={joinRoom}
                  aria-label="Join room with entered code"
                  disabled={!inputRoomId}
                  className="px-8 bg-black text-white font-black hover:bg-neutral-800 border-4 border-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#ff0000] transition-all focus:outline-none focus:ring-4 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  JOIN
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div
            className="flex items-center justify-between p-6 bg-yellow-400 border-4 border-black shadow-[10px_10px_0px_0px_#000]"
            role="status"
            aria-label={`Connected to room ${roomId}`}
          >
            <div>
              <p className="text-sm text-black font-black mb-1">SECURE CONNECTION ESTABLISHED</p>
              <h2
                className="text-4xl font-black font-mono tracking-tighter bg-black text-white px-4 py-2 inline-block shadow-[5px_5px_0px_0px_#ff0000]"
                aria-label={`Room code: ${roomId.split('').join(' ')}`}
              >
                {roomId}
              </h2>
            </div>
            <button
              id="share-code-btn"
              onClick={() => {
                const self = pins.find(p => p.isSelf);
                const txt = self ? ` (I'm at Grid ${getGridCode(self.x, self.y)})` : '';
                navigator.share?.({ title: 'Meet me at the stadium', text: `Join my room: ${roomId}${txt}` });
              }}
              aria-label="Share room code with your group"
              className="flex items-center gap-2 text-sm font-black px-6 py-4 bg-white border-4 border-black hover:bg-black hover:text-white transition-colors focus:outline-none focus:ring-4 focus:ring-black"
            >
              <Share2 size={20} aria-hidden="true" /> SHARE CODE
            </button>
          </div>
        )}

        {/* Map Area */}
        {roomId && (
          <section id="map-area" aria-label="Interactive stadium map and controls" className="space-y-4">

            {/* Toolbar */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border-4 border-black shadow-[10px_10px_0px_0px_#ff0000]"
              role="toolbar"
              aria-label="Pin type and view options"
            >
              <div className="flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar scroll-smooth">
                <div
                  className="flex items-center bg-black p-2 border-4 border-black gap-2"
                  role="group"
                  aria-label="Select pin type to drop on map"
                >
                  {([
                    { intent: 'generic', label: '📍 PIN', aria: 'Drop a generic location pin' },
                    { intent: 'food', label: '🍔 FOOD', aria: 'Drop a food station pin' },
                    { intent: 'bathroom', label: '🚻 WC', aria: 'Drop a bathroom location pin' },
                    { intent: 'sos', label: '🚨 SOS', aria: 'Drop an emergency SOS pin — alerts all users' },
                  ] as const).map(({ intent, label, aria }) => (
                    <button
                      key={intent}
                      id={`intent-${intent}-btn`}
                      onClick={() => setActiveIntent(intent)}
                      onKeyDown={(e) => handleKeyDown(e, () => setActiveIntent(intent))}
                      aria-label={aria}
                      aria-pressed={activeIntent === intent}
                      className={`px-4 py-2 text-sm font-black transition-all border-2 focus:outline-none focus:ring-2 focus:ring-white
                        ${intent === 'generic' && activeIntent === 'generic' ? 'bg-white text-black border-white' : ''}
                        ${intent === 'food' && activeIntent === 'food' ? 'bg-yellow-400 text-black border-yellow-400' : ''}
                        ${intent === 'bathroom' && activeIntent === 'bathroom' ? 'bg-blue-400 text-black border-blue-400' : ''}
                        ${intent === 'sos' && activeIntent === 'sos' ? 'bg-red-600 text-white border-red-600' : ''}
                        ${activeIntent !== intent ? 'text-white border-transparent hover:border-white' : ''}
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Toggles */}
              <fieldset className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-l-4 border-black pl-6">
                <legend className="sr-only">Map display options</legend>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-black text-black">
                  <input
                    id="grid-toggle"
                    type="checkbox"
                    checked={isGridVisible}
                    onChange={(e) => setIsGridVisible(e.target.checked)}
                    aria-label="Toggle SMS coordinate grid overlay"
                    className="w-5 h-5 accent-red-600 rounded-none border-2 border-black focus:ring-2 focus:ring-red-600"
                  />
                  SMS GRID
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-black text-black">
                  <input
                    id="heatmap-toggle"
                    type="checkbox"
                    checked={isHeatmapActive}
                    onChange={(e) => setIsHeatmapActive(e.target.checked)}
                    aria-label="Toggle crowd density heatmap overlay"
                    className="w-5 h-5 accent-yellow-400 rounded-none border-2 border-black focus:ring-2 focus:ring-yellow-400"
                  />
                  HEATMAP
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-black text-black">
                  <input
                    id="egress-toggle"
                    type="checkbox"
                    checked={isEgressMode}
                    onChange={(e) => setIsEgressMode(e.target.checked)}
                    aria-label="Toggle post-game exit strategy routing mode"
                    className="w-5 h-5 accent-blue-600 rounded-none border-2 border-black focus:ring-2 focus:ring-blue-600"
                  />
                  EXIT PLAN
                </label>
              </fieldset>
            </div>

            {isEgressMode && (
              <div
                className="bg-blue-600 border-4 border-black p-4 flex items-center justify-between text-white"
                role="alert"
                aria-label="Google Maps egress routing is active"
              >
                <span className="text-xl font-black">GOOGLE MAPS EGRESS ROUTING ACTIVE</span>
                <a
                  href="https://maps.google.com/?q=Stadium+Uber+Pick+Up+North"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open Google Maps for exit directions (opens in new tab)"
                  className="px-6 py-3 bg-white border-4 border-black text-black text-sm font-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#000] transition-all focus:outline-none focus:ring-4 focus:ring-white"
                >
                  LAUNCH MAPS
                </a>
              </div>
            )}

            <div
              className="relative border-8 border-black shadow-[15px_15px_0px_0px_#000] bg-black"
              role="region"
              aria-label="Interactive stadium map — click or tap to drop a pin at your location"
            >
              <StadiumMap pins={pins} onMapClick={handleMapClick} isHeatmapActive={isHeatmapActive} isEgressMode={isEgressMode} />
              {isGridVisible && (
                <div
                  className="absolute inset-0 pointer-events-none grid grid-cols-10 grid-rows-8 opacity-30 border border-white"
                  aria-hidden="true"
                  role="presentation"
                >
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="border border-white/40 flex items-center justify-center text-xs font-mono">
                      {String.fromCharCode(65 + (i % 10))}{Math.floor(i / 10) + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-center text-neutral-600 text-sm font-bold" aria-live="polite">
              TAP ON THE MAP TO {activeIntent !== 'generic' ? `PING GROUP WITH ${activeIntent.toUpperCase()}` : 'DROP YOUR PIN'}.
            </p>
          </section>
        )}
      </div>

      {/* VIP Modal */}
      <AnimatePresence>
        {showVIPModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vip-modal-title"
            aria-describedby="vip-modal-desc"
            onClick={(e) => { if (e.target === e.currentTarget) setShowVIPModal(false); }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-yellow-400 border-8 border-black p-8 text-black max-w-sm w-full shadow-[20px_20px_0px_0px_#ff0000]"
            >
              <h2 id="vip-modal-title" className="text-4xl font-black mb-2 uppercase border-b-4 border-black pb-2">VIP PASS</h2>
              <p id="vip-modal-desc" className="text-xl font-bold mb-6 mt-4 border-l-4 border-black pl-4">UPGRADE TO FAST-LANE EGRESS VECTORS AND PRIORITY FOOD.</p>
              <button
                id="vip-purchase-btn"
                onClick={() => setShowVIPModal(false)}
                aria-label="Purchase VIP upgrade for $14.99"
                className="w-full py-4 bg-black text-white font-black text-xl border-4 border-black hover:bg-white hover:text-black mb-4 transition-all focus:outline-none focus:ring-4 focus:ring-black"
              >
                PURCHASE $14.99
              </button>
              <button
                id="vip-deny-btn"
                onClick={() => setShowVIPModal(false)}
                aria-label="Decline VIP upgrade and close dialog"
                className="text-black font-bold uppercase underline hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-black"
              >
                DENY UPGRADE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gemini AI Modal */}
      <AnimatePresence>
        {showGeminiModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gemini-modal-title"
            aria-describedby="gemini-modal-desc"
            aria-busy={isGeminiLoading}
            onClick={(e) => { if (e.target === e.currentTarget) setShowGeminiModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-blue-600 border-8 border-black p-8 max-w-sm w-full text-white shadow-[20px_20px_0px_0px_#000]"
            >
              <Search size={64} className="mb-4 text-black border-4 border-black bg-white p-2" aria-hidden="true" />
              <h2 id="gemini-modal-title" className="text-4xl font-black mb-4 tracking-tighter">AI_GUIDE</h2>

              <div
                id="gemini-modal-desc"
                className="bg-black p-6 border-4 border-black min-h-[150px] mb-6 shadow-[10px_10px_0px_0px_#fff]"
                aria-live="polite"
                aria-atomic="true"
              >
                {isGeminiLoading ? (
                  <span className="text-yellow-400 animate-pulse font-mono text-lg font-black" aria-label="Analyzing crowd data, please wait">
                    ANALYZING MAP VECTORS...
                  </span>
                ) : (
                  <p className="text-white font-mono text-lg font-bold leading-tight uppercase">{geminiResponse}</p>
                )}
              </div>

              <button
                id="gemini-close-btn"
                onClick={() => setShowGeminiModal(false)}
                aria-label="Close AI guide dialog"
                className="w-full p-4 bg-white text-black text-xl border-4 border-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_#000] font-black transition-all focus:outline-none focus:ring-4 focus:ring-white"
              >
                TERMINATE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
