//NextJS
import React from "react";
import Head from "next/head";
import { useChat } from 'ai/react';
import type { Message } from 'ai';

// SEO Data for the space mission AI agent
const seoData = {
  title: "Mission42 - AI Agent for Space Missions",
  description: "Mission42 is an advanced AI agent designed to assist and optimize space missions. Leveraging cutting-edge artificial intelligence to enhance space exploration, mission planning, and spacecraft operations.",
  keywords: "space missions, AI agent, artificial intelligence, space exploration, mission control, spacecraft operations, space technology, Mission42",
  ogImage: "/images/space-mission.jpg",
  ogUrl: "https://mission42.com",
  twitterHandle: "@mission42ai",
};

//Components
import { ChatContent } from "@/components/chat/ChatContent";
import { ChatInput } from "@/components/chat/ChatInput";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/completion',
    onResponse: (response) => {
      // Handle any response processing if needed
      console.log('Response received:', response);
    },
    onFinish: (message: Message) => {
      console.log('Message completed:', message);
    },
    body: {
      // Add any additional parameters needed for the API
    },
  });

  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoData.ogUrl} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={seoData.ogImage} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={seoData.ogUrl} />
        <meta property="twitter:title" content={seoData.title} />
        <meta property="twitter:description" content={seoData.description} />
        <meta property="twitter:image" content={seoData.ogImage} />
        <meta name="twitter:creator" content={seoData.twitterHandle} />

        {/* Additional SEO tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={seoData.ogUrl} />
      </Head>
      <main className="flex flex-col h-screen">
        <div className="flex-1 flex flex-col">
          <ChatContent 
            messages={messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date()
            }))} 
            isLoading={isLoading}
          />
          <ChatInput 
            onSendMessage={(message: string) => {
              handleSubmit(new Event('submit') as any);
            }}
            isLoading={isLoading}
            message={input}
            onMessageChange={handleInputChange}
          />
        </div>
      </main>
    </>
  );
}
