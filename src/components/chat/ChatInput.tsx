//NextJS
import { useState } from "react";

//Icons
import { LuSend } from "react-icons/lu";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ChatInput = ({ onSendMessage, isLoading = false, message, onMessageChange }: ChatInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <textarea
        value={message}
        onChange={onMessageChange}
        placeholder="Type your message..."
        className="flex-1 min-h-[60px] resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Send</span>
            <LuSend className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};
