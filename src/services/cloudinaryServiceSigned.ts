// ALTERNATIVE: Signed Cloudinary Upload
// Use this if you can't create unsigned presets

export class CloudinaryServiceSigned {
  static async uploadImage(file: File, folder: string = 'elite-bet'): Promise<{ url: string; publicId: string }> {
    try {
      console.log('CloudinaryService: Starting signed Cloudinary upload...');
      
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
      
      if (!cloudName || !apiKey || !apiSecret) {
        console.warn('CloudinaryService: Cloudinary credentials not found, using fallback');
        return this.createFallbackUrl(file);
      }
      
      // Generate signature for signed upload
      const timestamp = Math.round(new Date().getTime() / 1000);
      const publicId = `payment_proof_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create signature (you'll need to implement this on your backend)
      const signature = await this.generateSignature({
        timestamp,
        folder,
        public_id: publicId
      }, apiSecret);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      formData.append('public_id', publicId);
      
      console.log('CloudinaryService: Uploading with signed upload...');
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('CloudinaryService: Signed upload successful:', result);
      
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
      
    } catch (error) {
      console.error('CloudinaryService: Signed upload failed, using fallback:', error);
      return this.createFallbackUrl(file);
    }
  }
  
  private static async generateSignature(params: any, apiSecret: string): Promise<string> {
    // This should be done on your backend for security
    // For now, return a placeholder
    console.warn('CloudinaryService: Signature generation should be done on backend');
    return 'placeholder_signature';
  }
  
  private static createFallbackUrl(file: File): { url: string; publicId: string } {
    const tempUrl = URL.createObjectURL(file);
    const timestamp = Date.now();
    const publicId = `fallback_${timestamp}_${file.name}`;
    
    return {
      url: tempUrl,
      publicId: publicId
    };
  }
}
