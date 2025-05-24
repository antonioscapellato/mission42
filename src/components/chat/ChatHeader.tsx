import React from 'react';
import { Image } from '@heroui/react';
import { ThemeSwitcher } from '../utils/ThemeSwitcher';

const ChatHeader = () => {
  return (
    <div className="w-full bg-oapcity-50 backdrop-blur-md fixed right-0 top-0 z-40 flex items-center justify-between p-4">
      <div className="flex items-center">
        <Image src="/mission42.png" alt="Mission 42 Logo" className="h-8 w-8 mr-2" radius={"sm"} />
        <h1 className="text-lg font-light text-default-500">Mission42</h1>
      </div>
      <ThemeSwitcher />
    </div>
  );
};

export default ChatHeader; 