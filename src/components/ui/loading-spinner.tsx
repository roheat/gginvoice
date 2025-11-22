import { Loader2 } from "lucide-react";
import Image from "next/image";

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <Image
            src="/logo-primary.svg"
            alt="gginvoice"
            fill
            className="object-contain"
          />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    </div>
  );
}
