import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Cloudinary Configuration dari environment variables
const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'kbisnisassets',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'auditmorowali',
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY || '638824498464139',
  apiSecret: process.env.REACT_APP_CLOUDINARY_API_SECRET || 'xLEtFZ-89IjfBLtfgCs0pKYtXno'
};

// Cloudinary service for handling file uploads dengan integrasi Firestore
export const cloudinaryService = {
  // Upload work paper file dengan integrasi Firestore
  async uploadWorkPaper(auditId, file, workPaperData) {
    try {
      console.log('Starting work paper upload to Cloudinary...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', `auditmorowaliutara/file/audits/${auditId}/work-papers`);
      
      // Tambahkan metadata untuk tracking
      formData.append('context', `audit_id=${auditId}|file_type=work_paper|uploaded_by=${workPaperData.uploadedBy || 'current-user'}`);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary upload success:', result);
      
      // Create work paper document dengan referensi Cloudinary
      const workPaperDoc = {
        ...workPaperData,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: workPaperData.uploadedBy || 'current-user',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        // Metadata tambahan untuk tracking
        storageProvider: 'cloudinary',
        cloudinaryFolder: `auditmorowaliutara/file/audits/${auditId}/work-papers`,
        downloadUrl: result.secure_url,
        canDownload: true,
        canUpdate: true
      };
      
      // Generate unique ID for the work paper
      const workPaperId = `workPaper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[CloudinaryService] Creating work paper in audit array');
      
      // Update audit document dengan file baru (simpan ke array field, BUKAN subcollection)
      const auditRef = doc(db, 'audits', auditId);
      const auditDoc = await getDoc(auditRef);
      if (auditDoc.exists()) {
        const auditData = auditDoc.data();
        const currentWorkPapers = auditData.workPapers || [];
        
        // Add complete file data to audit document array
        const fileData = {
          id: workPaperId,
          ...workPaperDoc,
          fileName: file.name,
          fileUrl: result.secure_url,
          cloudinaryId: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: workPaperData.uploadedBy || 'current-user'
        };
        
        console.log('[CloudinaryService] Adding work paper to array:', fileData);
        
        await updateDoc(auditRef, {
          workPapers: [...currentWorkPapers, fileData],
          workPapersCount: (auditData.workPapersCount || 0) + 1,
          hasWorkPapers: true,
          lastUpdated: serverTimestamp()
        });
        
        console.log('[CloudinaryService] Work paper added to audit array successfully');
      } else {
        throw new Error('Audit document not found');
      }
      
      // Track file upload di collection terpisah
      await addDoc(collection(db, 'file-uploads'), {
        auditId,
        workPaperId: workPaperId,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        cloudinaryPublicId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: workPaperData.uploadedBy || 'current-user',
        uploadedAt: serverTimestamp(),
        status: 'completed',
        storageProvider: 'cloudinary',
        folder: `auditmorowaliutara/file/audits/${auditId}/work-papers`,
        canDownload: true,
        canUpdate: true,
        lastAccessed: serverTimestamp()
      });
      
      return {
        id: workPaperId,
        ...workPaperDoc,
        downloadURL: result.secure_url,
        firestoreId: workPaperId
      };
    } catch (error) {
      console.error('Error uploading work paper:', error);
      throw error;
    }
  },

  // Upload audit evidence file dengan integrasi Firestore
  async uploadEvidence(auditId, file, evidenceData) {
    try {
      console.log('Starting evidence upload to Cloudinary...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', `auditmorowaliutara/file/audits/${auditId}/evidence`);
      formData.append('context', `audit_id=${auditId}|file_type=evidence|uploaded_by=${evidenceData.uploadedBy || 'current-user'}`);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary upload success:', result);
      
      const evidenceDoc = {
        ...evidenceData,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: evidenceData.uploadedBy || 'current-user',
        uploadedAt: new Date(),
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        storageProvider: 'cloudinary',
        cloudinaryFolder: `auditmorowaliutara/file/audits/${auditId}/evidence`,
        downloadUrl: result.secure_url,
        canDownload: true,
        canUpdate: true
      };
      
      // Generate unique ID for the evidence
      const evidenceId = `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[CloudinaryService] Creating evidence in audit array');
      
      // Update audit document dengan file baru (simpan ke array field, BUKAN subcollection)
      const auditRef = doc(db, 'audits', auditId);
      const auditDoc = await getDoc(auditRef);
      if (auditDoc.exists()) {
        const auditData = auditDoc.data();
        const currentEvidence = auditData.evidence || [];
        
        // Add complete file data to audit document array
        const fileData = {
          id: evidenceId,
          ...evidenceDoc,
          fileName: file.name,
          fileUrl: result.secure_url,
          cloudinaryId: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: evidenceData.uploadedBy || 'current-user'
        };
        
        console.log('[CloudinaryService] Adding evidence to array:', fileData);
        
        await updateDoc(auditRef, {
          evidence: [...currentEvidence, fileData],
          evidenceCount: (auditData.evidenceCount || 0) + 1,
          hasEvidence: true,
          lastUpdated: serverTimestamp()
        });
        
        console.log('[CloudinaryService] Evidence added to audit array successfully');
      } else {
        throw new Error('Audit document not found');
      }
      
      // Track file upload
      await addDoc(collection(db, 'file-uploads'), {
        auditId,
        evidenceId: evidenceId,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        cloudinaryPublicId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: evidenceData.uploadedBy || 'current-user',
        uploadedAt: serverTimestamp(),
        status: 'completed',
        storageProvider: 'cloudinary',
        folder: `auditmorowaliutara/file/audits/${auditId}/evidence`,
        canDownload: true,
        canUpdate: true,
        lastAccessed: serverTimestamp()
      });
      
      return {
        id: evidenceId,
        ...evidenceDoc,
        downloadURL: result.secure_url,
        firestoreId: evidenceId
      };
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  },

  // Upload interview recording
  async uploadInterviewRecording(auditId, file, interviewData) {
    try {
      console.log('Starting interview recording upload to Cloudinary...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', `auditmorowaliutara/file/audits/${auditId}/interviews`);
      formData.append('resource_type', 'video');
      formData.append('context', `audit_id=${auditId}|file_type=interview|uploaded_by=${interviewData.uploadedBy || 'current-user'}`);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary upload success:', result);
      
      const interviewDoc = {
        ...interviewData,
        recordingFileName: file.name,
        recordingUrl: result.secure_url,
        recordingId: result.public_id,
        recordingSize: file.size,
        recordingType: file.type,
        cloudinaryId: result.public_id,
        cloudinaryUrl: result.secure_url,
        duration: result.duration,
        uploadedBy: interviewData.uploadedBy || 'current-user',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      };
      
      // Generate unique ID for the interview
      const interviewId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[CloudinaryService] Creating interview in audit array');
      
      // Update audit document dengan file baru (simpan ke array field, BUKAN subcollection)
      const auditRef = doc(db, 'audits', auditId);
      const auditDoc = await getDoc(auditRef);
      if (auditDoc.exists()) {
        const auditData = auditDoc.data();
        const currentInterviews = auditData.interviews || [];
        
        // Add complete file data to audit document array
        const fileData = {
          id: interviewId,
          ...interviewDoc,
          recordingFileName: file.name,
          recordingUrl: result.secure_url,
          cloudinaryId: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: interviewData.uploadedBy || 'current-user'
        };
        
        console.log('[CloudinaryService] Adding interview to array:', fileData);
        
        await updateDoc(auditRef, {
          interviews: [...currentInterviews, fileData],
          interviewsCount: (auditData.interviewsCount || 0) + 1,
          hasInterviews: true,
          lastUpdated: serverTimestamp()
        });
        
        console.log('[CloudinaryService] Interview added to audit array successfully');
      } else {
        throw new Error('Audit document not found');
      }
      
      // Track file upload
      await addDoc(collection(db, 'file-uploads'), {
        auditId,
        interviewId: interviewId,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: interviewData.uploadedBy || 'current-user',
        uploadedAt: serverTimestamp(),
        status: 'completed',
        storageProvider: 'cloudinary',
        folder: `auditmorowaliutara/file/audits/${auditId}/interviews`,
        canDownload: true,
        canUpdate: true,
        lastAccessed: serverTimestamp()
      });
      
      return {
        id: interviewId,
        ...interviewDoc,
        downloadURL: result.secure_url,
        firestoreId: interviewId
      };
    } catch (error) {
      console.error('Error uploading interview recording:', error);
      throw error;
    }
  },

  // Upload general document
  async uploadDocument(file) {
    try {
      console.log('Starting document upload to Cloudinary...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', `auditmorowaliutara/documents`);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary upload success:', result);
      
      return result;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Simple file upload function for general use (logo, profile photos, etc.)
  async uploadFile(file, folder = 'auditmorowaliutara/general') {
    try {
      console.log('Starting file upload to Cloudinary...');
      
      // Validate file
      this.validateFile(file, 10 * 1024 * 1024); // 10MB max for general files
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', folder);
      
      // No transformation parameters for unsigned upload
      // File will be uploaded as-is
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary upload success:', result);
      
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        original_filename: result.original_filename
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload note attachment
  async uploadNoteAttachment(auditId, file, noteData) {
    try {
      console.log('Starting note attachment upload to Cloudinary...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', `auditmorowaliutara/file/audits/${auditId}/notes`);
      formData.append('context', `audit_id=${auditId}|file_type=note|uploaded_by=${noteData.uploadedBy || 'current-user'}`);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary upload success:', result);
      
      const noteDoc = {
        ...noteData,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        attachments: [{
          fileName: file.name,
          fileUrl: result.secure_url,
          fileId: result.public_id,
          cloudinaryId: result.public_id,
          cloudinaryUrl: result.secure_url,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date()
        }],
        uploadedBy: noteData.uploadedBy || 'current-user',
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        storageProvider: 'cloudinary',
        cloudinaryFolder: `auditmorowaliutara/file/audits/${auditId}/notes`,
        downloadUrl: result.secure_url,
        canDownload: true,
        canUpdate: true
      };
      
      console.log('[CloudinaryService] Creating note in audit array:', noteDoc);
      
      // Generate unique ID for the note
      const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Update audit document dengan file baru (simpan ke array field, BUKAN subcollection)
      const auditRef = doc(db, 'audits', auditId);
      const auditDoc = await getDoc(auditRef);
      if (auditDoc.exists()) {
        const auditData = auditDoc.data();
        const currentNotes = auditData.notes || [];
        
        // Add complete file data to audit document array
        const fileData = {
          id: noteId,
          ...noteDoc,
          fileName: file.name,
          fileUrl: result.secure_url,
          cloudinaryId: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: noteData.uploadedBy || 'current-user'
        };
        
        console.log('[CloudinaryService] Adding note to array:', fileData);
        
        await updateDoc(auditRef, {
          notes: [...currentNotes, fileData],
          notesCount: (auditData.notesCount || 0) + 1,
          hasNotes: true,
          lastUpdated: serverTimestamp()
        });
        
        console.log('[CloudinaryService] Note added to audit array successfully');
      } else {
        throw new Error('Audit document not found');
      }
      
      // Track file upload
      await addDoc(collection(db, 'file-uploads'), {
        auditId,
        noteId: noteId,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileId: result.public_id,
        cloudinaryId: result.public_id,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: noteData.uploadedBy || 'current-user',
        uploadedAt: serverTimestamp(),
        status: 'completed',
        storageProvider: 'cloudinary',
        folder: `auditmorowaliutara/file/audits/${auditId}/notes`,
        canDownload: true,
        canUpdate: true,
        lastAccessed: serverTimestamp()
      });
      
      return {
        id: noteId,
        ...noteDoc,
        downloadURL: result.secure_url,
        firestoreId: noteId
      };
    } catch (error) {
      console.error('Error uploading note attachment:', error);
      throw error;
    }
  },

  // Get file download URL dari Firestore
  async getFileDownloadUrl(auditId, fileType, fileId) {
    try {
      let collectionName;
      switch (fileType) {
        case 'workPaper':
          collectionName = 'workPapers';
          break;
        case 'evidence':
          collectionName = 'evidence';
          break;
        case 'interview':
          collectionName = 'interviews';
          break;
        case 'note':
          collectionName = 'notes';
          break;
        default:
          collectionName = 'notes';
          break;
      }
      
      const fileDoc = await getDoc(doc(db, `audits/${auditId}/${collectionName}`, fileId));
      if (!fileDoc.exists()) {
        throw new Error('File not found');
      }
      
      const fileData = fileDoc.data();
      return {
        downloadUrl: fileData.cloudinaryUrl || fileData.fileUrl,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType,
        canDownload: fileData.canDownload !== false,
        cloudinaryId: fileData.cloudinaryId
      };
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  },

  // Update file metadata di Firestore
  async updateFileMetadata(auditId, fileType, fileId, updates) {
    try {
      let collectionName;
      switch (fileType) {
        case 'workPaper':
          collectionName = 'workPapers';
          break;
        case 'evidence':
          collectionName = 'evidence';
          break;
        case 'interview':
          collectionName = 'interviews';
          break;
        case 'note':
          collectionName = 'notes';
          break;
        default:
          collectionName = 'notes';
          break;
      }
      
      const fileRef = doc(db, `audits/${auditId}/${collectionName}`, fileId);
      await updateDoc(fileRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Update file-uploads tracking
      const uploadsQuery = query(
        collection(db, 'file-uploads'),
        where('auditId', '==', auditId),
        where(`${fileType}Id`, '==', fileId)
      );
      const uploadsSnapshot = await getDocs(uploadsQuery);
      if (!uploadsSnapshot.empty) {
        const uploadDoc = uploadsSnapshot.docs[0];
        await updateDoc(uploadDoc.ref, {
          lastUpdated: serverTimestamp(),
          ...updates
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  },

  // Delete file dari Cloudinary dan Firestore (from array fields)
  async deleteFile(auditId, fileType, fileId) {
    try {
      console.log(`[CloudinaryService] Deleting file: ${fileId} from ${fileType}`);
      
      // Get audit document to access array fields
      const auditRef = doc(db, 'audits', auditId);
      const auditDoc = await getDoc(auditRef);
      
      if (!auditDoc.exists()) {
        throw new Error('Audit document not found');
      }
      
      const auditData = auditDoc.data();
      
      // Determine array field name
      let arrayFieldName;
      let countFieldName;
      let hasFieldName;
      switch (fileType) {
        case 'workPaper':
          arrayFieldName = 'workPapers';
          countFieldName = 'workPapersCount';
          hasFieldName = 'hasWorkPapers';
          break;
        case 'evidence':
          arrayFieldName = 'evidence';
          countFieldName = 'evidenceCount';
          hasFieldName = 'hasEvidence';
          break;
        case 'interview':
          arrayFieldName = 'interviews';
          countFieldName = 'interviewsCount';
          hasFieldName = 'hasInterviews';
          break;
        case 'note':
          arrayFieldName = 'notes';
          countFieldName = 'notesCount';
          hasFieldName = 'hasNotes';
          break;
        default:
          throw new Error('Invalid file type');
      }
      
      // Get current files array
      const filesArray = auditData[arrayFieldName] || [];
      
      // Find the file to delete
      const fileData = filesArray.find(f => f.id === fileId);
      if (!fileData) {
        throw new Error('File not found in array');
      }
      
      console.log('[CloudinaryService] File found:', fileData);
      
      const cloudinaryId = fileData.cloudinaryId;
      
      if (cloudinaryId) {
        // Try to delete from Cloudinary using admin API
        try {
          const timestamp = Math.round((new Date()).getTime() / 1000);
          const signature = await this.generateSignature(cloudinaryId, timestamp);
          
          const formData = new FormData();
          formData.append('public_id', cloudinaryId);
          formData.append('signature', signature);
          formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
          formData.append('timestamp', timestamp);
          
          // Try to determine resource type from file extension or use 'auto'
          const fileExtension = cloudinaryId.split('.').pop()?.toLowerCase();
          let resourceType = 'auto';
          
          if (fileExtension) {
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension)) {
              resourceType = 'image';
            } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(fileExtension)) {
              resourceType = 'video';
            } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension)) {
              resourceType = 'video'; // Cloudinary stores audio as video
            } else {
              resourceType = 'raw';
            }
          }
          
          const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/destroy`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.warn('Failed to delete from Cloudinary:', errorData);
            console.warn('Continuing with Firestore deletion only');
          } else {
            console.log('Successfully deleted from Cloudinary');
          }
        } catch (cloudinaryError) {
          console.warn('Error deleting from Cloudinary:', cloudinaryError);
          console.warn('Continuing with Firestore deletion only');
        }
      }
      
      // Remove file from array
      const updatedFilesArray = filesArray.filter(f => f.id !== fileId);
      
      // Prepare update data
      const updateData = {
        [arrayFieldName]: updatedFilesArray,
        [countFieldName]: Math.max(0, (auditData[countFieldName] || 0) - 1),
        [hasFieldName]: updatedFilesArray.length > 0,
        lastUpdated: serverTimestamp()
      };
      
      console.log('[CloudinaryService] Updating audit with:', updateData);
      
      // Update audit document
      await updateDoc(auditRef, updateData);
      
      console.log('[CloudinaryService] File deleted successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Get all files for an audit
  async getAuditFiles(auditId) {
    try {
      console.log(`[CloudinaryService] Getting files for audit: ${auditId}`);
      
      // Get audit document first to read array fields
      const auditRef = doc(db, 'audits', auditId);
      const auditDoc = await getDoc(auditRef);
      
      const files = {
        workPapers: [],
        evidence: [],
        interviews: [],
        notes: []
      };
      
      if (auditDoc.exists()) {
        const auditData = auditDoc.data();
        console.log('[CloudinaryService] Audit document data:', auditData);
        
        // Read from array fields in audit document (NOT subcollections)
        files.workPapers = auditData.workPapers || [];
        files.evidence = auditData.evidence || [];
        files.interviews = auditData.interviews || [];
        files.notes = auditData.notes || [];
        
        console.log('[CloudinaryService] Files from audit document arrays:', {
          workPapers: files.workPapers.length,
          evidence: files.evidence.length,
          interviews: files.interviews.length,
          notes: files.notes.length
        });
        
        // Return early with array data
        return files;
      } else {
        console.warn('[CloudinaryService] Audit document not found:', auditId);
        return files;
      }
    } catch (error) {
      console.error('Error getting audit files:', error);
      throw error;
    }
  },

  // Generate signature for authenticated requests
  async generateSignature(publicId, timestamp) {
    const params = {
      public_id: publicId,
      timestamp: timestamp
    };
    
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
    const signatureString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&') + CLOUDINARY_CONFIG.apiSecret;
    
    return await this.sha1(signatureString);
  },

  // Simple SHA-1 implementation using Web Crypto API
  async sha1(str) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.warn('Web Crypto API not available, using fallback hash');
      // Fallback to simple hash
      let hash = 0;
      if (str.length === 0) return hash.toString();
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  },

  // Validate file before upload
  validateFile(file, maxSize = 50 * 1024 * 1024) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'video/mp4',
      'video/webm',
      'video/ogg'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Please upload a supported file type.');
    }

    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }

    return true;
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file icon based on type
  getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel')) return '📊';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('zip')) return '📦';
    return '📎';
  }
};
