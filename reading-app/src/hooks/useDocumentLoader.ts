import { useCallback, useRef, useState, type ChangeEvent } from 'react';

export type DocumentMetadata = {
  name: string;
  type: string;
};

const parseDocument = (raw: string, mime: string, name: string) => {
  const isJson = mime === 'application/json' || name.endsWith('.json');
  if (isJson) {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data.join('\n\n');
      }
      if (Array.isArray((data as any).paragraphs)) {
        return (data as any).paragraphs.join('\n\n');
      }
      if (typeof (data as any).text === 'string') {
        return (data as any).text;
      }
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to parse JSON document', error);
      return raw;
    }
  }
  return raw;
};

export const useDocumentLoader = () => {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text();
    setContent(parseDocument(text, file.type, file.name));
    setMetadata({ name: file.name, type: file.type });
  }, []);

  const openPicker = useCallback(async () => {
    if ('showOpenFilePicker' in window) {
      const [handle] = await (window as typeof window & {
        showOpenFilePicker: (options?: unknown) => Promise<FileSystemFileHandle[]>;
      }).showOpenFilePicker({
        types: [
          {
            description: 'Text documents',
            accept: {
              'text/plain': ['.txt'],
              'application/json': ['.json']
            }
          }
        ],
        excludeAcceptAllOption: false,
        multiple: false
      });
      const file = await handle.getFile();
      await handleFile(file);
    } else {
      fileInputRef.current?.click();
    }
  }, [handleFile]);

  const onInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const clearContent = useCallback(() => {
    setContent('');
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    content,
    metadata,
    openPicker,
    onInputChange,
    fileInputRef,
    clearContent
  };
};

export type UseDocumentLoaderReturn = ReturnType<typeof useDocumentLoader>;
