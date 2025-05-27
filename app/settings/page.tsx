'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ProfileSettings } from './components/profile-settings';
import { PreferencesSettings } from './components/preferences-settings';
import { SecuritySettings } from './components/security-settings';
import { MCPConnections } from './components/mcp-connections';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'mcps', label: 'MCPs' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'security', label: 'Security' },
  ];

  const renderContent = () => {
    if (!session?.user) return null;

    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={session.user} />;
      case 'mcps':
        return session.user.id ? (
          <MCPConnections userId={session.user.id} />
        ) : null;
      case 'preferences':
        return session.user.id ? (
          <PreferencesSettings userId={session.user.id} />
        ) : null;
      case 'security':
        return session.user.id ? (
          <SecuritySettings userId={session.user.id} />
        ) : null;
      default:
        return <ProfileSettings user={session.user} />;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
      </div>

      {/* Navigation */}
      <div className="border-b border-border mb-8">
        <nav className="flex space-x-8 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium pb-4 transition-colors ${
                activeTab === tab.id
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">{renderContent()}</div>
    </div>
  );
}
