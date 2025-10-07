import React from 'react';
import { SupportCenter } from '../components/support/SupportCenter';

export function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-slate-400">Get help with your account, payments, and betting questions</p>
        </div>
        
        <SupportCenter />
      </div>
    </div>
  );
}