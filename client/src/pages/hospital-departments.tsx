import HospitalLayout from "@/components/layout/HospitalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function HospitalDepartments() {
  return (
    <HospitalLayout title="Departments">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage your hospital's departments
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-2">Department management coming soon</p>
            <p className="text-sm text-gray-400 text-center">
              You'll be able to add and manage hospital departments here
            </p>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
