import React from 'react';
import ICONS, { ICON_SIZES } from '../constants/icons';
import './SearchBar.css';

const SearchBar = ({
    value = '',
    onChange,
    placeholder = 'Search...',
    onClear,
    className = '',
    size = 'md', // sm, md, lg
    showClearButton = true,
    disabled = false,
    style = {}
}) => {
    const handleChange = (e) => {
        e.preventDefault();
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const handleClear = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const sizeClasses = {
        sm: 'form-control-sm',
        md: '',
        lg: 'form-control-lg'
    };

    const wrapperClasses = `search-bar-wrapper ${size !== 'md' ? `search-bar-${size}` : ''} ${className}`.trim();

    return (
        <div className={wrapperClasses} style={style}>
            <div className="input-group">
                <span className="input-group-text">
                    <ICONS.SEARCH size={ICON_SIZES.MD} />
                </span>
                <input
                    type="text"
                    className={`form-control ${sizeClasses[size]}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                {showClearButton && value && !disabled && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleClear}
                        title="Clear search"
                        aria-label="Clear search"
                    >
                        <ICONS.CLOSE size={ICON_SIZES.SM} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
