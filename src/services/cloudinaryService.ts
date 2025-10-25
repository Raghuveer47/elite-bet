export class CloudinaryService {
  static async uploadImage(file: File, folder: string = 'elite-bet'): Promise<{ url: string; publicId: string }> {
    try {
      console.log('CloudinaryService: Starting real Cloudinary upload...');
      
      // Check if Cloudinary credentials are available
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
      
      if (!cloudName || !apiKey) {
        console.warn('CloudinaryService: Cloudinary credentials not found, using fallback');
        return this.createFallbackUrl(file);
      }
      
      // Try unsigned upload first (requires preset)
      const presetNames = ['ml_default', 'unsigned', 'default', 'elite-bet', 'public'];
      let uploadSuccess = false;
      let result = null;
      
      for (const presetName of presetNames) {
        try {
          console.log(`CloudinaryService: Trying unsigned preset: ${presetName}`);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', presetName);
          formData.append('folder', folder);
          formData.append('public_id', `payment_proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
          
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            result = await response.json();
            console.log(`CloudinaryService: Upload successful with preset "${presetName}":`, result);
            uploadSuccess = true;
            break;
          } else {
            console.log(`CloudinaryService: Preset "${presetName}" failed:`, response.status);
          }
        } catch (error) {
          console.log(`CloudinaryService: Preset "${presetName}" error:`, error.message);
        }
      }
      
      // If unsigned upload failed, try signed upload (no preset needed)
      if (!uploadSuccess) {
        console.log('CloudinaryService: All presets failed, trying signed upload...');
        
        try {
          const timestamp = Math.round(new Date().getTime() / 1000);
          const publicId = `payment_proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Create signature for signed upload (include folder parameter)
          const signature = await this.createSignature(publicId, timestamp, folder);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('public_id', publicId);
          formData.append('timestamp', timestamp.toString());
          formData.append('signature', signature);
          formData.append('api_key', apiKey);
          formData.append('folder', folder);
          
          console.log('CloudinaryService: Signed upload data:', {
            publicId,
            timestamp,
            signature,
            apiKey,
            folder
          });
          
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            result = await response.json();
            console.log('CloudinaryService: Signed upload successful:', result);
            uploadSuccess = true;
          } else {
            const errorText = await response.text();
            console.log('CloudinaryService: Signed upload failed:', response.status, errorText);
          }
        } catch (error) {
          console.log('CloudinaryService: Signed upload error:', error.message);
        }
      }
      
      if (!uploadSuccess) {
        throw new Error('All upload methods failed');
      }
      
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
      
    } catch (error) {
      console.error('CloudinaryService: Upload failed, using fallback:', error);
      return this.createFallbackUrl(file);
    }
  }
  
  private static async createSignature(publicId: string, timestamp: number, folder?: string): Promise<string> {
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      throw new Error('Cloudinary API secret not found');
    }
    
    // Create signature string - parameters must be sorted alphabetically
    let signatureString = `public_id=${publicId}&timestamp=${timestamp}`;
    if (folder) {
      signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    }
    signatureString += apiSecret;
    
    console.log('CloudinaryService: Creating signature for:', signatureString);
    
    // Hash the signature string using SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('CloudinaryService: Generated signature:', hashHex);
    
    return hashHex;
  }

  private static createFallbackUrl(file: File): { url: string; publicId: string } {
    console.log('CloudinaryService: Creating fallback URL...');
    
    // Create a temporary URL as fallback
    const tempUrl = URL.createObjectURL(file);
    const timestamp = Date.now();
    const publicId = `fallback_${timestamp}_${file.name}`;
    
    console.log('CloudinaryService: Created fallback URL:', tempUrl);
    
    return {
      url: tempUrl,
      publicId: publicId
    };
  }

  static getImageUrl(publicId: string, transformations?: any): string {
    // If it's a blob URL, return as-is
    if (publicId.startsWith('blob:') || publicId.startsWith('fallback_')) {
      return publicId;
    }
    
    // If it's a real Cloudinary public ID, construct the URL
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
      const transformString = transformations ? `/${transformations}` : '';
      return `${baseUrl}${transformString}/${publicId}`;
    }
    
    // Fallback
    return `https://via.placeholder.com/400x300?text=${publicId}`;
  }
}
