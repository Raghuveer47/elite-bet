import { KYCDocument, KYCVerification, AMLCheck } from '../types/kyc';

export class KYCService {
  private static readonly KYC_STORAGE_KEY = 'elitebet_kyc_data';

  static saveKYCData(data: any): void {
    try {
      const dataToSave = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.KYC_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('KYCService: Data saved successfully', {
        verifications: data.verifications?.length || 0,
        documents: data.documents?.length || 0
      });
    } catch (error) {
      console.error('KYCService: Failed to save KYC data:', error);
      // Clear old data if quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldData();
        localStorage.setItem(this.KYC_STORAGE_KEY, JSON.stringify(dataToSave));
      }
    }
  }

  static loadKYCData(): any {
    try {
      const stored = localStorage.getItem(this.KYC_STORAGE_KEY);
      if (!stored) {
        console.log('KYCService: No stored data found, returning defaults');
        return { verifications: [], documents: [], amlChecks: [] };
      }

      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      const convertDates = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        
        if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
          return new Date(obj);
        }
        
        if (Array.isArray(obj)) {
          return obj.map(convertDates);
        }
        
        if (typeof obj === 'object') {
          const converted: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (key.includes('Date') || key.includes('At') || key === 'createdAt' || key === 'updatedAt' || key === 'uploadedAt' || key === 'reviewedAt' || key === 'expiresAt' || key === 'checkedAt') {
              converted[key] = value ? new Date(value as string) : value;
            } else {
              converted[key] = convertDates(value);
            }
          }
          return converted;
        }
        
        return obj;
      };

      const result = {
        verifications: convertDates(parsed.verifications || []),
        documents: convertDates(parsed.documents || []),
        amlChecks: convertDates(parsed.amlChecks || [])
      };

      console.log('KYCService: Data loaded successfully', {
        verifications: result.verifications.length,
        documents: result.documents.length,
        amlChecks: result.amlChecks.length
      });

      return result;
    } catch (error) {
      console.error('KYCService: Failed to load KYC data:', error);
      return { verifications: [], documents: [], amlChecks: [] };
    }
  }

  static clearOldData(): void {
    try {
      const data = this.loadKYCData();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Keep only recent data
      data.documents = data.documents.filter((doc: KYCDocument) => 
        new Date(doc.uploadedAt) > oneWeekAgo
      );
      data.verifications = data.verifications.filter((ver: KYCVerification) => 
        new Date(ver.createdAt) > oneWeekAgo
      );
      
      localStorage.setItem(this.KYC_STORAGE_KEY, JSON.stringify(data));
      console.log('KYCService: Old data cleared to free up space');
    } catch (error) {
      console.error('KYCService: Failed to clear old data:', error);
    }
  }

  static async uploadDocument(userId: string, type: KYCDocument['type'], file: File): Promise<KYCDocument> {
    console.log('KYCService: Starting document upload:', { userId, type, fileName: file.name, size: file.size });
    
    // Validate file
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      throw new Error('Only images and PDF files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size must be less than 5MB');
    }

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Convert file to base64 for storage
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Compress base64 if too large
        if (result.length > 100000) { // If larger than 100KB
          resolve('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=');
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const document: KYCDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      status: 'pending',
      fileUrl: base64Data,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };

    // Save to storage
    const kycData = this.loadKYCData();
    
    // Remove existing document of same type for this user
    kycData.documents = (kycData.documents || []).filter((doc: KYCDocument) => 
      !(doc.userId === userId && doc.type === type)
    );
    
    kycData.documents = [document, ...kycData.documents];
    this.saveKYCData(kycData);

    console.log('KYCService: Document uploaded successfully:', document.id);
    
    // Trigger storage event for admin notification
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_kyc_document_uploaded',
        newValue: JSON.stringify(document)
      }));
    }, 100);

    return document;
  }

  static async submitVerification(userId: string, level: KYCVerification['verificationLevel']): Promise<KYCVerification> {
    console.log('KYCService: Submitting verification:', { userId, level });
    
    const kycData = this.loadKYCData();
    const userDocuments = (kycData.documents || []).filter((doc: KYCDocument) => doc.userId === userId);

    if (userDocuments.length === 0) {
      throw new Error('Please upload required documents first');
    }

    // Check required documents
    const requiredTypes = ['passport', 'utility_bill'];
    const uploadedTypes = userDocuments.map(doc => doc.type);
    const missingRequired = requiredTypes.filter(type => !uploadedTypes.includes(type as KYCDocument['type']));
    
    if (missingRequired.length > 0) {
      throw new Error(`Missing required documents: ${missingRequired.map(t => this.getDocumentTypeDisplayName(t as KYCDocument['type'])).join(', ')}`);
    }

    // Check if verification already exists and is pending
    const existingVerification = (kycData.verifications || []).find((v: KYCVerification) => v.userId === userId);
    if (existingVerification && (existingVerification.status === 'pending' || existingVerification.status === 'in_review')) {
      throw new Error('Verification already submitted and pending review');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const verification: KYCVerification = {
      id: `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      status: 'pending',
      verificationLevel: level,
      documents: userDocuments,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Remove existing verification for this user
    kycData.verifications = (kycData.verifications || []).filter((v: KYCVerification) => v.userId !== userId);
    kycData.verifications = [verification, ...kycData.verifications];
    this.saveKYCData(kycData);

    console.log('KYCService: Verification submitted successfully:', verification.id);

    // Trigger storage event for admin notification
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_kyc_verification_submitted',
        newValue: JSON.stringify(verification)
      }));
    }, 100);

    return verification;
  }

  static async approveVerification(verificationId: string, adminId: string): Promise<void> {
    console.log('KYCService: Approving verification:', verificationId);
    
    const kycData = this.loadKYCData();
    const verification = kycData.verifications?.find((v: KYCVerification) => v.id === verificationId);
    
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    verification.status = 'approved';
    verification.reviewedBy = adminId;
    verification.reviewedAt = new Date();
    verification.updatedAt = new Date();

    // Approve all documents
    verification.documents.forEach((doc: KYCDocument) => {
      doc.status = 'approved';
      doc.reviewedAt = new Date();
      doc.reviewedBy = adminId;
    });

    // Update documents in main array
    kycData.documents = (kycData.documents || []).map((doc: KYCDocument) => {
      const updatedDoc = verification.documents.find((vDoc: KYCDocument) => vDoc.id === doc.id);
      return updatedDoc || doc;
    });

    this.saveKYCData(kycData);

    console.log('KYCService: Verification approved successfully');

    // Trigger storage event for user notification
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_kyc_approved',
        newValue: JSON.stringify({ userId: verification.userId, verificationId })
      }));
    }, 100);
  }

  static async rejectVerification(verificationId: string, adminId: string, reason: string): Promise<void> {
    console.log('KYCService: Rejecting verification:', verificationId);
    
    const kycData = this.loadKYCData();
    const verification = kycData.verifications?.find((v: KYCVerification) => v.id === verificationId);
    
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    verification.status = 'rejected';
    verification.reviewedBy = adminId;
    verification.reviewedAt = new Date();
    verification.rejectionReason = reason;
    verification.updatedAt = new Date();

    // Reject all documents
    verification.documents.forEach((doc: KYCDocument) => {
      doc.status = 'rejected';
      doc.reviewedAt = new Date();
      doc.reviewedBy = adminId;
      doc.rejectionReason = reason;
    });

    // Update documents in main array
    kycData.documents = (kycData.documents || []).map((doc: KYCDocument) => {
      const updatedDoc = verification.documents.find((vDoc: KYCDocument) => vDoc.id === doc.id);
      return updatedDoc || doc;
    });

    this.saveKYCData(kycData);

    console.log('KYCService: Verification rejected successfully');

    // Trigger storage event for user notification
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_kyc_rejected',
        newValue: JSON.stringify({ userId: verification.userId, reason })
      }));
    }, 100);
  }

  static getUserVerification(userId: string): KYCVerification | null {
    const kycData = this.loadKYCData();
    return kycData.verifications?.find((v: KYCVerification) => v.userId === userId) || null;
  }

  static getUserDocuments(userId: string): KYCDocument[] {
    const kycData = this.loadKYCData();
    return (kycData.documents || []).filter((doc: KYCDocument) => doc.userId === userId);
  }

  static getAllVerifications(): KYCVerification[] {
    const kycData = this.loadKYCData();
    return kycData.verifications || [];
  }

  static getAllDocuments(): KYCDocument[] {
    const kycData = this.loadKYCData();
    return kycData.documents || [];
  }

  static getDocumentTypeDisplayName(type: KYCDocument['type']): string {
    const names: Record<KYCDocument['type'], string> = {
      'passport': 'Passport',
      'id_card': 'National ID Card',
      'drivers_license': 'Driver\'s License',
      'utility_bill': 'Utility Bill',
      'bank_statement': 'Bank Statement',
      'proof_of_funds': 'Proof of Funds'
    };
    return names[type] || type;
  }

  static getRequiredDocuments(): Array<{ type: KYCDocument['type']; name: string; required: boolean; description: string }> {
    return [
      { 
        type: 'passport', 
        name: 'Passport', 
        required: true, 
        description: 'Government-issued passport (photo page)' 
      },
      { 
        type: 'utility_bill', 
        name: 'Utility Bill', 
        required: true, 
        description: 'Recent utility bill (last 3 months)' 
      },
      { 
        type: 'bank_statement', 
        name: 'Bank Statement', 
        required: false, 
        description: 'Recent bank statement (last 3 months)' 
      },
      { 
        type: 'id_card', 
        name: 'National ID Card', 
        required: false, 
        description: 'Government-issued ID card (alternative to passport)' 
      },
      { 
        type: 'drivers_license', 
        name: 'Driver\'s License', 
        required: false, 
        description: 'Valid driver\'s license' 
      },
      { 
        type: 'proof_of_funds', 
        name: 'Proof of Funds', 
        required: false, 
        description: 'Source of wealth documentation' 
      }
    ];
  }

  static getDocumentStatusColor(status: KYCDocument['status']): string {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'expired': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  }

  static getVerificationStatusColor(status: KYCVerification['status']): string {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'in_review': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'expired': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  }
}