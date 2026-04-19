
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { BotIcon, ExternalIcon, WandIcon, HomeIcon, SettingsIcon } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { Send, LogIn, LogOut, FileText, Check, Loader2, Trash2, X } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
}

interface ChatbotPageProps {
    onGoBack?: () => void;
}

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ onGoBack }) => {
    const { t } = useI18n();
    const { isDark } = useTheme();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isSavingKB, setIsSavingKB] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [fileContents, setFileContents] = useState<Record<string, string>>({});
    const [serverKB, setServerKB] = useState<{ id: string; name: string; content: string }[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    useEffect(() => {
        checkAuth();
        loadServerKB();
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                checkAuth();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (isAuthenticated && isAdminMode) {
            fetchFiles();
        }
    }, [isAuthenticated, isAdminMode]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadServerKB = async () => {
        try {
            const res = await fetch('/api/kb/load');
            const data = await res.json();
            setServerKB(data.documents || []);
        } catch (e) {
            console.error('KB Load error', e);
        }
    };

    const saveServerKB = async () => {
        setIsSavingKB(true);
        try {
            const documents = selectedFiles.map(f => ({
                id: f.id,
                name: f.name,
                content: fileContents[f.id] || ''
            }));
            const res = await fetch('/api/kb/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents })
            });
            if (res.ok) {
                await loadServerKB();
                setIsAdminMode(false);
            }
        } catch (e) {
            console.error('KB Save error', e);
        } finally {
            setIsSavingKB(false);
        }
    };

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/check');
            const data = await res.json();
            setIsAuthenticated(data.isAuthenticated);
        } catch (e) {
            console.error('Auth check error', e);
        }
    };

    const handleLogin = async () => {
        try {
            const res = await fetch('/api/auth/google/url');
            const { url } = await res.json();
            window.open(url, 'oauth_popup', 'width=600,height=700');
        } catch (e) {
            console.error('Login error', e);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setIsAuthenticated(false);
        setFiles([]);
        setSelectedFiles([]);
    };

    const fetchFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const res = await fetch('/api/drive/files');
            const data = await res.json();
            setFiles(data.files || []);
        } catch (e) {
            console.error('Fetch files error', e);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const toggleFile = async (file: DriveFile) => {
        if (selectedFiles.some(f => f.id === file.id)) {
            setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
        } else {
            setSelectedFiles([...selectedFiles, file]);
            if (!fileContents[file.id]) {
                try {
                    const res = await fetch(`/api/drive/file-content/${file.id}`);
                    const data = await res.json();
                    setFileContents(prev => ({ ...prev, [file.id]: data.content }));
                } catch (e) {
                    console.error('Content fetch error', e);
                }
            }
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isGenerating) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: inputValue }] };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsGenerating(true);

        try {
            // Use serverKB instead of local selectedFiles for global data
            const context = serverKB
                .map(f => `FILE: ${f.name}\nCONTENT:\n${f.content}`)
                .join('\n\n---\n\n');

            const systemInstruction = `Bạn là Trợ lý HR thông minh của Riki. 
Nhiệm vụ của bạn là hỗ trợ nhân viên giải đáp các thắc mắc về chính sách, quy định của công ty dựa TRỰC TIẾP trên các tài liệu được cung cấp dưới đây.

NẾU thông tin không có trong tài liệu, hãy trả lời là bạn không tìm thấy thông tin phù hợp trong quy định hiện tại và khuyên nhân viên liên hệ trực tiếp phòng HCNS.
NẾU có thông tin, hãy trả lời chi tiết và ghi rõ nguồn từ tài liệu nào. Trả lời bằng tiếng Việt lịch sự.

Tài liệu tham khảo:
${context || 'Chưa có tài liệu quy định được cung cấp.'}`;

            const response = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: [
                    ...messages.map(m => ({ role: m.role, parts: m.parts })),
                    { role: 'user', parts: [{ text: inputValue }] }
                ],
                config: {
                    systemInstruction,
                    temperature: 0.3, 
                }
            });

            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text || '' }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Chat error', error);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.' }] }]);
        } finally {
            setIsGenerating(false);
        }
    };

    if (isAuthenticated === null) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

    return (
        <div className={`flex flex-col h-full w-full ${isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-hidden`}>
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Only visible for Admin Setup */}
                <AnimatePresence>
                    {isAdminMode && (
                        <motion.aside 
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            className={`w-80 flex flex-col border-r ${isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'} z-50`}
                        >
                            <div className="p-6 border-b border-inherit">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-lg">Cấu hình Dữ liệu</h2>
                                    <button onClick={() => setIsAdminMode(false)} className="p-2 hover:bg-black/5 rounded-lg opacity-50 hover:opacity-100">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {!isAuthenticated ? (
                                    <button 
                                        onClick={handleLogin}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand text-black font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-brand/20"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Kết nối Google Drive
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-xs opacity-50 flex items-center gap-2">
                                            <Check className="w-3 h-3 text-emerald-500" />
                                            Đang kết nối để đồng bộ
                                        </div>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full py-2 text-xs font-bold text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 transition-all"
                                        >
                                            Đăng xuất Google
                                        </button>
                                        <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                                            <p className="text-[10px] font-bold uppercase opacity-40">Redirect URI (đăng ký Google Console):</p>
                                            <code className="text-[10px] text-brand break-all select-all">{window.location.origin}/auth/callback</code>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                                {isLoadingFiles ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                                        <span className="text-xs opacity-50">Đang quét Drive...</span>
                                    </div>
                                ) : files.length > 0 ? (
                                    files.map(file => (
                                        <button
                                            key={file.id}
                                            onClick={() => toggleFile(file)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left text-sm transition-all border ${
                                                selectedFiles.some(f => f.id === file.id)
                                                    ? 'bg-brand/10 border-brand/30 text-brand font-medium shadow-sm'
                                                    : `border-transparent ${isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-600'}`
                                            }`}
                                        >
                                            <div className={`p-2 rounded-xl ${selectedFiles.some(f => f.id === file.id) ? 'bg-brand/20' : isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="flex-1 truncate">{file.name}</span>
                                        </button>
                                    ))
                                ) : isAuthenticated ? (
                                    <div className="text-center py-12 px-4 opacity-50">
                                        <p className="text-sm">Hãy tải file lên Google Drive của bạn trước.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-4 opacity-50 italic text-sm">
                                        Vui lòng đăng nhập để chọn file
                                    </div>
                                )}
                            </div>
                            
                            {selectedFiles.length > 0 && (
                                <div className="p-4 border-t border-inherit bg-brand/5">
                                    <button 
                                        onClick={saveServerKB}
                                        disabled={isSavingKB}
                                        className="w-full py-3 px-4 bg-brand text-black font-bold rounded-2xl hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSavingKB ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandIcon className="w-4 h-4" />}
                                        Lưu vào bộ nhớ AI
                                    </button>
                                    <p className="mt-2 text-[10px] text-center opacity-50 italic">Dữ liệu sẽ được lưu cố định trên hệ thống cho mọi người dùng.</p>
                                </div>
                            )}
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col relative transition-all duration-500">
                    {/* Chat Header */}
                    <div className={`px-8 py-4 border-b flex items-center justify-between ${isDark ? 'bg-zinc-950/50 border-white/5' : 'bg-white/50 border-slate-200'} backdrop-blur-md`}>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={onGoBack}
                                className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-black'}`}
                            >
                                <HomeIcon className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-2xl bg-brand/20 flex items-center justify-center text-brand">
                                <BotIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg" style={{ fontFamily: "'Lexend', sans-serif" }}>RIKI HR CHATBOT</h1>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p className="text-[10px] uppercase font-bold tracking-tight opacity-50">
                                        {serverKB.length > 0 ? `Đang học từ ${serverKB.length} tài liệu quy định` : 'Chờ Admin cung cấp dữ liệu'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsAdminMode(!isAdminMode)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isAdminMode ? 'bg-brand text-black' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >
                                <SettingsIcon className="w-3 h-3" />
                                {isAdminMode ? 'Đóng Admin' : 'Admin Panel'}
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-[32px] bg-brand/10 flex items-center justify-center text-brand">
                                        <BotIcon className="w-12 h-12" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand flex items-center justify-center text-black">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>Xin chào!</h3>
                                    <p className="text-sm opacity-50 leading-relaxed">
                                        Tôi là AI nội bộ của Riki. Tôi đã nắm rõ các quy định về chính sách, nghỉ phép và bảo hiểm của công ty. Bạn muốn hỏi gì?
                                    </p>
                                </div>
                                
                                {serverKB.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 w-full">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Câu hỏi thường gặp</div>
                                        {['Lương tháng 13 tính thế nào?', 'Quy định nghỉ phép năm của Riki?', 'Chế độ bảo hiểm cho nhân viên mới?'].map((q, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setInputValue(q)}
                                                className={`p-4 rounded-2xl border text-xs text-left transition-all ${isDark ? 'bg-zinc-900 border-white/5 hover:border-brand/30' : 'bg-white border-slate-200 hover:border-brand/30'}`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-5 ${
                                        m.role === 'user' 
                                            ? 'bg-brand text-black font-medium shadow-lg shadow-brand/20' 
                                            : `${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-slate-200 shadow-sm'}`
                                    }`}>
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                            {m.parts[0].text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        {isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="flex justify-start"
                            >
                                <div className={`rounded-2xl p-5 flex items-center gap-3 ${isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-slate-200'}`}>
                                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                                    <span className="text-xs font-medium opacity-50 italic">AI đang đọc lại quy định...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-8 ${isDark ? 'bg-zinc-950/80 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]' : 'bg-slate-50/80'} backdrop-blur-md`}>
                        <div className={`relative flex items-center p-2 rounded-3xl border transition-all ${
                            isDark ? 'bg-zinc-900 border-white/10 focus-within:border-brand/50 shadow-2xl' : 'bg-white border-slate-200 focus-within:border-brand/50 shadow-xl'
                        }`}>
                            <input 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Nhập câu hỏi của bạn về quy định công ty..."
                                disabled={serverKB.length === 0 || isGenerating}
                                className="flex-1 bg-transparent px-6 py-4 text-sm focus:outline-none disabled:opacity-30"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isGenerating || serverKB.length === 0}
                                className="w-14 h-14 rounded-2xl bg-brand text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 shadow-lg shadow-brand/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-6 opacity-40 grayscale">
                             <div className="flex items-center gap-1.5 grayscale">
                                <FileText className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Knowledge Base 1.0</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <BotIcon className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Riki AI Security</span>
                             </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
