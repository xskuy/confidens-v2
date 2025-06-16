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
import { Plus, Search } from 'lucide-react';

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
  ragMode = false,
  setRagMode,
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
  ragMode?: boolean;
  setRagMode?: (ragMode: boolean) => void;
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
      {showSuggestions &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions append={append} chatId={chatId} />
        )}

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
            ragMode
              ? 'Pregunta sobre tus documentos (modo RAG activado)...'
              : messages.length === 0
                ? 'Ask whatever you want....'
                : 'Send a message...'
          }
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base border-0 shadow-none focus:ring-0 focus:border-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'bg-muted pb-14 px-5 pt-4 text-base min-h-[60px] border border-border rounded-2xl shadow-sm',
            ragMode && 'border-primary/50 bg-primary/5',
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

        {/* Botones unificados para ambos estados */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {/* Botón de agregar archivos - solo icono + */}
          <button
            data-testid="attachments-button"
            className="size-10 rounded-xl bg-transparent hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 border-0"
            onClick={(event) => {
              event.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={status !== 'ready'}
            type="button"
          >
            <Plus size={20} />
          </button>

          {/* Botón RAG - con texto e icono */}
          <button
            data-testid="rag-button"
            className={cx(
              'h-8 px-3 rounded-xl flex items-center gap-1.5 transition-all duration-200 border-0 bg-transparent hover:bg-muted/50',
              ragMode
                ? 'text-blue-500'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={(event) => {
              event.preventDefault();
              if (setRagMode) {
                setRagMode(!ragMode);
              }
            }}
            disabled={status !== 'ready'}
            type="button"
          >
            <Search size={16} />
            <span className="text-xs font-medium">RAG</span>
          </button>

          <PowerSelector
            selectedPower={selectedPower}
            onPowerChange={handlePowerChange}
          />
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="text-muted-foreground text-xs">
            {ragMode ? '🔍 RAG' : '🌐 All Web'}
          </div>
          <div className="text-muted-foreground text-xs">
            {input.length}/1000
          </div>
          {status === 'submitted' ? (
            <PureStopButton stop={stop} setMessages={setMessages} />
          ) : (
            <Button
              data-testid="send-button"
              className="size-8 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground"
              onClick={(event) => {
                event.preventDefault();
                submitForm();
              }}
              disabled={input.length === 0 || uploadQueue.length > 0}
            >
              <ArrowUpIcon size={16} />
            </Button>
          )}
        </div>
      </div>
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
      prevProps.showSuggestions === nextProps.showSuggestions &&
      prevProps.ragMode === nextProps.ragMode &&
      prevProps.setRagMode === nextProps.setRagMode
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
