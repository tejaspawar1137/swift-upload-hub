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

// Custom dark theme for Material-UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22d3ee',
    },
    secondary: {
      main: '#a855f7',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
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
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(71, 85, 105, 0.4)',
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
  },
});

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
}

const Index: React.FC = () => {
  const [uploadType, setUploadType] = useState<UploadType>('tbml');
  const [selectedRFI, setSelectedRFI] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    uploadSpeed: '0 KB/s',
    timeRemaining: '--',
    uploadedBytes: 0,
    totalBytes: 0,
    completed: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      uploadSpeed: '0 KB/s',
      timeRemaining: '--',
      uploadedBytes: 0,
      totalBytes: file.size,
      completed: false,
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
      uploadSpeed: '0 KB/s',
      timeRemaining: '--',
      uploadedBytes: 0,
      totalBytes: 0,
      completed: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    setUploadState(prev => ({ ...prev, uploading: true, progress: 0, completed: false }));
    const startTime = Date.now();

    try {
      const presignedUrl = "https://rapid-s3-sa.s3.ap-south-1.amazonaws.com/test.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAVRUVPM4D7HU2R756%2F20260119%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260119T062334Z&X-Amz-Expires=604700&X-Amz-SignedHeaders=host&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiSDBGAiEAz5xv6B%2Bmkv7ZvjV%2BAAf6tN7ew6IIYfVtP8zTcHVBMxYCIQD4%2FQZONmO8WB3Z%2Fj8L1fBxx8bTIhSMyKtkca3sd0YVMSqNBQiP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDM4MTQ5MTgzMjU4MyIMXy57anVrhcf0L63GKuEEfCG2OYbBJxuwGVEQDFS%2BbFOvsTP1WlU7BmNRwTN%2FlEq0IEgYE9ibv8J8wKa19FBAmBNkupmwmnq7435ZWbZXrSWgw8MSM7cNa79FMMDFNrhUE69fuzkrH3fjLRZvL%2FbbLHJl2U%2FLE0pe2xGzQqanMO4MevzZeYUVyTKaLmdhRQJ%2FRPaH9eGnFXFRsumpp9dL0kqMOejX2WSUYPUU87wXJVonVY0ZC7yWYCMNxHgOo7k7p9QoK%2FSO1J4oo1oJKpIGms0vCMmq%2F73ff2RyPg1JIrlcXBLdHiu9IhVktUcKg7bveTkAzjgz674B2APJMdDXZX%2B9K9rJsRHGHsaIoFuNsURG3CDWbkx4N4jTTR5mMpQRIIDsbPHHfvP2QsZLogEm4rebj9JoinBacss3V1uoaDFfGhS7S%2FOcKiKwlof5PRUI6LcRcmDoV5VvuF5IC9OzDKwp31Sr6yKr7oJIWgeAfnW4IL7tAXMN7mSOWF7VmCHAK46JHNFtnTL4UU70DobsWiF6uP3TP7C9gDRQwtk22ile9heFxFJxVShXiTmiwNj3idhMfTQwPcADpouvwQOS1nJho4vsEC0AnV36%2FVnEw8ykN3cF7le8xlmN05L2o1rmlo0q9p%2FEIE9sMRqVL%2FuU%2BjGhCACq2oOPKYHCsbTZT7o%2Fe0AK2taKmShl9573KvtGeuZpJh1HaWBzuCMGZB1sDpsReTryK%2BxmqsQ446lJAhxr8r2ut9pyfGYk%2F7aJXMwMfKw4ltzoY0JnfPMWJCLTl6UDEi81sTSNPuRtvAknWeQgiiFU%2BWLzNqkV%2FeGoXgDKMJGZt8sGOpcBWas0Fq1FgA%2Fqjb1EcGBf1YO5xnjSPDuoOWBoRVOgr4kCTdgQVmLP1oEuzT1LlC8cF3sdTAzq4pumFiytZvPIHfyHPjr%2FS%2Fr4sl22B5jMI7mgsenE2Xm7ZzGYaF7rmSROW8G6EiAK%2FctiBgk%2BO5KU%2FxSS2NGE1Un797oI4NEAcY7XDvYx5QZ6K2Z0QWdxshJgz3Ol5gktIQ%3D%3D&X-Amz-Signature=4f1585feb7e08c0a72c68ba48109479545822cd34de71656c06a1786579cf6ef";

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          const elapsedTime = (Date.now() - startTime) / 1000;
          const bytesPerSecond = e.loaded / elapsedTime;
          const remainingBytes = e.total - e.loaded;
          const remainingTime = remainingBytes / bytesPerSecond;

          setUploadState(prev => ({
            ...prev,
            progress: percentComplete,
            uploadSpeed: formatSpeed(bytesPerSecond),
            timeRemaining: formatTime(remainingTime),
            uploadedBytes: e.loaded,
          }));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      const uploadDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        completed: true,
        uploadSpeed: '0 KB/s',
        timeRemaining: 'Complete',
      }));

      toast.success(
        `File uploaded successfully! Duration: ${uploadDuration}s`,
        { duration: 5000 }
      );

    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'File upload failed');
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        uploadSpeed: '0 KB/s',
        timeRemaining: '--',
      }));
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box className="gradient-bg min-h-screen flex items-center justify-center p-6">
        <Card 
          elevation={0}
          sx={{ 
            maxWidth: 600, 
            width: '100%',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px -10px rgba(34, 211, 238, 0.15)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                S3 File Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your compliance documents securely
              </Typography>
            </Box>

            {/* Upload Type Selection */}
            <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
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
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: 1.5,
                    transition: 'all 0.2s ease',
                    '&:has(.Mui-checked)': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(34, 211, 238, 0.08)',
                    },
                  },
                }}
              >
                <FormControlLabel 
                  value="tbml" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>TBML</Typography>
                      <Typography variant="caption" color="text.secondary">
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
                      <Typography variant="body1" fontWeight={600}>Control Checks</Typography>
                      <Typography variant="caption" color="text.secondary">
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
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
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
                borderColor: isDragOver ? 'primary.main' : 'divider',
                bgcolor: isDragOver ? 'rgba(34, 211, 238, 0.05)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                mb: 3,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(34, 211, 238, 0.05)',
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
                      <InsertDriveFile sx={{ fontSize: 48, color: 'primary.main' }} />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body1" fontWeight={600}>
                          {uploadState.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatBytes(uploadState.file.size)}
                        </Typography>
                      </Box>
                      {!uploadState.uploading && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          sx={{ ml: 'auto' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Fade>
              ) : (
                <Box>
                  <CloudUpload sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                    Drag & drop your file here
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to browse
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['.zip', '.rar', '.7z', '.tar', '.gz'].map((ext) => (
                      <Chip key={ext} label={ext} size="small" variant="outlined" />
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
                    <Typography variant="body2" fontWeight={600}>
                      {uploadState.completed ? 'Upload Complete' : 'Uploading...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {uploadState.progress}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadState.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(71, 85, 105, 0.4)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: uploadState.completed 
                          ? 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)'
                          : 'linear-gradient(90deg, #22d3ee 0%, #a855f7 100%)',
                        boxShadow: uploadState.completed
                          ? '0 0 10px rgba(34, 197, 94, 0.5)'
                          : '0 0 10px rgba(34, 211, 238, 0.5)',
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
                    bgcolor: 'rgba(30, 41, 59, 0.5)',
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Speed sx={{ color: 'primary.main', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Speed
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {uploadState.uploadSpeed}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <DataUsage sx={{ color: 'secondary.main', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Uploaded
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatBytes(uploadState.uploadedBytes)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Timer sx={{ color: 'warning.main', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Time Left
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
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
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)',
                boxShadow: uploadState.completed
                  ? '0 10px 30px -10px rgba(34, 197, 94, 0.4)'
                  : '0 10px 30px -10px rgba(34, 211, 238, 0.4)',
                '&:hover': {
                  background: uploadState.completed 
                    ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                    : 'linear-gradient(135deg, #06b6d4 0%, #9333ea 100%)',
                },
                '&:disabled': {
                  background: 'rgba(71, 85, 105, 0.5)',
                  color: 'rgba(255, 255, 255, 0.3)',
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
