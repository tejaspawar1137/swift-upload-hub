import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  LinearProgress,
  Paper,
  Fade,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Close,
  Speed,
  Timer,
  DataUsage,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { toast } from 'sonner';
import { tbmlRFIs, controlCheckRFIs, type RFIOption } from '@/data/rfiData';

// IDFC First Bank Theme - Red/Maroon with White
const idfcTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
      contrastText: '#7a1f2e',
    },
    secondary: {
      main: '#f5a623',
    },
    background: {
      default: '#5a1520',
      paper: '#6b1f2c',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
    },
    error: {
      main: '#ff6b6b',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(107, 31, 44, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '12px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffffff',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-focused': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-checked': {
            color: '#ffffff',
          },
        },
      },
    },
  },
});

// Base API URL - update this to your backend
const BASE_IP_URL_1 = 'https://your-api-endpoint.com';

type UploadType = 'tbml' | 'controlChecks';

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
  const [uploadType, setUploadType] = useState<UploadType>('tbml');
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

  const rfiOptions: RFIOption[] = uploadType === 'tbml' ? tbmlRFIs : controlCheckRFIs;

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadType(event.target.value as UploadType);
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
    if (size > 1024 * 1024 * 1024) return 50 * 1024 * 1024; // 50MB for > 1GB
    if (size > 500 * 1024 * 1024) return 20 * 1024 * 1024;  // 20MB for > 500MB
    if (size > 100 * 1024 * 1024) return 10 * 1024 * 1024;  // 10MB for > 100MB
    return 5 * 1024 * 1024;                                 // 5MB min (S3 requirement)
  };

  const handleUpload = async () => {
    const { file } = uploadState;

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!selectedRFI) {
      toast.error('Please select an RFI from the dropdown');
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

      // Create concurrent upload pool
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

  return (
    <ThemeProvider theme={idfcTheme}>
      <Box className="idfc-gradient-bg min-h-screen flex items-center justify-center p-6">
        <Card 
          elevation={0}
          sx={{ 
            maxWidth: 600, 
            width: '100%',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#ffffff',
                  mb: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                S3 File Upload
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                IDFC FIRST Bank - Secure Document Upload
              </Typography>
            </Box>

            {/* Upload Type Selection */}
            <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                Select Upload Type
              </Typography>
              <RadioGroup
                row
                value={uploadType}
                onChange={handleTypeChange}
                sx={{ 
                  gap: 2,
                  '& .MuiFormControlLabel-root': {
                    flex: 1,
                    m: 0,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '12px',
                    p: 1.5,
                    transition: 'all 0.2s ease',
                    '&:has(.Mui-checked)': {
                      borderColor: '#ffffff',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              >
                <FormControlLabel 
                  value="tbml" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600} color="#ffffff">TBML</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Trade Based Money Laundering
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="controlChecks" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600} color="#ffffff">Control Checks</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Compliance Verification
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* RFI Dropdown */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="rfi-select-label">Select RFI</InputLabel>
              <Select
                labelId="rfi-select-label"
                value={selectedRFI}
                label="Select RFI"
                onChange={(e) => setSelectedRFI(e.target.value)}
                sx={{ 
                  borderRadius: '12px',
                  color: '#ffffff',
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#6b1f2c',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    },
                  },
                }}
              >
                {rfiOptions.map((rfi) => (
                  <MenuItem key={rfi.id} value={rfi.value}>
                    {rfi.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Upload Zone */}
            <Paper
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: '16px',
                border: '2px dashed',
                borderColor: isDragOver ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
                bgcolor: isDragOver ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                mb: 3,
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
              onClick={() => !uploadState.uploading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleInputChange}
                accept=".zip,.rar,.7z,.tar,.gz"
                disabled={uploadState.uploading}
              />
              
              {uploadState.file ? (
                <Fade in>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <InsertDriveFile sx={{ fontSize: 48, color: '#ffffff' }} />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body1" fontWeight={600} color="#ffffff">
                          {uploadState.file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {formatBytes(uploadState.file.size)}
                        </Typography>
                      </Box>
                      {!uploadState.uploading && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          sx={{ ml: 'auto', color: '#ffffff' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Fade>
              ) : (
                <Box>
                  <CloudUpload sx={{ fontSize: 56, color: 'rgba(255, 255, 255, 0.6)', mb: 2 }} />
                  <Typography variant="body1" fontWeight={600} color="#ffffff" sx={{ mb: 0.5 }}>
                    Drag & drop your file here
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    or click to browse
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['.zip', '.rar', '.7z', '.tar', '.gz'].map((ext) => (
                      <Chip 
                        key={ext} 
                        label={ext} 
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                          borderColor: 'rgba(255, 255, 255, 0.4)', 
                          color: 'rgba(255, 255, 255, 0.8)',
                        }} 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Progress Section */}
            {(uploadState.uploading || uploadState.completed) && (
              <Fade in>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} color="#ffffff">
                      {uploadState.completed ? 'Upload Complete' : `Uploading... Part ${uploadState.currentPart}/${uploadState.totalParts}`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {uploadState.progress}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadState.progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: uploadState.completed 
                          ? 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
                          : 'linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
                        boxShadow: uploadState.completed
                          ? '0 0 15px rgba(76, 175, 80, 0.6)'
                          : '0 0 15px rgba(255, 255, 255, 0.4)',
                      },
                    }}
                  />

                  {/* Upload Stats */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: 2, 
                    mt: 2,
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Speed sx={{ color: '#ffffff', mb: 0.5 }} />
                      <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Speed
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#ffffff">
                        {uploadState.uploadSpeed}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <DataUsage sx={{ color: '#f5a623', mb: 0.5 }} />
                      <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Uploaded
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#ffffff">
                        {formatBytes(uploadState.uploadedBytes)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Timer sx={{ color: '#81c784', mb: 0.5 }} />
                      <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Time Left
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#ffffff">
                        {uploadState.timeRemaining}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            )}

            {/* Upload Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleUpload}
              disabled={!uploadState.file || !selectedRFI || uploadState.uploading}
              startIcon={uploadState.completed ? <CheckCircle /> : <CloudUpload />}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                background: uploadState.completed 
                  ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                  : '#ffffff',
                color: uploadState.completed ? '#ffffff' : '#7a1f2e',
                boxShadow: uploadState.completed
                  ? '0 10px 30px -10px rgba(76, 175, 80, 0.5)'
                  : '0 10px 30px -10px rgba(255, 255, 255, 0.4)',
                '&:hover': {
                  background: uploadState.completed 
                    ? 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)'
                    : 'rgba(255, 255, 255, 0.9)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.4)',
                },
              }}
            >
              {uploadState.uploading 
                ? 'Uploading...' 
                : uploadState.completed 
                  ? 'Upload Complete' 
                  : 'Upload to S3'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default Index;
