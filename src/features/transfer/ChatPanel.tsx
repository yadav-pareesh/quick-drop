import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  X,
  Clock,
  Copy,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { webrtcService } from '../../services/webrtc';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRead: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Render message text with clickable URLs
function renderFormattedText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium hover:opacity-90 inline-flex items-center gap-1 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 shrink-0 inline opacity-70" />
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, onRead }) => {
  const { messages, addMessage, clearMessages } = useChatStore();
  const { localDevice, remoteDevice } = useConnectionStore();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalMode, setIsModalMode] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevIsOpenRef = useRef(false);
  const onReadRef = useRef(onRead);

  // Keep onReadRef in sync without triggering effects
  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  // Scroll to bottom of message list container only
  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    setShowScrollBottom(false);
    setUnreadWhileScrolled(0);
    isNearBottomRef.current = true;
  }, []);

  // Check scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceFromBottom < 40;
    isNearBottomRef.current = isNear;

    setShowScrollBottom(!isNear);
    if (isNear) {
      setUnreadWhileScrolled(0);
    }
  }, []);

  // On open only (transition from closed to open), scroll to bottom and mark read
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
      onReadRef.current?.();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // When new messages arrive: only auto-scroll if user was already at bottom or if outgoing
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.direction === 'outgoing' || isNearBottomRef.current) {
        scrollToBottom(true);
      } else {
        setUnreadWhileScrolled((prev) => prev + 1);
      }
      if (isOpen) {
        onReadRef.current?.();
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isOpen, scrollToBottom]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setIsSending(true);

    const success = webrtcService.sendTextMessage(text);
    if (success) {
      addMessage({
        id: `out_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text,
        senderName: localDevice.name,
        direction: 'outgoing',
        timestamp: Date.now(),
      });
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  // The inner chat interface content
  const chatContent = (
    <div className="flex flex-col h-full w-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                Session Chat
              </p>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {messages.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {remoteDevice ? `With ${remoteDevice.name}` : 'P2P Encrypted Channel'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Clear Chat */}
          {messages.length > 0 && (
            <div className="relative">
              {showClearConfirm ? (
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 p-1 rounded-xl border border-rose-200 dark:border-rose-800 animate-in fade-in">
                  <button
                    onClick={() => {
                      clearMessages();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear?
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Clear chat history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Toggle Modal / Docked Mode */}
          <button
            onClick={() => setIsModalMode((v) => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={isModalMode ? 'Dock to sidebar' : 'Expand to centered modal'}
          >
            {isModalMode ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0 overscroll-contain"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-10 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-blue-500">
                <Sparkles className="w-6 h-6 opacity-80" />
              </div>
              <div className="max-w-[220px]">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No notes yet
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Send a message, note, or quick link directly to {remoteDevice?.name || 'your peer'}.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isOut = msg.direction === 'outgoing';
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isSameSender = prevMsg && prevMsg.direction === msg.direction;
                const isRecent = prevMsg && msg.timestamp - prevMsg.timestamp < 120000;
                const showSenderHeader = !isSameSender || !isRecent;
                const isCopied = copiedId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isOut ? 'items-end' : 'items-start'} ${showSenderHeader ? 'mt-2.5' : 'mt-0.5'
                      }`}
                  >
                    {/* Sender name for first message in group */}
                    {showSenderHeader && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-1 mb-1">
                        {isOut ? 'You' : msg.senderName}
                      </span>
                    )}

                    {/* Bubble + Action row */}
                    <div
                      className={`relative flex items-center gap-1.5 max-w-[88%] ${isOut ? 'flex-row-reverse' : 'flex-row'
                        }`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words select-text ${isOut
                            ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/20 rounded-2xl rounded-br-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-bl-sm'
                          }`}
                      >
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Quick Copy Action (appears on hover) */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 cursor-pointer ${isCopied ? '!opacity-100 text-emerald-500' : ''
                          }`}
                        title={isCopied ? 'Copied to clipboard' : 'Copy message text'}
                        aria-label="Copy message"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Timestamp */}
                    <div
                      className={`flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 px-1 mt-0.5`}
                    >
                      <Clock className="w-2.5 h-2.5 opacity-60" />
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Floating "Scroll to Bottom / New Messages" pill */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all duration-150 cursor-pointer animate-in fade-in slide-in-from-bottom-2 z-10"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>
              {unreadWhileScrolled > 0
                ? `${unreadWhileScrolled} new note${unreadWhileScrolled > 1 ? 's' : ''}`
                : 'Jump to latest'}
            </span>
          </button>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or note… (Enter to send)"
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none leading-relaxed transition-all"
            style={{ minHeight: '42px', maxHeight: '100px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="shrink-0 w-10.5 h-10.5 rounded-2xl flex items-center justify-center bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-blue-500/25 transition-all duration-150 cursor-pointer"
            aria-label="Send message"
            title="Send (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
          <span>Shift + Enter for new line</span>
          <span>Temporary session notes</span>
        </div>
      </div>
    </div>
  );

  // If user maximized into a modal overlay, render with fixed backdrop
  if (isModalMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-2xl h-[640px] max-h-[90vh]">
          {chatContent}
        </div>
      </div>
    );
  }

  // Otherwise render in standard container
  return chatContent;
};
