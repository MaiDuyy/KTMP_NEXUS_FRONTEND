'use client';

import { useState, useEffect } from 'react';
import {
    useGetOrgSettingsQuery,
    useUpdateOrgSettingsMutation,
    OrgSettings as OrgSettingsType,
} from '@/src/redux/feature/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Building2,
    Shield,
    Key,
    Clock,
    Mail,
    Loader2,
    Save,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function OrgSettings() {
    const { data: settingsData, isLoading } = useGetOrgSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateOrgSettingsMutation();

    // Form state
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');
    const [allowSignup, setAllowSignup] = useState(true);
    const [requireEmailVerification, setRequireEmailVerification] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState(480);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [minPasswordLength, setMinPasswordLength] = useState(8);
    const [requireUppercase, setRequireUppercase] = useState(true);
    const [requireNumbers, setRequireNumbers] = useState(true);
    const [requireSymbols, setRequireSymbols] = useState(false);
    const [allowedDomains, setAllowedDomains] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Initialize form with existing settings
    useEffect(() => {
        if (settingsData?.settings) {
            const s = settingsData.settings;
            setName(s.name || '');
            setDomain(s.domain || '');
            setAllowSignup(s.allowSignup);
            setRequireEmailVerification(s.requireEmailVerification);
            setSessionTimeout(s.sessionTimeout);
            setMfaRequired(s.mfaRequired);
            setMinPasswordLength(s.passwordPolicy.minLength);
            setRequireUppercase(s.passwordPolicy.requireUppercase);
            setRequireNumbers(s.passwordPolicy.requireNumbers);
            setRequireSymbols(s.passwordPolicy.requireSymbols);
            setAllowedDomains(s.allowedEmailDomains?.join(', ') || '');
        }
    }, [settingsData]);

    const handleSave = async () => {
        try {
            await updateSettings({
                name,
                domain: domain || undefined,
                allowSignup,
                requireEmailVerification,
                sessionTimeout,
                mfaRequired,
                passwordPolicy: {
                    minLength: minPasswordLength,
                    requireUppercase,
                    requireNumbers,
                    requireSymbols,
                },
                allowedEmailDomains: allowedDomains
                    ? allowedDomains.split(',').map(d => d.trim()).filter(Boolean)
                    : undefined,
            }).unwrap();
            setHasChanges(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    const markChanged = () => {
        setHasChanges(true);
        setSaveSuccess(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Organization Settings</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure your organization's security and access policies
                    </p>
                </div>
                <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
                    {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {saveSuccess ? 'Saved!' : 'Save Changes'}
                </Button>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="w-4 h-4" />
                        General
                    </CardTitle>
                    <CardDescription>Basic organization information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                            id="orgName"
                            value={name}
                            onChange={(e) => { setName(e.target.value); markChanged(); }}
                            placeholder="My Company"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="domain">Domain</Label>
                        <Input
                            id="domain"
                            value={domain}
                            onChange={(e) => { setDomain(e.target.value); markChanged(); }}
                            placeholder="company.com"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="w-4 h-4" />
                        Access Control
                    </CardTitle>
                    <CardDescription>Manage user registration and access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Allow Public Signup</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow anyone to create an account
                            </p>
                        </div>
                        <Switch
                            checked={allowSignup}
                            onCheckedChange={(v) => { setAllowSignup(v); markChanged(); }}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Require Email Verification</Label>
                            <p className="text-xs text-muted-foreground">
                                Users must verify email before accessing
                            </p>
                        </div>
                        <Switch
                            checked={requireEmailVerification}
                            onCheckedChange={(v) => { setRequireEmailVerification(v); markChanged(); }}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Require MFA</Label>
                            <p className="text-xs text-muted-foreground">
                                Enforce multi-factor authentication
                            </p>
                        </div>
                        <Switch
                            checked={mfaRequired}
                            onCheckedChange={(v) => { setMfaRequired(v); markChanged(); }}
                        />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                        <Input
                            id="allowedDomains"
                            value={allowedDomains}
                            onChange={(e) => { setAllowedDomains(e.target.value); markChanged(); }}
                            placeholder="company.com, partner.com"
                        />
                        <p className="text-xs text-muted-foreground">
                            Comma-separated list. Leave empty to allow all domains.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Session Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="w-4 h-4" />
                        Session
                    </CardTitle>
                    <CardDescription>Configure session timeout</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Select
                            value={sessionTimeout.toString()}
                            onValueChange={(v) => { setSessionTimeout(parseInt(v)); markChanged(); }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                                <SelectItem value="240">4 hours</SelectItem>
                                <SelectItem value="480">8 hours</SelectItem>
                                <SelectItem value="1440">24 hours</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Password Policy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="w-4 h-4" />
                        Password Policy
                    </CardTitle>
                    <CardDescription>Configure password requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="minLength">Minimum Length</Label>
                        <Select
                            value={minPasswordLength.toString()}
                            onValueChange={(v) => { setMinPasswordLength(parseInt(v)); markChanged(); }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="6">6 characters</SelectItem>
                                <SelectItem value="8">8 characters</SelectItem>
                                <SelectItem value="10">10 characters</SelectItem>
                                <SelectItem value="12">12 characters</SelectItem>
                                <SelectItem value="16">16 characters</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <Label>Require Uppercase Letters</Label>
                        <Switch
                            checked={requireUppercase}
                            onCheckedChange={(v) => { setRequireUppercase(v); markChanged(); }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Require Numbers</Label>
                        <Switch
                            checked={requireNumbers}
                            onCheckedChange={(v) => { setRequireNumbers(v); markChanged(); }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Require Special Characters</Label>
                        <Switch
                            checked={requireSymbols}
                            onCheckedChange={(v) => { setRequireSymbols(v); markChanged(); }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
