import { FC } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorBlockProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorBlock: FC<ErrorBlockProps> = ({
  title = "Unable to complete request",
  message,
  onRetry,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30"
      >
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        <div className="min-w-0">
          <h2 className="font-semibold text-red-900 dark:text-red-200">{title}</h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

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
