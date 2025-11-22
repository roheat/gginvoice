import { Skeleton } from "../skeleton";
import { Card, CardContent } from "../card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

interface InvoiceTableSkeletonProps {
  rows?: number;
}

export function InvoiceTableSkeleton({ rows = 8 }: InvoiceTableSkeletonProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Invoice # */}
                <TableCell className="font-medium">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {/* Client */}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Date */}
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {/* Status - pill-shaped badge */}
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                {/* Total */}
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                {/* Actions - two buttons side by side */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0">
                    <Skeleton className="h-8 w-16 rounded-l-md rounded-r-none" />
                    <Skeleton className="h-8 w-16 rounded-r-md rounded-l-none" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

