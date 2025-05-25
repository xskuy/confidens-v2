'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { updateProfile } from '../actions';

interface ProfileSettingsProps {
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    bio: '',
    workFunction: '',
    confidensPreferences: '',
  });

  const workFunctions = [
    'Marketing Engineer',
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'Designer',
    'DevOps Engineer',
    'Sales Engineer',
    'Technical Writer',
    'QA Engineer',
    'Engineering Manager',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.id) {
      toast.error('Error: ID de usuario no disponible');
      return;
    }

    setIsLoading(true);

    try {
      await updateProfile({
        userId: user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        bio: formData.bio,
        workFunction: formData.workFunction,
        confidensPreferences: formData.confidensPreferences,
      });

      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      {/* User Information */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User ID */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">User ID</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1 flex items-center space-x-4">
                <Badge variant="outline" className="text-xs shrink-0">
                  primary
                </Badge>
                <code className="flex-1 font-mono text-sm text-muted-foreground min-w-0 break-all">
                  {showUserId
                    ? user.id || 'N/A'
                    : '••••••••-••••-••••-••••-••••••••••••'}
                </code>
              </div>
              <div className="flex space-x-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserId(!showUserId)}
                >
                  {showUserId ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  {showUserId ? 'Hide' : 'Reveal'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.id || '', 'User ID')}
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your unique identifier for this account. This ID is used
              internally by Confidens.
            </p>
          </div>

          <Separator />

          {/* Email */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Email Address</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1 flex items-center space-x-4">
                <Badge variant="secondary" className="text-xs shrink-0">
                  contact
                </Badge>
                <span className="flex-1 text-sm text-foreground font-mono min-w-0 break-all">
                  {user.email || 'N/A'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(user.email || '', 'Email')}
                className="shrink-0"
              >
                <Copy className="size-4" />
                Copy
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Primary email address for your account and notifications.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Names */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Benjamin"
                  className="font-mono"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Urra"
                  className="font-mono"
                />
              </div>

              {/* Work Function */}
              <div className="space-y-3">
                <Label htmlFor="workFunction" className="text-sm font-medium">
                  Work Function
                </Label>
                <Select
                  value={formData.workFunction}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      workFunction: value,
                    }))
                  }
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select your work function" />
                  </SelectTrigger>
                  <SelectContent>
                    {workFunctions.map((func) => (
                      <SelectItem key={func} value={func}>
                        {func}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">
                This helps us customize your experience and provide relevant
                suggestions based on your role and preferences.
              </p>
            </div>

            <Separator />

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">AI Preferences</CardTitle>
            <Badge variant="secondary" className="text-xs">
              BETA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-3">
              <Label
                htmlFor="confidensPreferences"
                className="text-sm font-medium"
              >
                What personal preferences should Confidens consider in
                responses?
              </Label>
              <Textarea
                id="confidensPreferences"
                value={formData.confidensPreferences}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confidensPreferences: e.target.value,
                  }))
                }
                placeholder="e.g. keep explanations brief and to the point"
                className="min-h-[140px] resize-none font-mono text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Guidelines</Label>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Your preferences will apply to all conversations, within
                    Confidens&apos;s guidelines.
                  </p>
                  <a
                    href="https://docs.anthropic.com/claude/docs/preferences"
                    className="underline inline-flex items-center gap-1 text-primary hover:text-primary/80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn about preferences
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="size-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg
                  className="size-4 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs bg-green-600">
                    connected
                  </Badge>
                  <span className="font-medium text-sm">GitHub</span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  xskuy •••••••••••••
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="size-4" />
              Manage
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Connected accounts allow Confidens to access your external services
            for enhanced functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
