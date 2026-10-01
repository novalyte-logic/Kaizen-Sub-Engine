import React, { useState, useEffect } from 'react';
import { Home, Sliders, Layers, PlayCircle, Settings, Smartphone, Maximize2, Radio } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { Project } from '../../types';
import { audioEngine } from '../../services/audioEngine';

interface MobileShellProps {
  currentTab: 'home' | 'build' | 'library' | 'player' | 'settings';
  onTabChange: (tab: 'home' | 'build' | 'library' | 'player' | 'settings') => void;
  activeProject: Project;
  children: React.ReactNode;
  isPlaying: boolean;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  currentTab,
  onTabChange,
  activeProject,
  children,
  isPlaying,
}) => {
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);
  const [isNativeMobile, setIsNativeMobile] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('9:41');
  const [dynamicIslandExpanded, setDynamicIslandExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Check if running on real mobile device
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth <= 480;
      const isMobileUA = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
      setIsNativeMobile(isMobileWidth || isMobileUA);
      if (isMobileWidth) {
        setDeviceFrameMode(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Live clock for iOS status bar
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      const formatted = `${h % 12 || 12}:${m < 10 ? '0' : ''}${m}`;
      setCurrentTimeStr(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, []);

  const handleTabClick = (tab: typeof currentTab) => {
    audioEngine.triggerHaptic('light');
    audioEngine.unlockIOSAudio();
    onTabChange(tab);
  };

  return (
    <div className="min-h-screen bg-[#040608] text-zinc-100 flex flex-col items-center justify-center selection:bg-emerald-500 selection:text-black font-sans antialiased overflow-x-hidden p-0 sm:py-6">
      {/* Device Viewport Toggle (Desktop Only) */}
      {!isNativeMobile && (
        <div className="hidden sm:flex items-center gap-2 mb-3 bg-[#0d141a] px-3 py-1.5 rounded-full border border-emerald-500/30 text-xs font-mono">
          <span className="text-zinc-400">Viewport:</span>
          <button
            onClick={() => setDeviceFrameMode(true)}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition ${
              deviceFrameMode
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone size={13} />
            <span>iPhone 16 Pro (393×852)</span>
          </button>
          <button
            onClick={() => setDeviceFrameMode(false)}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition ${
              !deviceFrameMode
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Maximize2 size={13} />
            <span>Fluid View</span>
          </button>
        </div>
      )}

      {/* iPhone Outer Hardware Chassis or Native Container */}
      <div
        className={`w-full transition-all duration-300 relative ${
          deviceFrameMode && !isNativeMobile
            ? 'max-w-[400px] h-[852px] rounded-[52px] border-[10px] border-[#222933] ring-1 ring-emerald-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.15)] bg-[#080c10] overflow-hidden flex flex-col'
            : 'max-w-md min-h-screen bg-[#080c10] flex flex-col'
        }`}
      >
        {/* iOS Dynamic Island & Status Bar */}
        <div className="sticky top-0 z-50 bg-[#080c10]/95 backdrop-blur-xl pt-2 px-6 pb-2 select-none border-b border-white/5">
          {/* Status Bar: Time, Dynamic Island, Cellular/Wifi/Battery */}
          <div className="flex items-center justify-between text-xs font-semibold text-white tracking-tight relative">
            {/* Clock */}
            <span className="font-mono text-[13px] tracking-tight">{currentTimeStr}</span>

            {/* Dynamic Island Pill */}
            <div
              onClick={() => {
                if (isPlaying) {
                  setDynamicIslandExpanded(!dynamicIslandExpanded);
                  onTabChange('player');
                }
              }}
              className={`absolute left-1/2 -translate-x-1/2 -top-1 bg-black rounded-full flex items-center justify-between px-3 cursor-pointer transition-all duration-300 border border-white/10 ${
                isPlaying
                  ? 'w-48 h-8 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'w-24 h-6'
              }`}
            >
              {/* Left Lens / Radar */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#18232c] border border-zinc-700 block" />
                {isPlaying && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-tight truncate max-w-[80px]">
                    {activeProject.name}
                  </span>
                )}
              </div>

              {/* Right Mic / Live Audio Wave Pill */}
              <div className="flex items-center gap-1">
                {isPlaying ? (
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0a1118] border border-zinc-800 block" />
                )}
              </div>
            </div>

            {/* Cellular / WiFi / Battery */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              {/* Cellular 4 bars */}
              <div className="flex items-end gap-[1.5px] h-3">
                <span className="w-0.5 h-1 bg-white rounded-xs" />
                <span className="w-0.5 h-1.5 bg-white rounded-xs" />
                <span className="w-0.5 h-2.5 bg-white rounded-xs" />
                <span className="w-0.5 h-3 bg-white rounded-xs" />
              </div>
              {/* 5G label */}
              <span className="text-[10px] font-mono font-bold">5G</span>
              {/* Battery pill */}
              <div className="relative w-5 h-2.5 rounded-[4px] border border-white/60 p-[1px] flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-[2px]" />
                <div className="absolute -right-1 top-0.5 w-[2px] h-1.5 bg-white/60 rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* App Top Branding Bar */}
          <div className="flex items-center justify-between mt-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0e161f] border border-emerald-500/40 flex items-center justify-center">
                <Radio size={14} className="text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-white font-mono">
                    KAIZEN
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    DSP
                  </span>
                </div>
              </div>
            </div>

            <PWAInstallButton />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-3 pb-32 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>

        {/* iOS-Style Persistent Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-40 bg-[#080c10]/95 backdrop-blur-xl border-t border-white/10 pt-2 pb-1">
          <div className="px-3 flex items-center justify-around">
            {/* HOME */}
            <button
              onClick={() => handleTabClick('home')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition active:scale-95 ${
                currentTab === 'home' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Home size={19} />
              <span className="text-[10px] font-mono mt-1 font-medium">HOME</span>
            </button>

            {/* LIBRARY */}
            <button
              onClick={() => handleTabClick('library')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition active:scale-95 ${
                currentTab === 'library' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers size={19} />
              <span className="text-[10px] font-mono mt-1 font-medium">LIBRARY</span>
            </button>

            {/* BUILD - Central Primary Action */}
            <button
              onClick={() => handleTabClick('build')}
              className="relative -top-3 flex flex-col items-center justify-center transition active:scale-95"
              title="Open Audio Builder Engine"
            >
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl transition ${
                  currentTab === 'build'
                    ? 'bg-emerald-400 text-black shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                    : 'bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-400'
                }`}
              >
                <Sliders size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-mono mt-0.5 font-bold tracking-wider text-emerald-400">
                BUILD
              </span>
            </button>

            {/* PLAYER */}
            <button
              onClick={() => handleTabClick('player')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition active:scale-95 ${
                currentTab === 'player' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <PlayCircle size={19} />
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-mono mt-1 font-medium">PLAYER</span>
            </button>

            {/* SETTINGS */}
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex flex-col items-center justify-center py-1 px-3 transition active:scale-95 ${
                currentTab === 'settings' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings size={19} />
              <span className="text-[10px] font-mono mt-1 font-medium">SETTINGS</span>
            </button>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-1" />
        </nav>
      </div>
    </div>
  );
};
