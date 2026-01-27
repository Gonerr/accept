import React from 'react';
import { Button, Box } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

const InnUploadButtons = ({ 
  onExcelUpload, 
  onPasteFromClipboard, 
  disabled = false,
  showPasteButton = true 
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={onExcelUpload}
        disabled={disabled}
        sx={{
          borderRadius: 2,
          borderColor: "#667eea",
          color: "#667eea",
          "&:hover": {
            borderColor: "#5a6fd8",
            backgroundColor: "rgba(102, 126, 234, 0.04)",
            transform: "translateY(-1px)"
          }
        }}
      >
        Загрузить из Excel
      </Button>
      
      {showPasteButton && (
        <Button
          variant="outlined"
          startIcon={<ContentPasteIcon />}
          onClick={onPasteFromClipboard}
          disabled={disabled}
          sx={{
            borderRadius: 2,
            borderColor: "#764ba2",
            color: "#764ba2",
            "&:hover": {
              borderColor: "#6a4090",
              backgroundColor: "rgba(118, 75, 162, 0.04)",
              transform: "translateY(-1px)"
            }
          }}
        >
          Вставить из буфера
        </Button>
      )}
    </Box>
  );
};

export default InnUploadButtons;