//NextJS
import { Button, Textarea } from "@heroui/react";
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
      <Textarea
        value={message}
        onChange={onMessageChange}
        placeholder="Type your message..."
        className=""
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={!message.trim() || isLoading}
        isLoading={isLoading}
        isIconOnly
        className={""}
        startContent={<LuSend size={24} />}
      />
    </form>
  );
};
