import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{title}</div>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {action && (
              <Button
                onClick={action.onClick}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
