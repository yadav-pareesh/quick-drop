import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Send } from 'lucide-react';
import { webrtcService } from '../../services/webrtc';
import { useToastStore } from '../../stores/toastStore';

interface TextTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextTransferModal: React.FC<TextTransferModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToastStore();

  const handleSend = () => {
    if (!text.trim()) return;
    setIsSending(true);

    const success = webrtcService.sendTextMessage(text.trim());
    setIsSending(false);

    if (success) {
      showToast({
        type: 'success',
        title: 'Note Sent',
        message: 'Your text message was delivered to the peer.',
      });
      setText('');
      onClose();
    } else {
      showToast({
        type: 'error',
        title: 'Send Failed',
        message: 'Ensure your device is connected before sending text.',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Text or Note"
      description="Quickly send text snippets, links, or notes to the connected device"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text, links, or code here..."
          className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
          autoFocus
        />

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{text.length} characters</span>
          <span>Delivered directly via WebRTC</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            isLoading={isSending}
            disabled={!text.trim()}
            leftIcon={<Send className="w-4 h-4" />}
            onClick={handleSend}
          >
            Send Text
          </Button>
        </div>
      </div>
    </Modal>
  );
};
