import { FC, useState } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/solid";

export const ChatWidget: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 end-0 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 dark:shadow-gray-900/50">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🌷</span>
              </div>
              <div>
                <h3 className="font-semibold">Wardity Support</h3>
                <p className="text-xs text-white/80">
                  We typically reply instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close support chat"
              className="min-h-11 min-w-11 rounded-full p-2 hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* Welcome Message */}
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🌷</span>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm dark:shadow-gray-900/50 max-w-[80%]">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Hi there! 👋 Welcome to Wardity. How can I help you today?
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary transition-colors">
                Custom arrangements
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                aria-label="Type your support message"
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        aria-expanded={isOpen}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg dark:shadow-gray-900/50 transition-all duration-300 ${
          isOpen
            ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-0"
            : "bg-primary text-white hover:bg-primary-600 hover:scale-110"
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
