import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadStaffImage(staffId: string, file: File): Promise<string> {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `staffImages/${staffId}/${Date.now()}_${safeFileName}`;
    const storageRef = ref(storage, filePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
    });
    
    // Get the public URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return downloadUrl;
}

export async function uploadLocationQrCode(locationId: string, file: File): Promise<string> {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `locationQrCodes/${locationId}/${Date.now()}_${safeFileName}`;
    const storageRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
    });
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return downloadUrl;
}
