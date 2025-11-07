import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileX, ArrowLeft } from "lucide-react";

export default function InvoiceNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FileX className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invoice Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The invoice you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact the invoice
                sender.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
