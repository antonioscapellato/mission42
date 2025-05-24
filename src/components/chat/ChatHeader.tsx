
import React from 'react';

import { Image } from '@heroui/react';

const ChatHeader = () => {
  return (
    <div className="w-full bg-oapcity-50 backdrop-blur-md fixed right-0 top-0 z-40 flex items-center p-4">
      {/* Assuming mission42.png is in the public directory */}
      <Image src="/mission42.png" alt="Mission 42 Logo" className="h-8 w-8 mr-2" radius={"sm"} />
      <h1 className="text-lg font-light text-default-500">Mission42</h1>
    </div>
  );
};

export default ChatHeader; 