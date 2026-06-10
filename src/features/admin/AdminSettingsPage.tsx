'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Bell,
    Shield,
    Globe,
    Palette,
    Save,
    RefreshCw,
    Loader2,
    Brain,
} from 'lucide-react';
import {
    useGetOrgSettingsQuery,
    useUpdateOrgSettingsMutation,
    useGetAiSettingsQuery,
    useUpdateAiSettingsMutation,
    useGetLlmCatalogQuery,
} from '@/src/redux/feature/adminApi';
import { toast } from 'sonner';

// Import subcomponents
import { GeneralSettings } from './settings-components/GeneralSettings';
import { NotificationSettings } from './settings-components/NotificationSettings';
import { SecuritySettings } from './settings-components/SecuritySettings';
import { AppearanceSettings } from './settings-components/AppearanceSettings';
import { AiSettings } from './settings-components/AiSettings';

export function AdminSettingsPage() {
    // Org Settings Hooks
    const { data: orgData, isLoading: isLoadingOrg, refetch: refetchOrg } = useGetOrgSettingsQuery();
    const [updateOrgSettings, { isLoading: isUpdatingOrg }] = useUpdateOrgSettingsMutation();

    // AI Settings Hooks
    const { data: aiConfig, isLoading: isLoadingAi, refetch: refetchAi } = useGetAiSettingsQuery();
    const [updateAiSettings, { isLoading: isUpdatingAi }] = useUpdateAiSettingsMutation();
    const { data: llmCatalog } = useGetLlmCatalogQuery();

    const [activeTab, setActiveTab] = useState('general');

    // Org Settings State
    const [orgSettings, setOrgSettings] = useState({
        siteName: '',
        siteDescription: '',
        maintenanceMode: false,
        emailNotifications: true,
        pushNotifications: true,
        allowUserInvite: true,
        allowGuestInvite: false,
        twoFactorAuth: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordExpiry: 90,
        theme: 'system',
        language: 'vi',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
    });

    // AI Settings State
    const [aiSettings, setAiSettings] = useState({
        llm_provider: 'openai',
        llm_api_key: '',
        llm_model: 'gpt-4o-mini',
        llm_base_url: '',
        embedding_provider: 'openai',
        embedding_api_key: '',
        embedding_model: 'text-embedding-3-small',
        mrp_auto_approve: 'false',
        chunk_size: '1000',
        chunk_overlap: '200',
    });

    // API Key show/hide states
    const [showLlmKey, setShowLlmKey] = useState(false);
    const [showEmbedKey, setShowEmbedKey] = useState(false);

    // Sync Org Settings from API
    useEffect(() => {
        if (orgData?.settings) {
            setOrgSettings(prev => ({ ...prev, ...orgData.settings }));
        }
    }, [orgData]);

    // Sync AI Settings from API
    useEffect(() => {
        if (aiConfig) {
            setAiSettings({
                llm_provider: aiConfig.llm_provider || 'openai',
                llm_api_key: aiConfig.llm_api_key_configured ? '••••••••••••••••••••' : '',
                llm_model: aiConfig.llm_model || 'gpt-4o-mini',
                llm_base_url: aiConfig.llm_base_url || '',
                embedding_provider: aiConfig.embedding_provider || 'openai',
                embedding_api_key: aiConfig.embedding_api_key_configured ? '••••••••••••••••••••' : '',
                embedding_model: aiConfig.embedding_model || 'text-embedding-3-small',
                mrp_auto_approve: String(aiConfig.mrp_auto_approve || 'false'),
                chunk_size: String(aiConfig.chunk_size || '1000'),
                chunk_overlap: String(aiConfig.chunk_overlap || '200'),
            });
        }
    }, [aiConfig]);

    const handleOrgChange = (key: string, value: any) => {
        setOrgSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleAiChange = (key: string, value: any) => {
        setAiSettings(prev => ({ ...prev, [key]: value }));
    };

    // Save Org Settings
    const handleSaveOrg = async () => {
        try {
            await updateOrgSettings(orgSettings).unwrap();
            toast.success('Đã lưu cấu hình tổ chức thành công!');
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu cấu hình tổ chức');
        }
    };

    // Save AI Settings
    const handleSaveAi = async () => {
        try {
            const payload: Record<string, string> = {
                llm_provider: aiSettings.llm_provider || '',
                llm_model: aiSettings.llm_model || '',
                llm_base_url: aiSettings.llm_base_url || '',
                embedding_provider: aiSettings.embedding_provider || '',
                embedding_model: aiSettings.embedding_model || '',
                mrp_auto_approve: aiSettings.mrp_auto_approve,
                chunk_size: aiSettings.chunk_size,
                chunk_overlap: aiSettings.chunk_overlap,
            };

            // Only send API keys if they have been edited
            if (aiSettings.llm_api_key && aiSettings.llm_api_key !== '••••••••••••••••••••') {
                payload.llm_api_key = aiSettings.llm_api_key;
            }
            if (aiSettings.embedding_api_key && aiSettings.embedding_api_key !== '••••••••••••••••••••') {
                payload.embedding_api_key = aiSettings.embedding_api_key;
            }

            await updateAiSettings({ settings: payload }).unwrap();
            toast.success('Đã lưu cấu hình AI & Tri thức thành công!');
            refetchAi();
        } catch (error: any) {
            toast.error(`Lỗi lưu cấu hình AI: ${error.message || 'Không xác định'}`);
        }
    };

    const handleReset = () => {
        if (activeTab === 'ai') {
            refetchAi();
            toast.info('Đã tải lại cấu hình AI từ máy chủ');
        } else {
            refetchOrg();
            toast.info('Đã tải lại cài đặt tổ chức từ máy chủ');
        }
    };

    const isLoading = isLoadingOrg || isLoadingAi;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-80 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải cấu hình hệ thống...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-4 w-full h-full">
            {/* Header */}
            <div className="flex flex-col  w-full h-full gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                <div>
                    <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
                        <Settings className="w-5 h-5 text-primary" />
                        Cài đặt hệ thống
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Quản lý cấu hình toàn cục, bảo mật và thiết lập AI & Tri thức cho toàn hệ thống
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="rounded-lg h-8 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Làm mới
                    </Button>
                    <Button
                        size="sm"
                        onClick={activeTab === 'ai' ? handleSaveAi : handleSaveOrg}
                        disabled={activeTab === 'ai' ? isUpdatingAi : isUpdatingOrg}
                        className="rounded-lg h-8 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-[0.98]"
                    >
                        {(activeTab === 'ai' ? isUpdatingAi : isUpdatingOrg) ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {(activeTab === 'ai' ? isUpdatingAi : isUpdatingOrg) ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="bg-slate-100/60 dark:bg-slate-800/60 p-0.5 rounded-lg w-fit border border-border/40">
                    <TabsList className="bg-transparent h-8 gap-0.5 p-0">
                        <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 h-7 text-xs font-medium">
                            <Globe className="w-3.5 h-3.5 mr-1.5" />
                            Chung
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 h-7 text-xs font-medium">
                            <Bell className="w-3.5 h-3.5 mr-1.5" />
                            Thông báo
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 h-7 text-xs font-medium">
                            <Shield className="w-3.5 h-3.5 mr-1.5" />
                            Bảo mật
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 h-7 text-xs font-medium">
                            <Palette className="w-3.5 h-3.5 mr-1.5" />
                            Giao diện
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 h-7 text-xs font-medium">
                            <Brain className="w-3.5 h-3.5 mr-1.5" />
                            AI & Tri thức
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* General Settings */}
                <TabsContent value="general" className="focus-visible:outline-none">
                    <GeneralSettings orgSettings={orgSettings} handleOrgChange={handleOrgChange} />
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="focus-visible:outline-none">
                    <NotificationSettings orgSettings={orgSettings} handleOrgChange={handleOrgChange} />
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="focus-visible:outline-none">
                    <SecuritySettings orgSettings={orgSettings} handleOrgChange={handleOrgChange} />
                </TabsContent>

                {/* Appearance Settings */}
                <TabsContent value="appearance" className="focus-visible:outline-none">
                    <AppearanceSettings orgSettings={orgSettings} handleOrgChange={handleOrgChange} />
                </TabsContent>

                {/* AI & Knowledge Settings */}
                <TabsContent value="ai" className="focus-visible:outline-none">
                    <AiSettings
                        aiSettings={aiSettings}
                        handleAiChange={handleAiChange}
                        llmCatalog={llmCatalog}
                        aiConfig={aiConfig}
                        showLlmKey={showLlmKey}
                        setShowLlmKey={setShowLlmKey}
                        showEmbedKey={showEmbedKey}
                        setShowEmbedKey={setShowEmbedKey}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
