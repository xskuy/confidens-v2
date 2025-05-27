'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Zap, Check, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface MCPConnectionsProps {
  userId: string;
}

interface MCPService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  connected: boolean;
  features?: string[];
  apiKeyPlaceholder?: string;
  getApiKeyUrl?: string;
}

const availableMCPs: MCPService[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows between apps',
    icon: (
      <div className="size-8 bg-orange-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">zapier</span>
      </div>
    ),
    bgColor: 'bg-orange-500',
    connected: false,
    features: ['Gmail', 'Notion', '8,000+ other apps'],
    apiKeyPlaceholder: 'Enter your Zapier API key',
    getApiKeyUrl: 'https://zapier.com/app/developer',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform integration',
    icon: (
      <div className="size-8 bg-green-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">S</span>
      </div>
    ),
    bgColor: 'bg-green-600',
    connected: false,
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Customer messaging platform',
    icon: (
      <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <div className="size-4 bg-white rounded grid grid-cols-4 gap-0.5 p-0.5">
          <div className="bg-blue-600 rounded-sm" />
          <div className="bg-blue-600 rounded-sm" />
          <div className="bg-blue-600 rounded-sm" />
          <div className="bg-blue-600 rounded-sm" />
        </div>
      </div>
    ),
    bgColor: 'bg-blue-600',
    connected: false,
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Financial data connectivity',
    icon: (
      <div className="size-8 bg-black rounded-lg flex items-center justify-center">
        <div className="grid grid-cols-2 gap-1">
          <div className="size-1 bg-white rounded-full" />
          <div className="size-1 bg-white rounded-full" />
          <div className="size-1 bg-white rounded-full" />
          <div className="size-1 bg-white rounded-full" />
        </div>
      </div>
    ),
    bgColor: 'bg-black',
    connected: false,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing platform',
    icon: (
      <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">S</span>
      </div>
    ),
    bgColor: 'bg-indigo-600',
    connected: false,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Browser',
    description: 'Web infrastructure and security',
    icon: (
      <div className="size-8 bg-orange-400 rounded-lg flex items-center justify-center">
        <div className="size-4">
          <div className="w-full h-1 bg-white rounded-full mb-1" />
          <div className="w-3/4 h-1 bg-white rounded-full mb-1" />
          <div className="w-1/2 h-1 bg-white rounded-full" />
        </div>
      </div>
    ),
    bgColor: 'bg-orange-400',
    connected: false,
  },
  {
    id: 'hubspot',
    name: 'Hubspot',
    description: 'CRM and marketing platform',
    icon: (
      <div className="size-8 bg-orange-500 rounded-lg flex items-center justify-center">
        <div className="size-4 text-white">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
    ),
    bgColor: 'bg-orange-500',
    connected: false,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Digital payment solution',
    icon: (
      <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">P</span>
      </div>
    ),
    bgColor: 'bg-blue-600',
    connected: false,
  },
  {
    id: 'deepwiki',
    name: 'DeepWiki (Devin)',
    description: 'AI-powered documentation',
    icon: (
      <div className="size-8 bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="size-4 text-white">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 10v6m11-7h-6M6 12H0" />
          </svg>
        </div>
      </div>
    ),
    bgColor: 'bg-gray-800',
    connected: false,
  },
];

// Connection Modal Component
interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMcp: MCPService | null;
  onConnect: (apiKey: string) => Promise<void>;
}

function ConnectionModal({
  isOpen,
  onClose,
  selectedMcp,
  onConnect,
}: ConnectionModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedMcp || !apiKey.trim()) return;

    setIsConnecting(true);
    try {
      await onConnect(apiKey);
      onClose();
      setApiKey('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      onClose();
      setApiKey('');
      setShowApiKey(false);
    }
  };

  if (!selectedMcp) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">
          Connect to {selectedMcp.name} MCP
        </DialogTitle>

        {isConnecting ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              {selectedMcp.icon}
              <div className="absolute -top-1 -right-1 size-3">
                <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">
                Establishing connection...
              </h3>
              <p className="text-sm text-muted-foreground">
                https://mcp.{selectedMcp.name.toLowerCase()}.com/api/mcp/mcp
              </p>
            </div>
          </div>
        ) : (
          // Connection Form
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-1 h-auto"
              >
                <ArrowLeft className="size-4" />
                <span className="ml-2 text-sm">Back</span>
              </Button>
            </div>

            {/* Service Info */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">{selectedMcp.icon}</div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Connect to {selectedMcp.name} MCP
                </h3>
                <p className="text-sm text-muted-foreground">
                  https://mcp.{selectedMcp.name.toLowerCase()}.com/api/mcp/mcp
                </p>
              </div>

              {/* Features */}
              {selectedMcp.features && (
                <div className="space-y-3">
                  {selectedMcp.features.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Check className="size-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Key Input */}
            {selectedMcp.apiKeyPlaceholder && (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={selectedMcp.apiKeyPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {selectedMcp.getApiKeyUrl && (
                  <div className="text-center">
                    <a
                      href={selectedMcp.getApiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Get API key
                      <ExternalLink className="size-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={!apiKey.trim()}
              className="w-full"
              size="lg"
            >
              <Zap className="size-4 mr-2" />
              Connect
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MCPConnections({ userId }: MCPConnectionsProps) {
  const [mcps, setMcps] = useState(availableMCPs);
  const [selectedMcp, setSelectedMcp] = useState<MCPService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleServiceClick = (mcp: MCPService) => {
    setSelectedMcp(mcp);
    setIsModalOpen(true);
  };

  const handleConnect = async (apiKey: string) => {
    if (!selectedMcp) return;

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setMcps((prev) =>
      prev.map((mcp) =>
        mcp.id === selectedMcp.id ? { ...mcp, connected: true } : mcp,
      ),
    );

    toast.success(`${selectedMcp.name} connected successfully`);
  };

  const handleAddNew = () => {
    // Placeholder for custom MCP connection
    toast.info('Custom MCP connection coming soon');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Add tools from remote MCP servers
        </h1>
        <p className="text-sm text-muted-foreground">
          Select from a list of popular server or connect to a new one
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add New Card */}
        <button
          type="button"
          onClick={handleAddNew}
          className="group flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 hover:bg-muted/25 transition-all"
        >
          <div className="size-12 border-2 border-muted-foreground/50 border-dashed rounded-lg flex items-center justify-center group-hover:border-muted-foreground/75 transition-colors">
            <span className="text-2xl font-light text-muted-foreground group-hover:text-muted-foreground/75">
              +
            </span>
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">Add new</p>
          </div>
        </button>

        {/* Service Cards */}
        {mcps.map((mcp) => (
          <button
            type="button"
            key={mcp.id}
            onClick={() => handleServiceClick(mcp)}
            className="group flex flex-col items-center justify-center space-y-4 p-6 border border-border rounded-lg hover:border-muted-foreground/50 hover:bg-muted/25 transition-all relative"
          >
            {mcp.connected && (
              <div className="absolute top-2 right-2">
                <div className="size-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="size-3 text-white" />
                </div>
              </div>
            )}

            <div className="relative">{mcp.icon}</div>

            <div className="text-center">
              <p className="font-medium text-sm">{mcp.name}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedMcp={selectedMcp}
        onConnect={handleConnect}
      />
    </div>
  );
}
