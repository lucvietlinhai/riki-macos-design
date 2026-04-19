
import React from 'react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { WandIcon, BotIcon, AnalyticsIcon, ExternalIcon } from '../constants';
import { motion } from 'motion/react';

interface FeatureCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    isPro?: boolean;
    isDisabled?: boolean;
}

interface HomePageProps {
    onNavigateToDesign: () => void;
    onNavigateToChatbot: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToDesign, onNavigateToChatbot }) => {
    const { t } = useI18n();
    const { isDark } = useTheme();

    const features: FeatureCard[] = [
        {
            id: 'design',
            title: 'THIẾT KẾ AI RIKI',
            description: 'Công cụ sáng tạo linh vật, ảnh content, thumbnail và truyện bằng AI mạnh mẽ nhất.',
            icon: <WandIcon className="w-8 h-8" />,
            color: 'from-brand to-cyan-600',
        },
        {
            id: 'chatbot',
            title: 'RIKI CHATBOT',
            description: 'Trợ lý ảo thông minh hỗ trợ khách hàng và tối ưu hóa quy trình làm việc tự động.',
            icon: <BotIcon className="w-8 h-8" />,
            color: 'from-blue-500 to-indigo-600',
        },
        {
            id: 'analytics',
            title: 'PHÂN TÍCH DỮ LIỆU',
            description: 'Hệ thống báo cáo và phân tích hành vi khách hàng dựa trên nền tảng Big Data.',
            icon: <AnalyticsIcon className="w-8 h-8" />,
            color: 'from-emerald-500 to-teal-600',
            isDisabled: true,
        },
        {
            id: 'marketing',
            title: 'MARKETING AUTOMATION',
            description: 'Chiến dịch tiếp thị tự động hóa đa kênh giúp tăng tỷ lệ chuyển đổi nhanh chóng.',
            icon: <ExternalIcon className="w-8 h-8" />,
            color: 'from-rose-500 to-pink-600',
            isDisabled: true,
        }
    ];

    return (
        <div className={`min-h-screen w-full overflow-y-auto ${isDark ? 'bg-zinc-950 text-white' : 'bg-[#f8ffff] text-slate-900'} font-sans relative`}>
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand/10 blur-[100px] transition-opacity duration-1000 ${isDark ? 'opacity-20' : 'opacity-40'}`} />
                <div className={`absolute top-1/2 -right-24 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[120px] transition-opacity duration-1000 ${isDark ? 'opacity-10' : 'opacity-30'}`} />
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#3ac6c6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Header Content */}
            <header className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <div className="inline-block p-1.5 px-5 rounded-full bg-brand/10 border border-brand/20 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand">Hệ sinh thái thông minh Riki AI</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] uppercase" style={{ fontFamily: "'Lexend', sans-serif" }}>
                        XÂY DỰNG <span className="text-brand">TƯƠNG LAI</span>
                        <br /><span className="opacity-90">VỚI TRÍ TUỆ</span> <span className="text-stroke-sm dark:text-stroke-white text-stroke-brand text-transparent">NHÂN TẠO</span>
                    </h1>
                    
                    <p className="max-w-3xl mx-auto text-lg md:text-2xl font-light opacity-60 leading-relaxed translate-y-2">
                        Nền tảng tích hợp đa tính năng giúp doanh nghiệp bứt phá trong kỷ nguyên số. 
                        Tự động hóa, sáng tạo và dữ liệu trong tầm tay bạn.
                    </p>
                </motion.div>
            </header>

            {/* Features Grid */}
            <main className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                            onClick={() => {
                                if (feature.isDisabled) return;
                                if (feature.id === 'design') onNavigateToDesign();
                                if (feature.id === 'chatbot') onNavigateToChatbot();
                            }}
                            className={`group relative p-10 rounded-[48px] border transition-all duration-700 overflow-hidden cursor-pointer
                                ${isDark ? 'bg-zinc-900 border-white/5 hover:border-brand/20' : 'bg-white border-brand/10 hover:border-brand/30 shadow-[0_20px_60px_-15px_rgba(58,198,198,0.1)] hover:shadow-[0_25px_80px_-15px_rgba(58,198,198,0.2)]'}
                                ${feature.isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.03] active:scale-95'}
                            `}
                        >
                            {/* Hover Gradient Glow */}
                            <div className={`absolute -inset-20 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-1000`} />
                            
                            <div className="relative z-10 space-y-8">
                                <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-2xl transition-all duration-700 group-hover:rotate-[10deg] group-hover:scale-110`}>
                                    <div className="transform transition-transform duration-700 group-hover:rotate-[-10deg]">
                                        {feature.icon}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lexend', sans-serif" }}>{feature.title}</h3>
                                    </div>
                                    <p className="text-sm font-light opacity-50 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    {feature.isDisabled ? (
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-500 border border-white/5">Sắp ra mắt</span>
                                    ) : (
                                        <div className="flex items-center text-xs font-bold uppercase tracking-[0.2em] text-brand transition-all duration-500">
                                            <span className="group-hover:mr-3 transition-all duration-500">Truy cập hệ thống</span>
                                            <ExternalIcon className="w-5 h-5 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-brand/10 flex flex-col md:flex-row justify-between items-center gap-10 opacity-30">
                <div className="flex items-center gap-4">
                    <span className="text-3xl font-black tracking-tighter text-brand" style={{ fontFamily: "'Lexend', sans-serif" }}>AI RIKI</span>
                    <div className="h-6 w-px bg-brand/30" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">version 4.0 - update 04/2026</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em]">
                    &copy; 2026 Riki AI Solutions. All rights reserved.
                </div>
            </footer>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .text-stroke-brand { -webkit-text-stroke: 1.5px #3ac6c6; }
                .text-stroke-white { -webkit-text-stroke: 1.5px rgba(255,255,255,0.8); }
                .text-stroke-sm { -webkit-text-stroke-width: 1px; }
            `}} />
        </div>
    );
};
