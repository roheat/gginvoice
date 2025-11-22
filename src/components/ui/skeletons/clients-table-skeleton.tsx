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

interface ClientsTableSkeletonProps {
  rows?: number;
}

export function ClientsTableSkeleton({ rows = 8 }: ClientsTableSkeletonProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Name */}
                <TableCell className="font-medium">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Email */}
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                {/* Address */}
                <TableCell>
                  <Skeleton className="h-4 w-56" />
                </TableCell>
                {/* Phone */}
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {/* Created */}
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {/* Actions - two buttons side by side */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0">
                    <Skeleton className="h-8 w-16 rounded-l-md rounded-r-none" />
                    <Skeleton className="h-8 w-20 rounded-r-md rounded-l-none" />
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

