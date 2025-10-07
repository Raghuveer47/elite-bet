export interface KYCDocument {
  id: string;
  userId: string;
  type: 'passport' | 'id_card' | 'drivers_license' | 'utility_bill' | 'bank_statement' | 'proof_of_funds';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  expiresAt?: Date;
}

export interface KYCVerification {
  id: string;
  userId: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  verificationLevel: 'basic' | 'enhanced' | 'full';
  documents: KYCDocument[];
  provider?: string;
  providerReference?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface AMLCheck {
  id: string;
  userId: string;
  type: 'pep' | 'sanctions' | 'adverse_media' | 'source_of_funds';
  status: 'clear' | 'flagged' | 'investigating';
  provider: string;
  reference: string;
  details?: Record<string, any>;
  checkedAt: Date;
}