//NextJS
import React, { useCallback } from "react";
import Head from "next/head";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";

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
import ChatHeader from "@/components/chat/ChatHeader";
import { useChatState } from "@/hooks/useChatState";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChatState();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log("Particles container loaded", container);
  }, []);

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleInputChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e as any);
  };

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

      <main className="flex flex-col h-screen relative">
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: {
              color: {
                value: "#000000",
              },
            },
            fpsLimit: 120,
            particles: {
              color: {
                value: "#ffffff",
              },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1,
              },
              move: {
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: true,
                speed: 1,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 80,
              },
              opacity: {
                value: 0.5,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 3 },
              },
            },
            detectRetina: true,
          }}
          className="absolute inset-0 -z-10"
        />
        <div className={"w-full flex-1 flex flex-col items-center align-center justify-center align-center"}>
          <ChatHeader />
          <div className="max-w-6xl w-full">
            <ChatContent 
              messages={messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: msg.role === 'user' ? 'user' : 'assistant',
                timestamp: new Date(msg.createdAt)
              }))} 
              isLoading={isLoading}
            />
            <ChatInput 
              onSendMessage={(message: string) => {
                handleSubmit(new Event('submit') as any);
              }}
              isLoading={isLoading}
              message={input}
              onMessageChange={handleInputChangeWrapper}
              onClearChat={handleClearChat}
            />
          </div>
        </div>
      </main>
    </>
  );
}
