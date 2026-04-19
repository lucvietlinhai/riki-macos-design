
import React, { createContext, useContext, useState, useMemo } from 'react';

export const translations = {
  vi: {
    // Tabs
    tabDesign: 'TẠO MASCOT',
    tabThumbPost: 'TẠO ẢNH CONTENT',
    tabThumbVideo: 'TẠO ẢNH VIDEO',
    tabThumbPro: 'TẠO ẢNH THUMBNAIL',
    tabStoryArc: 'STORY TRUYỆN',
    comingSoon: 'Tính năng đang được phát triển...',

    // Design Modes
    modeLabel: 'Chế độ thiết kế',
    modeFree: 'Tự do',
    modeConcept: 'Bộ sưu tập',
    modeReference: 'Theo mẫu (Remix)',

    // Model Selection
    modelLabel: 'Công cụ AI (Model)',
    modelFlash: 'Gemini 2.5 Flash (Nhanh & Miễn phí)',
    modelPro: 'Gemini 3 Pro (Chất lượng cao - Cần Key)',

    // History Modal Tabs
    historyTabDesign: 'Thiết kế',
    historyTabThumbPost: 'Bài viết',
    historyTabThumbVideo: 'Video',
    historyTabThumbPro: 'Pro',
    historyTabStory: 'Truyện',

    // Loading & Progress
    loadingMessage1: 'Đang khởi tạo...',
    loadingMessage2: 'Đang phân tích yêu cầu...',
    loadingMessage3: 'Đang phác thảo sơ bộ...',
    loadingMessage4: 'Đang tô màu chi tiết...',
    loadingMessage5: 'Đang tinh chỉnh ánh sáng...',
    loadingMessage6: 'Đang hoàn tất hình ảnh...',
    editing: 'Đang chỉnh sửa...',
    rendering: 'AI đang vẽ ảnh chất lượng cao...',
    waiting: 'Thiết kế của bạn sẽ xuất hiện tại đây',
    aiCreative: 'AI đang sáng tạo...',

    // Pro Tab Security & Connection
    proUnlockTitle: 'Khu vực quản trị',
    proUnlockDesc: 'Vui lòng nhập mật khẩu để truy cập tính năng thiết kế nâng cao.',
    passwordPlaceholder: 'Nhập mật khẩu truy cập...',
    unlock: 'Xác nhận',
    invalidPassword: 'Mật khẩu không chính xác.',
    connectProTitle: 'Yêu cầu kết nối Pro',
    connectProDesc: 'Model Gemini 3 Pro yêu cầu API Key từ dự án GCP có tính phí để xuất ảnh 2K.',
    connectBtn: 'Kết nối API Key của bạn',
    billingDocLink: 'Hướng dẫn về API Key',
    connectedStatus: 'Đã kết nối Pro',
    reconnectBtn: 'Đổi Key API',

    // Story Arc
    storyArcTitle: 'Minh họa Phân đoạn câu truyện',
    storyArcPlaceholder: 'Nhập nội dung câu truyện của bạn tại đây. AI sẽ tự động phân tích và chia thành các phân đoạn minh họa tương ứng...',
    storyArcAnalyze: 'Phân tích câu truyện',
    storyArcAutoGenerate: 'Tự động tạo ảnh',
    storyArcDeleteScene: 'Xóa phân cảnh',
    storyArcEmpty: 'Nhập câu truyện để bắt đầu thiết kế từng phân cảnh',
    storyArcScene: 'Phân cảnh',
    storyArcPrompt: 'Gợi ý hình ảnh',
    storyArcRegenerate: 'Tạo lại phân cảnh này',
    storyArcStyleConsistency: 'Duy trì sự đồng nhất (Consistent Style)',
    storyArcAutoMagic: 'Sáng tạo lời nhắc tự động',
    storyArcAddScene: 'Thêm phân cảnh',

    // Pro Generator UI
    designModeTab: 'TỰ THIẾT KẾ',
    referenceModeTab: 'THAM CHIẾU MẪU',
    styleLabel: 'Phong cách thiết kế',
    fontLabel: 'Kiểu chữ (Hỗ trợ Việt/Nhật)',
    headlineLabel: 'Tiêu đề chính',
    descriptionLabel: 'Mô tả chi tiết',
    subHeadlineLabel: 'Tiêu đề phụ',
    footerLabel: 'Nút hành động / Chân trang',
    customPromptLabel: 'Yêu cầu bổ sung cho AI (Tùy chọn)',
    mainSubjectLabel: 'Nhân vật chính',
    bgLabel: 'Ảnh nền tùy chỉnh',
    logoLabel: 'Logo thương hiệu',
    logoPosLabel: 'Vị trí Logo',
    colorLabel: 'Màu sắc chủ đạo',
    iconLabel: 'Từ khóa biểu tượng (Decor)',
    referenceImgLabel: 'Tải ảnh mẫu tham chiếu',
    referenceModeDesc: 'AI sẽ tự phân tích phong cách, màu sắc và bố cục từ ảnh mẫu của bạn.',
    lockTextToLineLabel: 'Khóa text 1 hàng (Auto size)',
    
    // Remix Options
    remixOptionsLabel: 'Tùy chọn Remix',
    keepBackground: 'Giữ nguyên bối cảnh gốc',
    keepPose: 'Giữ nguyên tư thế & bố cục',
    
    // Validation Errors
    unsupportedFormat: 'Định dạng tệp không được hỗ trợ.',
    suggestedFormats: 'Vui lòng sử dụng ảnh định dạng .JPG, .PNG hoặc .WEBP để đảm bảo AI xử lý chính xác.',
    fileTooLargeShort: 'Dung lượng tệp vượt quá 4MB.',

    // Styles translated
    styleModern: 'Giáo dục hiện đại',
    styleContrast: 'Tương phản mạnh',
    styleAnime: 'Anime rực rỡ',
    styleCyber: 'Cyberpunk (Neon)',
    styleMinimal: 'Tối giản (Clean)',
    styleLuxury: 'Sang trọng (Vàng/Đen)',
    styleVapor: 'Hoài cổ (Vaporwave)',
    styleGaming: 'Thể thao điện tử',
    styleCinematic: 'Phim điện ảnh',

    // Fonts translated
    fontSans: 'Không chân hiện đại',
    fontSerif: 'Có chân cổ điển',
    fontManga: 'Bút lông Nhật Bản',
    fontHand: 'Viết tay thân thiện',
    fontImpact: 'Đậm chất quảng cáo',

    // Headers & Labels
    history: 'Lịch sử',
    shortcuts: 'Phím tắt',
    settings: 'Cài đặt',
    chooseCharacter: 'Chọn nhân vật',
    aspectRatio: 'Tỷ lệ khung hình',
    background: 'Nền',
    numImages: 'Số lượng ảnh',
    openSketchpad: 'Mở bảng vẽ',
    attachImage: 'Đính kèm ảnh',
    generate: 'Tạo ảnh',
    sketch: 'Bản vẽ',
    developedBy: 'Phát triển bởi Riki AI',
    canvasReady: 'Bảng vẽ đã sẵn sàng',
    note: 'Lưu ý:',
    note1: 'Mô tả càng chi tiết, kết quả càng tốt.',
    note2: 'Bạn có thể sử dụng ảnh tham chiếu để định hình phong cách.',
    note3: 'Liên hệ hỗ trợ tại',
    here: 'đây',
    generatingImage: 'Đang tạo ảnh...',
    generatedMascot: 'Linh vật đã tạo',
    editImage: 'Chỉnh sửa ảnh',
    viewDetail: 'Xem chi tiết',
    downloadImage: 'Tải ảnh',
    generationFailed: 'Tạo ảnh thất bại',
    close: 'Đóng',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    layers: 'Lớp ảnh',
    imageLayer: 'Ảnh',
    bringToFront: 'Đưa lên trên',
    deleteConfirm: 'Bạn có chắc muốn xóa?',
    deleteImage: 'Xóa ảnh',
    noImages: 'Chưa có ảnh nào',
    generatedHistory: 'Lịch sử tạo ảnh',
    useAsReference: 'Dùng làm tham chiếu',
    shortcutsTitle: 'Phím tắt bàn phím',
    panCanvas: 'Di chuyển bảng vẽ',
    zoomInShortcut: 'Phóng to',
    zoomOutShortcut: 'Thu nhỏ',
    generateImageShortcut: 'Tạo ảnh nhanh',
    selectImage: 'Chọn ảnh',
    deleteImageShortcut: 'Xóa ảnh đã chọn',
    openHistoryShortcut: 'Mở lịch sử',
    openSketchpadShortcut: 'Mở bảng vẽ',
    cmdKey: 'Cmd',
    ctrlKey: 'Ctrl',
    spaceKey: 'Space',
    deleteKey: 'Delete',
    backspaceKey: 'Backspace',
    zoomIn: 'Phóng to',
    zoomOut: 'Thu nhỏ',
    resetView: 'Đặt lại chế độ xem',
    collapseSidebar: 'Thu gọn',
    expandSidebar: 'Mở rộng',
    sketchpad: 'Bảng vẽ phác thảo',
    exitFullscreen: 'Thoát toàn màn hình',
    fullscreen: 'Toàn màn hình',
    pen: 'Bút vẽ',
    eraser: 'Tẩy',
    selectColor: 'Chọn màu',
    brushSize: 'Kích thước cọ',
    undo: 'Hoàn tác',
    clearAll: 'Xóa tất cả',
    clear: 'Xóa',
    shortcutUndo: 'để hoàn tác',
    shortcutSave: 'để lưu',
    shortcutClose: 'để đóng',
    saveAndUse: 'Lưu và sử dụng',
    includeTextInImage: 'Bao gồm văn bản trong ảnh',
    thumbPostPlaceholder: 'Nhập nội dung bài viết để tạo ảnh...',
    thumbVideoPlaceholder: 'Nhập tiêu đề hoặc nội dung video...',
    aspectRatioVideo: 'Tỷ lệ video',
    aspectRatio16_9_label: 'Ngang (16:9)',
    aspectRatio9_16_label: 'Dọc (9:16)',
    thumbVideoPlaceholderTitle: 'Sẵn sàng tạo ảnh Video',
    thumbVideoPlaceholderNote1: 'Nhập nội dung video của bạn bên dưới.',
    thumbVideoPlaceholderNote2: 'AI sẽ tạo ra các phương án thumbnail phù hợp.',
    thumbVideoPlaceholderNote3: 'Chọn tỷ lệ 16:9 cho YouTube hoặc 9:16 cho Shorts/TikTok.',
    thumbPostPlaceholderTitle: 'Sẵn sàng tạo ảnh Bài viết',
    thumbPostPlaceholderNote1: 'Nhập nội dung bài viết của bạn.',
    thumbPostPlaceholderNote2: 'AI sẽ thiết kế ảnh minh họa phù hợp với thông điệp.',
    thumbPostPlaceholderNote3: 'Mặc định ảnh sẽ được tạo với tỷ lệ 1:1 cho Facebook/Instagram.',
    textInImageWarningTitle: 'Lưu ý về văn bản',
    textInImageWarningMessage: 'Việc yêu cầu AI viết chữ trực tiếp trong ảnh có thể dẫn đến lỗi chính tả. Bạn nên cân nhắc tự chèn chữ sau khi tải ảnh.',
    
    // Pro Features
    proSettings: 'Cài đặt Pro',
    editorProperties: 'Thuộc tính trình sửa',
    maskActions: 'Thao tác vùng chọn',
    invert: 'Đảo ngược',
    fill: 'Tô đầy',
    cameraPose: 'Góc máy & Tư thế',
    orientation: 'Hướng nhìn',
    angle: 'Góc máy',
    instructions: 'Hãy tô vào vùng cần sửa, sau đó nhập lệnh bên dưới.',
    editPlaceholder: 'Mô tả thay đổi (VD: Thêm kính râm, đổi màu áo...)',
    generateChanges: 'Tạo thay đổi',
    promptPlaceholder: 'Mô tả hình ảnh bạn muốn tạo...',
    promptPlaceholderRef: 'Mô tả thêm (Tùy chọn)...',
    fileTooLarge: 'Tệp quá lớn (tối đa 4MB)',
    referenceImage: 'Ảnh tham chiếu',
    uploadRefImage: 'Tải ảnh mẫu (Bắt buộc)',
    removeImage: 'Xóa ảnh',
    aspectRatioOriginal: 'Gốc',
    aspectRatio1_1: '1:1',
    aspectRatio16_9: '16:9',
    aspectRatio9_16: '9:16',
    aspectRatio4_3: '4:3',
    aspectRatio3_4: '3:4',
    backgroundAuto: 'Tự động',
    backgroundWhite: 'Trắng',
    backgroundBlack: 'Đen',
    uploadLimit3: 'Chỉ có thể tải lên tối đa 3 ảnh tham chiếu.',
    uploadLimitTotal: 'Tổng số ảnh tham chiếu không được quá 3.',
    refModeHint: 'Chế độ này sẽ thay thế nhân vật trong ảnh mẫu bằng Linh vật Riki.',
    
    // View/Angle Options
    viewFront: 'Chính diện',
    viewLeft: 'Bên trái',
    viewRight: 'Bên phải',
    viewBack: 'Từ phía sau',
    viewThreeQuarter: 'Góc 3/4',
    angleHigh: 'Từ trên xuống',
    angleEye: 'Ngang mắt',
    angleLow: 'Từ dưới lên',
    magicSelection: 'Chọn thông minh',
    panTool: 'Di chuyển',
    toggleMaskView: 'Chế độ xem mặt nạ',

    // Service Errors
    promptRole: 'Bạn là một chuyên gia thiết kế đồ họa.',
    errorPrefix: 'Lỗi trong quá trình',
    errorConsoleDetails: 'Xem console để biết chi tiết.',

    // Common
    generateBtn: 'BẮT ĐẦU TẠO ẢNH',
    downloadBtn: 'TẢI ẢNH (PNG)',
    errorNoImage: 'Không thể tạo ảnh, vui lòng thử lại.',
    billingDoc: 'https://ai.google.dev/gemini-api/docs/billing'
  },
  en: {
    tabDesign: 'Mascot Design',
    tabThumbPost: 'Post Image',
    tabThumbVideo: 'Video Image',
    tabThumbPro: 'Pro Thumbnail',
    tabStoryArc: 'Story Arc',
    comingSoon: 'Feature coming soon...',
    modeLabel: 'Design Mode',
    modeFree: 'Free',
    modeConcept: 'Character Sheet',
    modeReference: 'Reference (Remix)',
    remixOptionsLabel: 'Remix Options',
    keepBackground: 'Keep Background',
    keepPose: 'Keep Pose & Layout',
    modelLabel: 'AI Model',
    modelFlash: 'Gemini 2.5 Flash (Fast & Free)',
    modelPro: 'Gemini 3 Pro (High Quality - Needs Key)',
    // ... existing EN translations
  } as any,
  ja: {
    tabDesign: 'マスコットデザイン',
    // ... existing JA translations
  } as any,
  id: {
    tabDesign: 'Desain Maskot',
    // ... existing ID translations
  } as any
};

export type Language = keyof typeof translations;
export type Translation = typeof translations['vi'];

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translation) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');
  const t = useMemo(() => (key: keyof Translation): string => {
    const langSet = translations[language] as any;
    const viSet = translations['vi'] as any;
    return langSet[key] || viSet[key] || String(key);
  }, [language]);
  return React.createElement(I18nContext.Provider, { value: { language, setLanguage, t } }, children);
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n error');
  return context;
};
