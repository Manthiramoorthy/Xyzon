import React, { useContext, useState } from 'react';
import { useMenu } from '../context/MenuContext';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

const AdminLayout = ({ children, title, showStats = true }) => {
    const { items } = useMenu();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="admin-layout">
            {/* Mobile Header with Hamburger */}
            <div className="admin-mobile-header d-md-none">
                <button
                    className="hamburger-btn"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                </button>
                {title && <h5 className="page-title">{title}</h5>}
            </div>

            {/* Side Menu Overlay */}
            {isMenuOpen && (
                <div className="menu-overlay d-md-none" onClick={() => setIsMenuOpen(false)} />
            )}

            {/* Side Menu Panel */}
            <div className={`side-menu-panel ${isMenuOpen ? 'open' : ''}`}>
                <div className="menu-header">
                    <h6>Admin Menu</h6>
                    <button
                        className="close-menu-btn d-md-none"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <FiX size={18} />
                    </button>
                </div>
                <nav className="menu-nav">
                    {items.map((item, index) => (
                        <Link
                            key={index}
                            to={item.to}
                            className={`menu-item ${location.pathname === item.to ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.icon && <span className="menu-icon">{item.icon}</span>}
                            <span className="menu-text">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="admin-main-content">
                <div className="content-wrapper">
                    <div className="content-left">
                        {title && (
                            <div className="page-header d-none d-md-block">
                                <h4 className="page-title">{title}</h4>
                            </div>
                        )}
                        <div className="content-body">
                            {children}
                        </div>
                    </div>

                </div>
            </div>

            <style jsx>{`
                .admin-layout {
                    min-height: 100vh;
                    position: relative;
                }

                .admin-mobile-header {
                    position: sticky;
                    top: 0;
                    z-index: 1020;
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .hamburger-btn {
                    background: none;
                    border: none;
                    padding: 8px;
                    border-radius: 8px;
                    color: #374151;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hamburger-btn:hover {
                    background: #f3f4f6;
                    color: #000066;
                }

                .menu-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1030;
                }

                .side-menu-panel {
                    position: fixed;
                    top: 0;
                    left: -300px;
                    width: 280px;
                    height: 100vh;
                    background: white;
                    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
                    z-index: 1040;
                    transition: left 0.3s ease;
                    overflow-y: auto;
                }

                .side-menu-panel.open {
                    left: 0;
                }

                @media (min-width: 768px) {
                    .side-menu-panel {
                        position: sticky;
                        top: 0;
                        left: 0;
                        width: 250px;
                        height: 100vh;
                        display: block;
                    }
                    
                    .admin-layout {
                        display: flex;
                    }
                    
                    .admin-main-content {
                        flex: 1;
                    }
                }

                .menu-header {
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .menu-header h6 {
                    margin: 0;
                    color: #374151;
                    font-weight: 600;
                }

                .close-menu-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    padding: 4px;
                    border-radius: 4px;
                }

                .close-menu-btn:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .menu-nav {
                    padding: 16px 0;
                }

                .menu-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    color: #374151;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    border-left: 3px solid transparent;
                    gap: 12px;
                }

                .menu-item:hover {
                    background: #f3f4f6;
                    color: #000066;
                    border-left-color: #000066;
                    text-decoration: none;
                }

                .menu-item.active {
                    background: #f0f0ff;
                    color: #000066;
                    border-left-color: #000066;
                }

                .menu-icon {
                    flex-shrink: 0;
                    font-size: 16px;
                }

                .menu-text {
                    font-weight: 500;
                    font-size: 14px;
                }

                .content-wrapper {
                    display: flex;
                    min-height: calc(100vh - 60px);
                    gap: 24px;
                    padding: 0;
                }

                @media (min-width: 768px) {
                    .content-wrapper {
                        padding: 24px;
                        min-height: 100vh;
                    }
                }

                .content-left {
                    flex: 1;
                    min-width: 0;
                }

                .content-right {
                    width: 300px;
                    flex-shrink: 0;
                }

                .page-header {
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .page-title {
                    color: #111827;
                    font-weight: 700;
                    margin: 0;
                }

                .content-body {
                    padding: 16px;
                }

                @media (min-width: 768px) {
                    .content-body {
                        padding: 0;
                    }
                }

                /* Responsive Stats on Mobile */
                @media (max-width: 1199px) {
                    .content-wrapper {
                        flex-direction: column;
                    }
                    
                    .content-right {
                        width: 100%;
                        order: -1;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminLayout;
