"use client"
import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import placeholderData from '@/app/lib/placeholder-images.json';

const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

const CATEGORY_ITEMS = [
  { name: 'Burger', img: getImg('cat-burger') },
  { name: 'Pizza', img: getImg('cat-pizza') },
  { name: 'Biryani', img: getImg('cat-biryani') },
  { name: 'Chicken', img: getImg('cat-chicken') },
  { name: 'Snacks', img: getImg('cat-snacks') },
  { name: 'Desserts', img: getImg('cat-desserts') },
  { name: 'Drinks', img: getImg('cat-drinks') }
];

export const Categories = () => {
  return (
    <div className="flex overflow-x-auto gap-4 md:gap-8 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {CATEGORY_ITEMS.map((item, idx) => (
        <button 
          key={idx} 
          className="flex flex-col items-center gap-3 shrink-0 group perspective-1000"
        >
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white dark:bg-zinc-900 shadow-soft group-hover:shadow-xl transition-all duration-500 overflow-hidden relative border-2 border-transparent group-hover:border-primary/20">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div className="relative w-full h-full transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
              <Image 
                src={item.img} 
                alt={item.name} 
                fill 
                className="object-contain p-3 md:p-5" 
                unoptimized
              />
            </div>
          </div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
};