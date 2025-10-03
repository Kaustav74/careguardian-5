import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import HospitalLayout from "@/components/layout/HospitalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function HospitalSettings() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/user/delete", "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your hospital account has been permanently deleted.",
      });
      logoutMutation.mutate();
      navigate("/auth");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  return (
    <HospitalLayout title="Settings">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your hospital account settings
          </p>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your hospital account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Hospital Name</label>
              <p className="mt-1 text-sm text-gray-900">{user?.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
            </div>
            {user?.phoneNumber && (
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <p className="mt-1 text-sm text-gray-900">{user.phoneNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Delete Hospital Account</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Permanently delete your hospital account, all doctors, and associated data. This action cannot be undone.
                </p>
              </div>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="ml-4" data-testid="button-delete-account">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        This action cannot be undone. This will permanently delete your hospital account and remove all associated data including:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>All doctors and their information</li>
                        <li>Hospital profile and settings</li>
                        <li>Home visit assignments</li>
                        <li>All historical data</li>
                      </ul>
                      <p className="font-semibold text-red-600 mt-4">
                        This action is permanent and cannot be reversed.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteAccountMutation.isPending}
                      data-testid="button-confirm-delete"
                    >
                      {deleteAccountMutation.isPending ? "Deleting..." : "Yes, Delete My Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
