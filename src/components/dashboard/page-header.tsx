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
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{title}</div>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {action && (
              <Button
                onClick={action.onClick}
                className="bg-blue-600 hover:bg-blue-700"
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
