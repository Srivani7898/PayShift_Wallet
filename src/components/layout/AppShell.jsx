/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Send, History, User, ReceiptText, Smartphone, Link2, 
  Bell, LogOut, Sun, Moon, Settings, Trophy, Trash2, CheckCheck, Wallet, ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/api/authService';
import { notificationService } from '../../services/api/notificationService';
import { storageService } from '../../services/storage/storage';
import { Dropdown } from '../ui/Dropdown';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { showToast } from '../ui/Toast';

export function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchUserData = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setWalletBalance(storageService.getWalletBalance());
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchNotifications();

    const handleBalanceUpdate = () => {
      setWalletBalance(storageService.getWalletBalance());
    };
    const handleNotifUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('payswift:balance_updated', handleBalanceUpdate);
    window.addEventListener('payswift:notifications_updated', handleNotifUpdate);

    return () => {
      window.removeEventListener('payswift:balance_updated', handleBalanceUpdate);
      window.removeEventListener('payswift:notifications_updated', handleNotifUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    showToast('Logged out successfully');
    navigate('/login');
  };

  const markAllAsRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
    showToast('All notifications marked as read');
  };

  const deleteNotification = async (id) => {
    const updated = await notificationService.deleteNotification(id);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const sidebarLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/send-money', label: 'Send Money', icon: Send },
    { to: '/upi', label: 'UPI QR', icon: Link2 },
    { to: '/recharge', label: 'Recharges', icon: Smartphone },
    { to: '/bills', label: 'Bill Payments', icon: ReceiptText },
    { to: '/transactions', label: 'Transactions', icon: History },
    { to: '/rewards', label: 'Rewards', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const mobileNavLinks = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/send-money', label: 'Send', icon: Send },
    { to: '/upi', label: 'UPI QR', icon: Link2 },
    { to: '/transactions', label: 'History', icon: History },
    { to: '/rewards', label: 'Rewards', icon: Trophy },
  ];

  const profileMenuItems = [
    { label: 'My Profile', icon: User, onClick: () => navigate('/profile') },
    { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
    { divider: true },
    { label: 'Logout', icon: LogOut, onClick: handleLogout, danger: true }
  ];

  // Helper to determine active link
  const isActiveRoute = (path) => location.pathname === path;

  return (
    <div className="payswift-animated-bg min-h-screen pb-20 md:pb-6 md:pl-24 xl:pl-64 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-150 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 shadow-sm backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <span className="payswift-logo-mark grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg shadow-brand-500/25">
                <Wallet size={20} />
              </span>
              <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white uppercase">
                PayShift
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Quick view */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-black">
              <span className="text-slate-400 dark:text-slate-500">Wallet:</span>
              <span className="text-brand-700 dark:text-brand-500">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-500 transition shadow-sm backdrop-blur-xl"
            >
              {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>

            {/* Notification trigger */}
            <button
              onClick={() => setIsNotifOpen(true)}
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-500 transition shadow-sm backdrop-blur-xl"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-4 ring-white dark:ring-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            {user && (
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 text-sm font-bold shadow-sm backdrop-blur-xl transition hover:border-slate-350 dark:hover:border-slate-700">
                    <User size={16} className="text-slate-400" />
                    <span className="hidden sm:inline text-slate-700 dark:text-slate-200">{user.name.split(' ')[0]}</span>
                  </button>
                }
                items={profileMenuItems}
              />
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop and Large Screens */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-20 xl:w-60 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/85 p-4 shadow-sm backdrop-blur-2xl transition-all duration-200 md:block">
        <div className="flex flex-col h-full">
          {/* Sidebar Brand Logo (Desktop) */}
          <div className="mb-8 hidden xl:flex items-center gap-3 px-3 py-2">
            <span className="payswift-logo-mark grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg">
              <Wallet size={20} />
            </span>
            <span className="text-lg font-black tracking-widest text-slate-900 dark:text-white uppercase">
              PayShift
            </span>
          </div>

          <div className="mb-8 flex xl:hidden justify-center px-1 py-2">
            <span className="payswift-logo-mark grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg">
              <Wallet size={20} />
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const active = isActiveRoute(link.to);
              
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`flex h-12 items-center gap-3 rounded-2xl px-4 transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                  } justify-center xl:justify-start`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="hidden xl:block text-sm font-black">{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Logout bottom of sidebar */}
          <button
            onClick={handleLogout}
            className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all duration-200 justify-center xl:justify-start"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="hidden xl:block text-sm font-black">Logout</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile Screens */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-[0_-16px_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl md:hidden">
        <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${mobileNavLinks.length}, minmax(0, 1fr))` }}>
          {mobileNavLinks.map((link) => {
            const Icon = link.icon;
            const active = isActiveRoute(link.to);
            
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center justify-center gap-1.5 text-[10px] font-black ${
                  active ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon size={19} className={active ? 'scale-105 transition-transform' : ''} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-5 md:px-6">
        {children}
      </main>

      {/* Notification Center Drawer */}
      <Drawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        title="Notification Center"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-semibold text-slate-400">
              {notifications.length} alerts total
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-black text-brand-700 dark:text-brand-500 hover:underline"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
              <p className="text-sm font-bold text-slate-400">All caught up!</p>
              <p className="mt-1 text-xs text-slate-500">No new alerts found.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`relative flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                    item.read
                      ? 'border-slate-100 dark:border-slate-850/80 bg-slate-50/50 dark:bg-slate-900/30'
                      : 'border-brand-100 dark:border-brand-950/20 bg-brand-50/10 dark:bg-brand-950/5'
                  }`}
                >
                  {/* Unread indicator bullet */}
                  {!item.read && (
                    <span className="absolute top-4 left-2.5 h-2 w-2 rounded-full bg-brand-500" />
                  )}
                  
                  <div className={`min-w-0 flex-1 pl-1.5`}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 leading-tight">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => deleteNotification(item.id)}
                        className="text-slate-400 hover:text-red-500 transition p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="mt-2.5 block text-[10px] font-bold text-slate-400 dark:text-slate-600">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

export default AppShell;
