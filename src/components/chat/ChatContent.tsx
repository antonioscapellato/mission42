import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatContentProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatContent = ({ messages, isLoading }: ChatContentProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.sender === "user"
                ? "bg-default-900 text-white"
                : "bg-default-100 text-default-900"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <span className="text-xs opacity-70 mt-1 block">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-default-100 rounded-lg p-3">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-default-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-default-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-default-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
