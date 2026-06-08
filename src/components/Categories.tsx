
"use client"
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS, CATEGORIES } from '@/app/lib/menu-data';

export const Categories = () => {
  const router = useRouter();

  // Find a representative image from MENU_ITEMS for each category
  const categoryItems = CATEGORIES.filter(c => c !== 'All').map(cat => {
    const item = MENU_ITEMS.find(i => i.category === cat);
    return {
      name: cat,
      img: item?.imageUrl || `https://picsum.photos/seed/${cat}/200`
    };
  });

  return (
    <div className="flex overflow-x-auto gap-5 md:gap-8 pb-4 pt-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {categoryItems.map((item, idx) => (
        <button 
          key={idx} 
          onClick={() => {
            const section = document.getElementById(`section-${item.name}`);
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              router.push(`/menu?q=${item.name}`);
            }
          }}
          className="flex flex-col items-center gap-2 shrink-0 group perspective-1000"
        >
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white dark:bg-zinc-900 shadow-xl group-hover:shadow-2xl transition-all duration-500 overflow-hidden relative border-2 border-transparent group-hover:border-primary/40 group-active:scale-90">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors z-10" />
            <div className="relative w-full h-full transform group-hover:scale-110 transition-transform duration-700">
              <Image 
                src={item.img} 
                alt={item.name} 
                fill 
                className="object-cover" 
                unoptimized
              />
            </div>
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
};
