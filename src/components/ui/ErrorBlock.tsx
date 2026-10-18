import { FC } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorBlockProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorBlock: FC<ErrorBlockProps> = ({
  title = "An error occurred",
  message,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="flex items-center justify-center min-h-[300px]"
    >
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-red-900 mb-2">{title}</h2>
        <p className="text-red-700 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
