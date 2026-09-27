import React from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import type { TransferProposalPayload } from '../../types';
import { formatBytes, truncateFilename } from '../../utils/formatters';
import { getFileCategory } from '../../services/file';
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  FileArchive, 
  Code, 
  File as FileGeneric, 
  Download, 
  X, 
  ShieldAlert 
} from 'lucide-react';

interface IncomingTransferModalProps {
  proposal: TransferProposalPayload | null;
  onAccept: (proposal: TransferProposalPayload) => void;
  onReject: (proposal: TransferProposalPayload) => void;
}

export const IncomingTransferModal: React.FC<IncomingTransferModalProps> = ({
  proposal,
  onAccept,
  onReject,
}) => {
  if (!proposal) return null;

  const getIcon = (type: string, name: string) => {
    const cat = getFileCategory(type, name);
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-indigo-500" />;
      case 'video':
        return <Film className="w-4 h-4 text-violet-500" />;
      case 'audio':
        return <Music className="w-4 h-4 text-amber-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-cyan-500" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileGeneric className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Modal
      isOpen={!!proposal}
      onClose={() => onReject(proposal)}
      title="Incoming File Transfer"
      description={`${proposal.senderDevice.name} wants to send ${proposal.files.length} file(s)`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {/* Warning Badge */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Only accept files from devices you recognize.</span>
        </div>

        {/* Files preview list */}
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
          {proposal.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0">
                  {getIcon(file.type, file.name)}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {truncateFilename(file.name, 30)}
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-mono shrink-0">
                {formatBytes(file.size)}
              </span>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold text-blue-900 dark:text-blue-300">
          <span>Total Transfer Size:</span>
          <span className="text-sm font-bold font-mono">
            {formatBytes(proposal.totalBytes)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            leftIcon={<X className="w-4 h-4" />}
            onClick={() => onReject(proposal)}
          >
            Decline
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => onAccept(proposal)}
          >
            Accept Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
