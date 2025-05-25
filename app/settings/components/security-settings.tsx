'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, Shield, AlertTriangle, Clock } from 'lucide-react';
import { DeleteAccountModal } from './delete-account-modal';

interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({ userId }: SecuritySettingsProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Mock user name - in real app this would come from props or context
  const userName = 'Benjamin Urra';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Aquí iría la lógica para cambiar la contraseña
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular cambio
      toast.success('Contraseña actualizada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Aquí iría la lógica real para eliminar la cuenta
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular eliminación
    toast.success('Account deletion request submitted');
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Verificar si todos los campos están completos
  const isFormValid = () => {
    return (
      passwordForm.currentPassword.trim() !== '' &&
      passwordForm.newPassword.trim() !== '' &&
      passwordForm.confirmPassword.trim() !== ''
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Security Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account security, password, and authentication settings
        </p>
      </div>

      {/* Security Overview */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Shield className="size-5" />
            <CardTitle className="text-lg">Security Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Status */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Badge variant="default" className="bg-green-600">
                  secure
                </Badge>
                <span className="text-sm font-medium">Account Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account is protected with secure authentication
              </p>
            </div>

            {/* Last Password Change */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Last Password Change
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                2024-03-15 14:30:00 UTC
              </p>
            </div>

            {/* Two-Factor Status */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">not enabled</Badge>
                <span className="text-sm font-medium">Two-Factor Auth</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Key className="size-5" />
            <CardTitle className="text-lg">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-3">
              <Label htmlFor="current-password" className="text-sm font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter your current password"
                  className="font-mono pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* New Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    className="font-mono pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    className="font-mono pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Password Requirements
              </Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• At least 8 characters long</p>
                <p>• Mix of uppercase and lowercase letters</p>
                <p>• At least one number</p>
                <p>• At least one special character</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="submit" disabled={isLoading || !isFormValid()}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Shield className="size-5" />
            <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            <Badge variant="outline" className="text-xs">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by enabling
              two-factor authentication. This feature will be available soon.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="size-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📱</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Authenticator App</p>
                    <p className="text-xs text-muted-foreground">
                      Use Google Authenticator or similar
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="size-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-sm">💬</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">SMS Verification</p>
                    <p className="text-xs text-muted-foreground">
                      Receive codes via text message
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" disabled>
              Enable Two-Factor Authentication
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="size-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">
              Danger Zone
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Request Account Deletion
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deleting your account is permanent and cannot be undone. Your
                data will be deleted within 30 days, except we may retain some
                metadata and logs for longer where required or permitted by law.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                What will be deleted:
              </Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• All your conversations and chat history</p>
                <p>• Personal preferences and settings</p>
                <p>• Connected account integrations</p>
                <p>• Profile information and user data</p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              disabled={isLoading}
            >
              Request Account Deletion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userName={userName}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
