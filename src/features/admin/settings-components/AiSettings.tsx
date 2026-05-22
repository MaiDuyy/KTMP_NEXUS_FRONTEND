import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Cpu, Sparkles, Brain, Eye, EyeOff } from 'lucide-react';
import { SettingRow } from './SettingRow';

interface AiSettingsProps {
    aiSettings: {
        llm_provider: string;
        llm_api_key: string;
        llm_model: string;
        llm_base_url: string;
        embedding_provider: string;
        embedding_api_key: string;
        embedding_model: string;
        mrp_auto_approve: string;
        chunk_size: string;
        chunk_overlap: string;
    };
    handleAiChange: (key: string, value: any) => void;
    llmCatalog?: any[];
    aiConfig?: any;
    showLlmKey: boolean;
    setShowLlmKey: (show: boolean) => void;
    showEmbedKey: boolean;
    setShowEmbedKey: (show: boolean) => void;
}

const STANDARD_EMBED_MODELS: Record<string, { id: string; label: string; recommended?: boolean }[]> = {
    openai: [
        { id: 'text-embedding-3-small', label: 'text-embedding-3-small', recommended: true },
        { id: 'text-embedding-3-large', label: 'text-embedding-3-large' },
        { id: 'text-embedding-ada-002', label: 'text-embedding-ada-002' },
    ],
    cohere: [
        { id: 'embed-english-v3.0', label: 'embed-english-v3.0', recommended: true },
        { id: 'embed-multilingual-v3.0', label: 'embed-multilingual-v3.0' },
    ],
    huggingface: [
        { id: 'bge-small-en-v1.5', label: 'bge-small-en-v1.5', recommended: true },
        { id: 'all-MiniLM-L6-v2', label: 'all-MiniLM-L6-v2' },
    ],
    local: [
        { id: 'nomic-embed-text', label: 'nomic-embed-text', recommended: true },
        { id: 'mxbai-embed-large', label: 'mxbai-embed-large' },
    ],
};

export function AiSettings({
    aiSettings,
    handleAiChange,
    llmCatalog,
    aiConfig,
    showLlmKey,
    setShowLlmKey,
    showEmbedKey,
    setShowEmbedKey,
}: AiSettingsProps) {
    const [isCustomLlm, setIsCustomLlm] = useState(false);
    const [isCustomEmbed, setIsCustomEmbed] = useState(false);

    // Filter catalog for selected provider
    const filteredLlmCatalog = llmCatalog
        ? llmCatalog.filter((m) => m.provider === aiSettings.llm_provider)
        : [];

    // Automatically determine if current values are custom
    useEffect(() => {
        if (aiSettings.llm_model) {
            const inCatalog = filteredLlmCatalog.some((m) => m.id === aiSettings.llm_model);
            if (filteredLlmCatalog.length > 0 && !inCatalog) {
                setIsCustomLlm(true);
            }
        }
    }, [aiSettings.llm_model, aiSettings.llm_provider, llmCatalog]);

    useEffect(() => {
        if (aiSettings.embedding_model) {
            const standardList = STANDARD_EMBED_MODELS[aiSettings.embedding_provider] || [];
            const inStandard = standardList.some((m) => m.id === aiSettings.embedding_model);
            if (standardList.length > 0 && !inStandard) {
                setIsCustomEmbed(true);
            }
        }
    }, [aiSettings.embedding_model, aiSettings.embedding_provider]);

    const handleLlmProviderChange = (value: string) => {
        handleAiChange('llm_provider', value);
        // Default models when changing provider
        const defaults: Record<string, string> = {
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-5-haiku-20241022',
            gemini: 'gemini-1.5-flash',
            ollama: 'llama3',
            custom: 'custom-model',
        };
        handleAiChange('llm_model', defaults[value] || '');
        setIsCustomLlm(false);
    };

    const handleEmbedProviderChange = (value: string) => {
        handleAiChange('embedding_provider', value);
        // Default models when changing embedding provider
        const defaults: Record<string, string> = {
            openai: 'text-embedding-3-small',
            cohere: 'embed-english-v3.0',
            huggingface: 'bge-small-en-v1.5',
            local: 'nomic-embed-text',
        };
        handleAiChange('embedding_model', defaults[value] || '');
        setIsCustomEmbed(false);
    };

    const currentEmbedOptions = STANDARD_EMBED_MODELS[aiSettings.embedding_provider] || [];

    return (
        <div className="space-y-4">
            {/* LLM Config Card */}
            <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden">
                <CardHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        Cấu hình Mô hình ngôn ngữ lớn (LLM)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                        Thiết lập kết nối với nhà cung cấp LLM phục vụ hỏi đáp và phân tích tri thức
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="llm_provider" className="text-xs font-semibold">Nhà cung cấp LLM</Label>
                            <Select
                                value={aiSettings.llm_provider}
                                onValueChange={handleLlmProviderChange}
                            >
                                <SelectTrigger id="llm_provider" className="h-8 rounded-lg text-xs">
                                    <SelectValue placeholder="Chọn nhà cung cấp" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="ollama">Ollama (Local LLM)</SelectItem>
                                    <SelectItem value="custom">Custom (OpenAI-compatible)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="llm_model" className="text-xs font-semibold">Mô hình hoạt động (Model)</Label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomLlm(!isCustomLlm)}
                                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer active:scale-95 transition-transform"
                                >
                                    {isCustomLlm ? 'Chọn trong danh sách' : 'Tự nhập mã model'}
                                </button>
                            </div>
                            
                            {isCustomLlm || filteredLlmCatalog.length === 0 ? (
                                <Input
                                    id="llm_model"
                                    value={aiSettings.llm_model}
                                    onChange={(e) => handleAiChange('llm_model', e.target.value)}
                                    placeholder="Ví dụ: gpt-4o-mini hoặc llama3.1"
                                    className="h-8 rounded-lg text-xs"
                                />
                            ) : (
                                <Select
                                    value={aiSettings.llm_model}
                                    onValueChange={(value) => handleAiChange('llm_model', value)}
                                >
                                    <SelectTrigger id="llm_model" className="h-8 rounded-lg text-xs">
                                        <SelectValue placeholder="Chọn mô hình" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredLlmCatalog.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.label} {m.recommended && '(Được đề xuất)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="llm_api_key" className="text-xs font-semibold flex items-center justify-between">
                                <span>API Key</span>
                                {aiConfig?.llm_api_key_configured && (
                                    <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 rounded-md px-1.5 py-0 text-[9px] font-normal">
                                        Đã cấu hình trước đó
                                    </Badge>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="llm_api_key"
                                    type={showLlmKey ? 'text' : 'password'}
                                    value={aiSettings.llm_api_key}
                                    onChange={(e) => handleAiChange('llm_api_key', e.target.value)}
                                    placeholder="Nhập khóa API..."
                                    className="h-8 rounded-lg text-xs pr-8"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLlmKey(!showLlmKey)}
                                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showLlmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="llm_base_url" className="text-xs font-semibold">Base URL (Tùy chọn)</Label>
                            <Input
                                id="llm_base_url"
                                value={aiSettings.llm_base_url}
                                onChange={(e) => handleAiChange('llm_base_url', e.target.value)}
                                placeholder="https://api.openai.com/v1 (Để trống nếu dùng mặc định)"
                                className="h-8 rounded-lg text-xs"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Embedding & RAG Card */}
            <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden">
                <CardHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Bộ sinh vector (Embedding) & Xử lý văn bản (RAG)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                        Cấu hình mô hình tạo vector nhúng và quy trình cắt tài liệu của cơ sở tri thức
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="embedding_provider" className="text-xs font-semibold">Nhà cung cấp Embedding</Label>
                            <Select
                                value={aiSettings.embedding_provider}
                                onValueChange={handleEmbedProviderChange}
                            >
                                <SelectTrigger id="embedding_provider" className="h-8 rounded-lg text-xs">
                                    <SelectValue placeholder="Chọn nhà cung cấp" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">OpenAI (text-embedding)</SelectItem>
                                    <SelectItem value="cohere">Cohere AI</SelectItem>
                                    <SelectItem value="huggingface">HuggingFace (Remote)</SelectItem>
                                    <SelectItem value="local">Ollama / Local (Không mất phí)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="embedding_model" className="text-xs font-semibold">Mô hình nhúng (Model)</Label>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomEmbed(!isCustomEmbed)}
                                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer active:scale-95 transition-transform"
                                >
                                    {isCustomEmbed ? 'Chọn trong danh sách' : 'Tự nhập mã model'}
                                </button>
                            </div>
                            
                            {isCustomEmbed || currentEmbedOptions.length === 0 ? (
                                <Input
                                    id="embedding_model"
                                    value={aiSettings.embedding_model}
                                    onChange={(e) => handleAiChange('embedding_model', e.target.value)}
                                    placeholder="Ví dụ: text-embedding-3-small"
                                    className="h-8 rounded-lg text-xs"
                                />
                            ) : (
                                <Select
                                    value={aiSettings.embedding_model}
                                    onValueChange={(value) => handleAiChange('embedding_model', value)}
                                >
                                    <SelectTrigger id="embedding_model" className="h-8 rounded-lg text-xs">
                                        <SelectValue placeholder="Chọn mô hình nhúng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentEmbedOptions.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.label} {m.recommended && '(Được đề xuất)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="embedding_api_key" className="text-xs font-semibold flex items-center justify-between">
                                <span>API Key (Nếu khác với LLM)</span>
                                {aiConfig?.embedding_api_key_configured && (
                                    <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 rounded-md px-1.5 py-0 text-[9px] font-normal">
                                        Đã cấu hình trước đó
                                    </Badge>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="embedding_api_key"
                                    type={showEmbedKey ? 'text' : 'password'}
                                    value={aiSettings.embedding_api_key}
                                    onChange={(e) => handleAiChange('embedding_api_key', e.target.value)}
                                    placeholder="Nhập khóa API cho embedding..."
                                    className="h-8 rounded-lg text-xs pr-8"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEmbedKey(!showEmbedKey)}
                                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showEmbedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Separator className="md:col-span-2 bg-border/60" />

                        <div className="space-y-1.5">
                            <Label htmlFor="chunk_size" className="text-xs font-semibold">Kích thước phân mảnh (Chunk Size - Ký tự)</Label>
                            <Input
                                id="chunk_size"
                                type="number"
                                value={aiSettings.chunk_size}
                                onChange={(e) => handleAiChange('chunk_size', e.target.value)}
                                placeholder="1000"
                                className="h-8 rounded-lg text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="chunk_overlap" className="text-xs font-semibold">Độ gối phân mảnh (Chunk Overlap - Ký tự)</Label>
                            <Input
                                id="chunk_overlap"
                                type="number"
                                value={aiSettings.chunk_overlap}
                                onChange={(e) => handleAiChange('chunk_overlap', e.target.value)}
                                placeholder="200"
                                className="h-8 rounded-lg text-xs"
                            />
                        </div>
                    </div>

                    <Separator className="my-2 bg-border/60" />

                    <SettingRow
                        icon={Brain}
                        label="Tự động kiểm duyệt Tài liệu Tri thức (Auto MRP)"
                        description="Tự động duyệt và đưa các tài liệu được tải lên vào cơ sở tri thức (RAG) mà không cần bước phê duyệt thủ công của Admin."
                    >
                        <Switch
                            checked={aiSettings.mrp_auto_approve === 'true'}
                            onCheckedChange={(checked) => handleAiChange('mrp_auto_approve', checked ? 'true' : 'false')}
                        />
                    </SettingRow>
                </CardContent>
            </Card>
        </div>
    );
}
