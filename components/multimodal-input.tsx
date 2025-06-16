'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import PowerSelector from '@/components/power-selector';
import type { PowerLevel } from '@/lib/ai/ai-models.config';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedPower,
  setSelectedPower,
  showSuggestions = true,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  selectedPower: PowerLevel;
  setSelectedPower: (power: PowerLevel) => void;
  showSuggestions?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const handlePowerChange = (power: PowerLevel) => {
    setSelectedPower(power);
    console.log('Selected power:', power);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div
        className={cx(
          'relative w-full',
          messages.length === 0 ? 'max-w-3xl mx-auto' : 'max-w-3xl mx-auto',
        )}
      >
        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder={
            messages.length === 0
              ? 'Ask whatever you want....'
              : 'Send a message...'
          }
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base border-0 shadow-none focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'backdrop-blur-[28px] bg-black/[0.12] dark:bg-black/[0.25] border border-white/[0.08] dark:border-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] focus:border-white/[0.16] dark:focus:border-white/[0.14] pb-14 px-6 pt-5 text-base min-h-[72px] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.24),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_12px_40px_rgba(0,0,0,0.32)] focus:shadow-[0_16px_48px_rgba(0,0,0,0.40)] placeholder:text-white/[0.45] dark:placeholder:text-white/[0.40] text-white/[0.95] dark:text-white/[0.90] transition-all duration-300 ease-out',
            className,
          )}
          rows={2}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status !== 'ready') {
                toast.error(
                  'Please wait for the model to finish its response!',
                );
              } else {
                submitForm();
              }
            }
          }}
        />

        {/* Botones en la izquierda con nuevo diseño */}
        <div className="absolute bottom-4 left-5 flex items-center gap-3">
          <button
            type="button"
            data-testid="attachments-button"
            className="group relative p-3 rounded-full backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] transition-all duration-300 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-white/[0.70] dark:text-white/[0.65] hover:text-white/[0.90] dark:hover:text-white/[0.85] hover:scale-105 active:scale-[0.95] disabled:opacity-40 disabled:hover:scale-100"
            onClick={(event) => {
              event.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={status !== 'ready'}
          >
            <PaperclipIcon size={16} />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <div className="hidden md:block">
            <PowerSelector
              selectedPower={selectedPower}
              onPowerChange={handlePowerChange}
            />
          </div>
        </div>

        {/* Botón de envío con diseño circular mejorado */}
        <div className="absolute bottom-4 right-5">
          {status === 'submitted' ? (
            <button
              type="button"
              data-testid="stop-button"
              className="group relative p-3 rounded-full backdrop-blur-xl bg-red-500/[0.15] border border-red-400/[0.20] hover:bg-red-500/[0.25] hover:border-red-400/[0.30] transition-all duration-300 ease-out shadow-[0_4px_20px_rgba(239,68,68,0.20),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(239,68,68,0.30)] text-red-300 hover:text-red-200 hover:scale-105 active:scale-[0.95]"
              onClick={(event) => {
                event.preventDefault();
                stop();
                setMessages((messages) => messages);
              }}
            >
              <StopIcon size={16} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/[0.12] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="send-button"
              className="group relative p-3 rounded-full backdrop-blur-xl bg-gradient-to-br from-slate-600/[0.15] via-slate-500/[0.12] to-slate-400/[0.15] border border-slate-400/[0.20] hover:border-slate-300/[0.30] hover:from-slate-500/[0.25] hover:via-slate-400/[0.20] hover:to-slate-300/[0.25] transition-all duration-300 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.20),0_1px_1px_rgba(255,255,255,0.08)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.30)] text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-[0.95] disabled:hover:scale-100"
              onClick={(event) => {
                event.preventDefault();
                submitForm();
              }}
              disabled={input.length === 0 || uploadQueue.length > 0}
            >
              <ArrowUpIcon size={16} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
        </div>
      </div>

      {/* SuggestedActions movidas debajo del input */}
      {showSuggestions &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="mt-6">
            <SuggestedActions append={append} chatId={chatId} />
          </div>
        )}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    return (
      prevProps.input === nextProps.input &&
      prevProps.status === nextProps.status &&
      equal(prevProps.attachments, nextProps.attachments) &&
      equal(prevProps.messages, nextProps.messages) &&
      prevProps.chatId === nextProps.chatId &&
      prevProps.selectedPower === nextProps.selectedPower &&
      prevProps.showSuggestions === nextProps.showSuggestions
    );
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="h-9 px-3 py-1 rounded-full border-0 shadow-none hover:shadow-none hover:bg-transparent flex items-center justify-center"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={18} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="h-9 px-3 py-1 rounded-full border-0 shadow-none hover:shadow-none hover:bg-transparent flex items-center justify-center"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={18} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="h-9 px-3 py-1 rounded-full border-0 shadow-none hover:shadow-none hover:bg-transparent flex items-center justify-center"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={18} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
