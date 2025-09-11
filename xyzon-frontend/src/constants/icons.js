// Standardized Icons - Use these consistently across all pages
import {
    // Feather Icons (Fi) - Primary choice for UI actions
    FiTrash2,
    FiEdit3,
    FiEye,
    FiEyeOff,
    FiPlus,
    FiDownload,
    FiUpload,
    FiSave,
    FiX,
    FiCheck,
    FiAlertCircle,
    FiCheckCircle,
    FiXCircle,
    FiInfo,
    FiSearch,
    FiFilter,
    FiRefreshCw,
    FiMenu,
    FiUser,
    FiUsers,
    FiMail,
    FiLock,
    FiSettings,
    FiCalendar,
    FiClock,
    FiMapPin,
    FiPhone,
    FiFileText,
    FiImage,
    FiCamera,
    FiLogOut,
    FiChevronLeft,
    FiChevronRight,
    FiChevronDown,
    FiChevronUp,
    FiArrowLeft,
    FiArrowRight,
    FiExternalLink,
    FiCopy,
    FiShare2
} from 'react-icons/fi';

import {
    // Font Awesome Icons (Fa) - For specific contextual icons
    FaRupeeSign,
    FaCertificate,
    FaTicketAlt,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaGlobe,
    FaWifi,
    FaStar,
    FaTag,
    FaUserGraduate,
    FaAward,
    FaBriefcase,
    FaHandsHelping,
    FaLaptopCode,
    FaPaintBrush,
    FaInstagram,
    FaFacebookF,
    FaLinkedin,
    FaTwitter,
    FaPhoneAlt,
    FaEnvelope,
    FaFlag,
    FaSpinner,
    FaTrophy,
    FaMedal,
    FaGraduationCap,
    FaBuilding,
    FaIndustry
} from 'react-icons/fa';

// Standard Icon Set - Use these for consistency
export const ICONS = {
    // Actions
    DELETE: FiTrash2,         // Consistent delete icon
    EDIT: FiEdit3,           // Consistent edit icon
    ADD: FiPlus,             // Consistent add icon
    SAVE: FiSave,            // Consistent save icon
    CANCEL: FiX,             // Consistent cancel icon
    CONFIRM: FiCheck,        // Consistent confirm icon
    VIEW: FiEye,             // Consistent view icon
    HIDE: FiEyeOff,          // Consistent hide icon
    DOWNLOAD: FiDownload,    // Consistent download icon
    UPLOAD: FiUpload,        // Consistent upload icon
    SEARCH: FiSearch,        // Consistent search icon
    FILTER: FiFilter,        // Consistent filter icon
    REFRESH: FiRefreshCw,    // Consistent refresh icon
    COPY: FiCopy,           // Consistent copy icon
    SHARE: FiShare2,        // Consistent share icon
    EXTERNAL_LINK: FiExternalLink, // Consistent external link icon

    // Navigation
    MENU: FiMenu,            // Consistent menu icon
    CLOSE: FiX,              // Consistent close icon
    BACK: FiArrowLeft,       // Consistent back icon
    FORWARD: FiArrowRight,   // Consistent forward icon
    UP: FiChevronUp,         // Consistent up icon
    DOWN: FiChevronDown,     // Consistent down icon
    LEFT: FiChevronLeft,     // Consistent left icon
    RIGHT: FiChevronRight,   // Consistent right icon

    // Status & Feedback
    SUCCESS: FiCheckCircle,   // Consistent success icon
    ERROR: FiXCircle,        // Consistent error icon
    WARNING: FiAlertCircle,  // Consistent warning icon
    INFO: FiInfo,            // Consistent info icon
    LOADING: FaSpinner,      // Consistent loading icon

    // User & Auth
    USER: FiUser,            // Consistent user icon
    USERS: FiUsers,          // Consistent users icon
    LOGOUT: FiLogOut,        // Consistent logout icon
    EMAIL: FiMail,           // Consistent email icon
    PASSWORD: FiLock,        // Consistent password icon
    SETTINGS: FiSettings,    // Consistent settings icon

    // Content
    DOCUMENT: FiFileText,    // Consistent document icon
    IMAGE: FiImage,          // Consistent image icon
    CAMERA: FiCamera,        // Consistent camera icon
    CALENDAR: FiCalendar,    // Consistent calendar icon
    CLOCK: FiClock,          // Consistent clock icon
    LOCATION: FiMapPin,      // Consistent location icon
    PHONE: FiPhone,          // Consistent phone icon

    // Business Specific
    CURRENCY: FaRupeeSign,   // Currency icon
    CERTIFICATE: FaCertificate, // Certificate icon
    TICKET: FaTicketAlt,     // Ticket icon
    EVENT: FaCalendarAlt,    // Event icon
    AWARD: FaAward,          // Award icon
    TROPHY: FaTrophy,        // Trophy icon
    MEDAL: FaMedal,          // Medal icon
    GRADUATION: FaGraduationCap, // Graduation icon
    BUILDING: FaBuilding,    // Building icon
    INDUSTRY: FaIndustry,    // Industry icon

    // Social
    INSTAGRAM: FaInstagram,
    FACEBOOK: FaFacebookF,
    LINKEDIN: FaLinkedin,
    TWITTER: FaTwitter,

    // Tech
    GLOBE: FaGlobe,
    WIFI: FaWifi,
    CODE: FaLaptopCode,
    DESIGN: FaPaintBrush
};

// Size constants for consistency
export const ICON_SIZES = {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 20,
    XL: 24,
    XXL: 32
};

// Color constants for icon states
export const ICON_COLORS = {
    PRIMARY: '#0d6efd',
    SECONDARY: '#6c757d',
    SUCCESS: '#198754',
    DANGER: '#dc3545',
    WARNING: '#ffc107',
    INFO: '#0dcaf0',
    LIGHT: '#f8f9fa',
    DARK: '#212529',
    MUTED: '#6c757d'
};

export default ICONS;
