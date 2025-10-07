import React from 'react';
import { PromotionsList } from '../components/promotions/PromotionsList';

export function PromotionsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <PromotionsList />
      </div>
    </div>
  );
}