//NextJS
import { Button, Textarea } from "@heroui/react";

//Icons
import { LuSend } from "react-icons/lu";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearChat: () => void;
}

export const ChatInput = ({ onSendMessage, isLoading = false, message, onMessageChange, onClearChat }: ChatInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-6xl fixed bottom-5 z-40 flex gap-2 p-4">
      <Textarea
        variant={"bordered"}
        value={message}
        onChange={onMessageChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="bg-default-100 rounded-2xl"
        disabled={isLoading}
        endContent={
          <div className={"space-x-2 flex items-center align-center justify-center"}>
          <Button
            onPress={onClearChat}
            size={"sm"}
            className="bg-default-200 text-default-900"
          >
            Clear
          </Button>
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            isIconOnly
            size={"sm"}
            className={`${!message.trim() || isLoading ? 'bg-default-200' : 'bg-default-900'} text-default-100`}
            startContent={<LuSend size={16} />}
          />
          </div>
        }
      />
    </form>
  );
};
