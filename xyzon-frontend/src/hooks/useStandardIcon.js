import ICONS, { ICON_SIZES, ICON_COLORS } from '../constants/icons';

/**
 * Hook for getting standardized icons with consistent props
 * @param {string} iconName - Name of the icon from ICONS constant
 * @param {object} options - Options for the icon
 * @returns {JSX.Element} - Icon component with standardized props
 */
export const useStandardIcon = () => {
    const getIcon = (iconName, options = {}) => {
        const {
            size = ICON_SIZES.MD,
            color,
            className = '',
            style = {},
            ...rest
        } = options;

        const IconComponent = ICONS[iconName];

        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in ICONS constant`);
            return null;
        }

        return (
            <IconComponent
                size={size}
                color={color}
                className={className}
                style={style}
                {...rest}
            />
        );
    };

    // Common icon patterns with consistent styling
    const getActionIcon = (action, options = {}) => {
        const actionIcons = {
            delete: { icon: 'DELETE', defaultColor: ICON_COLORS.DANGER },
            edit: { icon: 'EDIT', defaultColor: ICON_COLORS.PRIMARY },
            view: { icon: 'VIEW', defaultColor: ICON_COLORS.INFO },
            save: { icon: 'SAVE', defaultColor: ICON_COLORS.SUCCESS },
            cancel: { icon: 'CANCEL', defaultColor: ICON_COLORS.SECONDARY },
            add: { icon: 'ADD', defaultColor: ICON_COLORS.SUCCESS },
            download: { icon: 'DOWNLOAD', defaultColor: ICON_COLORS.PRIMARY },
            upload: { icon: 'UPLOAD', defaultColor: ICON_COLORS.PRIMARY },
            refresh: { icon: 'REFRESH', defaultColor: ICON_COLORS.PRIMARY },
            search: { icon: 'SEARCH', defaultColor: ICON_COLORS.MUTED },
            filter: { icon: 'FILTER', defaultColor: ICON_COLORS.MUTED },
        };

        const actionConfig = actionIcons[action];
        if (!actionConfig) {
            console.warn(`Action icon "${action}" not found`);
            return null;
        }

        return getIcon(actionConfig.icon, {
            color: actionConfig.defaultColor,
            size: ICON_SIZES.SM,
            ...options
        });
    };

    // Status icons with consistent coloring
    const getStatusIcon = (status, options = {}) => {
        const statusIcons = {
            success: { icon: 'SUCCESS', defaultColor: ICON_COLORS.SUCCESS },
            error: { icon: 'ERROR', defaultColor: ICON_COLORS.DANGER },
            warning: { icon: 'WARNING', defaultColor: ICON_COLORS.WARNING },
            info: { icon: 'INFO', defaultColor: ICON_COLORS.INFO },
            loading: { icon: 'LOADING', defaultColor: ICON_COLORS.PRIMARY },
        };

        const statusConfig = statusIcons[status];
        if (!statusConfig) {
            console.warn(`Status icon "${status}" not found`);
            return null;
        }

        return getIcon(statusConfig.icon, {
            color: statusConfig.defaultColor,
            ...options
        });
    };

    return {
        getIcon,
        getActionIcon,
        getStatusIcon,
        ICONS,
        ICON_SIZES,
        ICON_COLORS
    };
};

export default useStandardIcon;
