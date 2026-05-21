
"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton = () => {
  const handleWhatsApp = () => {
    window.open('https://wa.me/918639366800?text=Hi! I want to order from Ezzy Bites.', '_blank');
  };

  return (
    <Button
      onClick={handleWhatsApp}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-2xl z-[60] p-0 flex items-center justify-center animate-bounce duration-[2000ms]"
    >
      <MessageCircle className="w-8 h-8 fill-white" />
    </Button>
  );
};
