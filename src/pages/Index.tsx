import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { tradeIntelligenceRFIs, masterExcelRFIs, tbmlRFIs, type RFIOption } from '@/data/rfiData';
import { X, Upload, FileText } from 'lucide-react';

// Base API URL - update this to your backend
const BASE_IP_URL_1 = 'https://your-api-endpoint.com';

type UploadType = 'tradeIntelligence' | 'masterExcel' | 'tbml';

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  uploadSpeed: string;
  timeRemaining: string;
  uploadedBytes: number;
  totalBytes: number;
  completed: boolean;
  currentPart: number;
  totalParts: number;
}

const Index: React.FC = () => {
  const [uploadType, setUploadType] = useState<UploadType>('tradeIntelligence');
  const [selectedRFI, setSelectedRFI] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    uploadSpeed: '0 MB/s',
    timeRemaining: '--',
    uploadedBytes: 0,
    totalBytes: 0,
    completed: false,
    currentPart: 0,
    totalParts: 0,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTimeRef = useRef<number>(0);

  const getRFIOptions = (): RFIOption[] => {
    switch (uploadType) {
      case 'tradeIntelligence':
        return tradeIntelligenceRFIs;
      case 'masterExcel':
        return masterExcelRFIs;
      case 'tbml':
        return tbmlRFIs;
      default:
        return [];
    }
  };

  const rfiOptions = getRFIOptions();

  const handleTypeChange = (type: UploadType) => {
    setUploadType(type);
    setSelectedRFI('');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '--';
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Invalid file type. Please upload .zip, .rar, .7z, .tar, or .gz files');
      return;
    }

    setUploadState({
      file,
      uploading: false,
      progress: 0,
      uploadSpeed: '0 MB/s',
      timeRemaining: '--',
      uploadedBytes: 0,
      totalBytes: file.size,
      completed: false,
      currentPart: 0,
      totalParts: 0,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const clearFile = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      uploadSpeed: '0 MB/s',
      timeRemaining: '--',
      uploadedBytes: 0,
      totalBytes: 0,
      completed: false,
      currentPart: 0,
      totalParts: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getOptimalPartSize = (size: number): number => {
    if (size > 1024 * 1024 * 1024) return 50 * 1024 * 1024;
    if (size > 500 * 1024 * 1024) return 20 * 1024 * 1024;
    if (size > 100 * 1024 * 1024) return 10 * 1024 * 1024;
    return 5 * 1024 * 1024;
  };

  const handleCancel = () => {
    clearFile();
    setSelectedRFI('');
  };

  const handleUpload = async () => {
    const { file } = uploadState;

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!selectedRFI) {
      toast.error('Please select an option from the dropdown');
      return;
    }

    console.log('='.repeat(50));
    console.log('🚀 STARTING MULTIPART UPLOAD PROCESS');
    console.log('='.repeat(50));
    console.log('📋 Upload Details:');
    console.log(' • File:', file.name);
    console.log(' • File Size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
    console.log(' • File Type:', file.type);
    console.log(' • Upload Type:', uploadType);
    console.log(' • Selected RFI:', selectedRFI);

    uploadStartTimeRef.current = Date.now();
    
    setUploadState(prev => ({ 
      ...prev, 
      uploading: true, 
      progress: 0, 
      completed: false 
    }));

    try {
      const partSize = getOptimalPartSize(file.size);
      const totalParts = Math.ceil(file.size / partSize);
      
      console.log(`📦 Strategy: ${totalParts} parts of ${(partSize / 1024 / 1024).toFixed(0)}MB each`);
      
      setUploadState(prev => ({ ...prev, totalParts }));

      // Step 1: Initialize multipart upload
      const initResp = await fetch(`${BASE_IP_URL_1}/api/multipart/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          uploadType,
          rfiId: selectedRFI,
        }),
      });

      if (!initResp.ok) throw new Error('Failed to initiate multipart upload');
      const { uploadId, key } = await initResp.json();
      console.log('✅ Upload initiated:', { uploadId, key });

      // Step 2: Get presigned URLs for all parts
      const urlsResp = await fetch(`${BASE_IP_URL_1}/api/multipart/part-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          uploadId,
          parts: totalParts,
        }),
      });

      if (!urlsResp.ok) throw new Error('Failed to get part URLs');
      const { urls } = await urlsResp.json();
      console.log(`✅ Received ${urls.length} presigned URLs`);

      // Step 3: Upload parts with concurrency control
      const concurrency = 6;
      let active = 0;
      let index = 0;
      const etags: { ETag: string; PartNumber: number }[] = [];
      const uploadedMap: Record<number, number> = {};
      let lastProgressUpdate = 0;

      const updateProgress = () => {
        const totalUploaded = Object.values(uploadedMap).reduce((a, b) => a + b, 0);
        const percent = Math.min(100, Math.round((totalUploaded / file.size) * 100));
        const elapsedTime = (Date.now() - uploadStartTimeRef.current) / 1000;
        const bytesPerSecond = totalUploaded / elapsedTime;
        const remainingBytes = file.size - totalUploaded;
        const remainingTime = remainingBytes / bytesPerSecond;

        setUploadState(prev => ({
          ...prev,
          progress: percent,
          uploadedBytes: totalUploaded,
          uploadSpeed: formatSpeed(bytesPerSecond),
          timeRemaining: formatTime(remainingTime),
        }));
      };

      const uploadPart = (partNumber: number, blob: Blob, url: string, retryCount = 0): Promise<void> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              uploadedMap[partNumber] = event.loaded;
              
              const now = Date.now();
              if (now - lastProgressUpdate > 100) {
                lastProgressUpdate = now;
                updateProgress();
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader('ETag') || '';
              etags.push({ ETag: etag, PartNumber: partNumber });
              uploadedMap[partNumber] = blob.size;
              console.log(`✅ Part ${partNumber} uploaded (ETag: ${etag})`);
              setUploadState(prev => ({ ...prev, currentPart: prev.currentPart + 1 }));
              resolve();
            } else {
              if (retryCount < 3) {
                console.log(`⚠️ Retrying part ${partNumber} (Attempt ${retryCount + 1})...`);
                setTimeout(() => uploadPart(partNumber, blob, url, retryCount + 1).then(resolve).catch(reject), 1000 * Math.pow(2, retryCount));
              } else {
                reject(new Error(`Part ${partNumber} failed with status ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => {
            if (retryCount < 3) {
              console.log(`⚠️ Retrying part ${partNumber} (Network Error, Attempt ${retryCount + 1})...`);
              setTimeout(() => uploadPart(partNumber, blob, url, retryCount + 1).then(resolve).catch(reject), 1000 * Math.pow(2, retryCount));
            } else {
              reject(new Error(`Network error on part ${partNumber}`));
            }
          };

          xhr.send(blob);
        });
      };

      const runNext = (): Promise<void> => {
        if (index >= totalParts) return Promise.resolve();

        const current = index++;
        const partNumber = current + 1;
        const start = current * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);

        const urlObj = urls.find((u: { partNumber: number; url: string }) => u.partNumber === partNumber);
        const url = urlObj?.url || '';
        if (!url) return Promise.reject(new Error(`Missing URL for part ${partNumber}`));

        console.log(`📤 Uploading part ${partNumber}/${totalParts}`);
        return uploadPart(partNumber, blob, url);
      };

      const pool: Promise<void>[] = [];
      while (active < concurrency && index < totalParts) {
        active++;
        const chain = runNext().then(function run(): Promise<void> | void {
          active--;
          if (index < totalParts) {
            active++;
            return runNext().then(run);
          }
        });
        pool.push(chain);
      }

      await Promise.all(pool);
      console.log('✅ All parts uploaded successfully');

      // Step 4: Complete multipart upload
      const completeResp = await fetch(`${BASE_IP_URL_1}/api/multipart/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          uploadId,
          parts: etags.sort((a, b) => a.PartNumber - b.PartNumber),
        }),
      });

      if (!completeResp.ok) throw new Error('Failed to complete upload');
      const completeData = await completeResp.json();

      const uploadEndTime = Date.now();
      const uploadDuration = ((uploadEndTime - uploadStartTimeRef.current) / 1000).toFixed(2);
      const speedMBps = ((file.size / (uploadEndTime - uploadStartTimeRef.current)) * 1000 / (1024 * 1024)).toFixed(2);

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        completed: true,
        uploadSpeed: `${speedMBps} MB/s`,
        timeRemaining: 'Complete',
      }));

      console.log('✅ MULTIPART UPLOAD COMPLETE!');
      console.log('  • File Name:', key);
      console.log('  • URL:', completeData.url);
      console.log('  • Duration:', uploadDuration, 'seconds');
      console.log('  • Speed:', speedMBps, 'MB/s');

      toast.success(
        `File uploaded successfully! Duration: ${uploadDuration}s (${speedMBps} MB/s)`,
        { duration: 5000 }
      );

    } catch (err) {
      console.error('❌ MULTIPART UPLOAD ERROR:', err);
      toast.error(err instanceof Error ? err.message : 'File upload failed');
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        uploadSpeed: '0 MB/s',
        timeRemaining: '--',
        currentPart: 0,
      }));
    }
  };

  const isUploadDisabled = !uploadState.file || !selectedRFI || uploadState.uploading;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="bg-card rounded-2xl shadow-xl max-w-xl w-full p-8 relative">
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCancel}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h1 className="text-center text-2xl font-semibold text-primary mb-6">
          Upload File
        </h1>

        {/* Toggle Buttons */}
        <div className="flex gap-3 mb-6 justify-center">
          <button
            onClick={() => handleTypeChange('tradeIntelligence')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              uploadType === 'tradeIntelligence'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Trade Intelligence
          </button>
          <button
            onClick={() => handleTypeChange('masterExcel')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              uploadType === 'masterExcel'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Master Excel
          </button>
          <button
            onClick={() => handleTypeChange('tbml')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              uploadType === 'tbml'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            TBML
          </button>
        </div>

        {/* Dropdown */}
        <div className="mb-6">
          <select
            value={selectedRFI}
            onChange={(e) => setSelectedRFI(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
            }}
          >
            <option value="">Select an option</option>
            {rfiOptions.map((rfi) => (
              <option key={rfi.id} value={rfi.value}>
                {rfi.label}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploadState.uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-muted-foreground hover:bg-muted/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleInputChange}
            accept=".zip,.rar,.7z,.tar,.gz"
            disabled={uploadState.uploading}
          />

          {uploadState.file ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-10 h-10 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{uploadState.file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatBytes(uploadState.file.size)}</p>
                </div>
                {!uploadState.uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="ml-2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadState.uploading && (
                <div className="w-full mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Uploading... {uploadState.currentPart}/{uploadState.totalParts} parts</span>
                    <span>{uploadState.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{uploadState.uploadSpeed}</span>
                    <span>{uploadState.timeRemaining} remaining</span>
                  </div>
                </div>
              )}

              {uploadState.completed && (
                <div className="mt-3 px-4 py-2 bg-success/10 text-success rounded-lg text-sm font-medium">
                  ✓ Upload Complete
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-foreground font-medium mb-1">
                Drag and drop your file here
              </p>
              <p className="text-muted-foreground text-sm mb-4">or</p>
              <button
                type="button"
                className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
              >
                Select File
              </button>
              <p className="text-xs text-muted-foreground mt-4">
                Supported: .zip, .rar, .7z, .tar, .gz
              </p>
            </>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploadDisabled}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              isUploadDisabled
                ? 'bg-primary/40 text-primary-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
            }`}
          >
            {uploadState.uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
